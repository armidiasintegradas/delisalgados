import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { supabaseServer } from "@/lib/supabase/server";
import { buildAuthCallbackUrl } from "@/lib/appUrl";

export const runtime = "nodejs";

async function findAuthUserByEmail(email: string) {
  if (!supabaseServer) return null;
  let page = 1;
  while (page <= 20) {
    const { data, error } = await supabaseServer.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = (data.users || []).find(
      (user) => String(user.email || "").trim().toLowerCase() === email
    );
    if (found) return found;
    if (!data.users || data.users.length < 200) break;
    page += 1;
  }
  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminSession(request, { requiredRole: "administrator" });
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Ação restrita a administradores." },
      { status: auth.status }
    );
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: "Supabase indisponível." }, { status: 503 });
  }

  try {
    const { id } = await context.params;

    const { data: profile } = await supabaseServer
      .from("customer_profiles")
      .select("id,email,full_name,whatsapp")
      .eq("id", id)
      .maybeSingle();

    let authUser: any = null;
    try {
      const { data } = await supabaseServer.auth.admin.getUserById(id);
      authUser = data.user || null;
    } catch {
      authUser = null;
    }

    const email = String(profile?.email || authUser?.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    if (!authUser) {
      authUser = await findAuthUserByEmail(email);
    }

    if (!authUser) {
      const { data, error } = await supabaseServer.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: profile?.full_name || "",
          whatsapp: profile?.whatsapp || "",
        },
      });
      if (error) throw error;
      authUser = data.user;
    } else if (!authUser.email_confirmed_at) {
      const { data, error } = await supabaseServer.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
      });
      if (error) throw error;
      authUser = data.user;
    }

    if (authUser?.id) {
      await supabaseServer
        .from("orders")
        .update({ customer_user_id: authUser.id, updated_at: new Date().toISOString() })
        .eq("customer_email", email);
    }

    const redirectTo = buildAuthCallbackUrl("/auth/redefinir-senha");
    const { error } = await supabaseServer.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      email_queued: true,
      message: `Solicitação de redefinição aceita para ${email}. O acesso também foi ativado.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível enviar o link de redefinição." },
      { status: 500 }
    );
  }
}
