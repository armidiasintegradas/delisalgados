import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { buildAuthCallbackUrl } from "@/lib/appUrl";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Recuperação de senha indisponível." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    // A customer may already exist in Auth and have orders before a
    // customer_profiles row is created. Password recovery must therefore not
    // depend on the profile table.
    const [{ data: profile }, { data: order }] = await Promise.all([
      supabaseServer
        .from("customer_profiles")
        .select("id,email")
        .eq("email", email)
        .maybeSingle(),
      supabaseServer
        .from("orders")
        .select("id,customer_email,customer_name,customer_phone")
        .eq("customer_email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Keep response neutral for truly unknown e-mails.
    if (!profile && !order) {
      return NextResponse.json({
        success: true,
        email_queued: false,
        message: "Se este e-mail estiver cadastrado, enviaremos um link de redefinição.",
      });
    }

    // Some customers may have orders/profile records but no Auth identity yet.
    // In that case a password-reset request is silently useless, because there
    // is no Auth user to receive the recovery flow. Provision the Auth identity
    // first, then request the recovery e-mail.
    let authUser: any = null;
    let page = 1;

    while (!authUser && page <= 10) {
      const { data, error } = await supabaseServer.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) throw error;

      authUser = (data.users || []).find(
        (user) => String(user.email || "").trim().toLowerCase() === email
      );

      if (!data.users || data.users.length < 200) break;
      page += 1;
    }

    if (!authUser) {
      const fallbackName = String((order as any)?.customer_name || "").trim();
      const fallbackPhone = String((order as any)?.customer_phone || "").trim();

      const { data, error } = await supabaseServer.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fallbackName,
          whatsapp: fallbackPhone,
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

    const { error } = await supabaseServer.auth.resetPasswordForEmail(email, {
      redirectTo: buildAuthCallbackUrl("/auth/redefinir-senha"),
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      email_queued: true,
      message: "Solicitação de redefinição aceita. Enviamos um link para seu e-mail. Verifique também Spam, Lixo Eletrônico e Promoções.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível enviar o link de redefinição." },
      { status: 500 }
    );
  }
}
