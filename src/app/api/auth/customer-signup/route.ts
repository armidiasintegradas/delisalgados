import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { buildAuthCallbackUrl } from "@/lib/appUrl";

export const runtime = "nodejs";

function normalizePhone(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Cadastro temporariamente indisponível." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const fullName = String(body?.fullName || "").trim();
    const whatsapp = String(body?.whatsapp || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const phoneDigits = normalizePhone(whatsapp);

    if (fullName.length < 3) {
      return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
    }
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: "Informe um WhatsApp válido." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const { data: profiles } = await supabaseServer
      .from("customer_profiles")
      .select("id,email,whatsapp");

    const profileConflict = (profiles || []).find((profile: any) => {
      const sameEmail = String(profile.email || "").trim().toLowerCase() === email;
      const samePhone = normalizePhone(profile.whatsapp || "") === phoneDigits;
      return sameEmail || samePhone;
    });

    if (profileConflict) {
      return NextResponse.json(
        {
          error: "Já existe uma conta Deli com este e-mail ou WhatsApp. Use Entrar ou Esqueci minha senha.",
          code: "ACCOUNT_EXISTS",
        },
        { status: 409 }
      );
    }

    let existingAuthUser = false;
    let page = 1;
    while (page <= 10 && !existingAuthUser) {
      const { data, error } = await supabaseServer.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      existingAuthUser = (data.users || []).some(
        (user) => String(user.email || "").trim().toLowerCase() === email
      );
      if (!data.users || data.users.length < 200) break;
      page += 1;
    }

    if (existingAuthUser) {
      return NextResponse.json(
        {
          error: "Este e-mail já possui acesso Deli. Use Entrar ou Esqueci minha senha.",
          code: "ACCOUNT_EXISTS",
        },
        { status: 409 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: "Serviço de cadastro não configurado." }, { status: 503 });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await authClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildAuthCallbackUrl("/perfil"),
        data: {
          full_name: fullName,
          whatsapp,
        },
      },
    });

    if (error) throw error;

    // If email confirmation is enabled, session is null and Supabase has accepted
    // the confirmation email request. If it is disabled, the account is usable immediately.
    const needsEmailConfirmation = !data.session;

    return NextResponse.json({
      success: true,
      needs_email_confirmation: needsEmailConfirmation,
      email_queued: needsEmailConfirmation,
      message: needsEmailConfirmation
        ? "Conta criada. Enviamos um e-mail de confirmação. Verifique também Spam, Lixo Eletrônico e Promoções."
        : "Conta criada com sucesso. Você já pode entrar.",
    });
  } catch (error: any) {
    const raw = String(error?.message || "");
    const friendly =
      /rate limit/i.test(raw)
        ? "Muitos e-mails foram solicitados em pouco tempo. Aguarde alguns minutos e tente novamente."
        : /already registered|already been registered/i.test(raw)
          ? "Este e-mail já possui uma conta Deli. Use Entrar ou Esqueci minha senha."
          : raw || "Não foi possível criar sua conta agora.";

    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
