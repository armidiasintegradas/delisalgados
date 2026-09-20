import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
    const { data: byId } = await supabaseServer.auth.admin.getUserById(id);
    authUser = byId.user || null;

    if (!authUser && profile?.email) {
      let page = 1;
      while (!authUser && page <= 20) {
        const { data, error } = await supabaseServer.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        authUser = (data.users || []).find(
          (user) => String(user.email || "").trim().toLowerCase() === String(profile.email).trim().toLowerCase()
        );
        if (!data.users || data.users.length < 200) break;
        page += 1;
      }
    }

    if (!authUser && profile?.email) {
      const { data, error } = await supabaseServer.auth.admin.createUser({
        email: String(profile.email).trim().toLowerCase(),
        email_confirm: true,
        user_metadata: {
          full_name: profile.full_name || "",
          whatsapp: profile.whatsapp || "",
        },
      });
      if (error) throw error;
      authUser = data.user;
    } else if (authUser) {
      const { data, error } = await supabaseServer.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          full_name: profile?.full_name || authUser.user_metadata?.full_name || "",
          whatsapp: profile?.whatsapp || authUser.user_metadata?.whatsapp || "",
        },
      });
      if (error) throw error;
      authUser = data.user;
    }

    if (!authUser) {
      return NextResponse.json({ error: "Não foi possível localizar ou criar o acesso deste cliente." }, { status: 404 });
    }

    // Repair profile id if this is a legacy profile whose id differs from Auth.
    if (profile && profile.id !== authUser.id) {
      const repaired = { ...profile, id: authUser.id, updated_at: new Date().toISOString() };
      delete (repaired as any).created_at;
      await supabaseServer.from("customer_profiles").upsert(repaired, { onConflict: "id" });
    }

    await supabaseServer
      .from("orders")
      .update({ customer_user_id: authUser.id, updated_at: new Date().toISOString() })
      .eq("customer_email", String(authUser.email || profile?.email || "").trim().toLowerCase());

    return NextResponse.json({
      success: true,
      message: "Acesso ativado. Se o cliente já definiu uma senha, ele pode entrar imediatamente.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível ativar o acesso." },
      { status: 500 }
    );
  }
}
