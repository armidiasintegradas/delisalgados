import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

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

    const postalCode = String(body?.postalCode || "").replace(/\D/g, "");
    const street = String(body?.street || "").trim();
    const addressNumber = String(body?.addressNumber || "").trim();
    const complement = String(body?.complement || "").trim();
    const neighborhood = String(body?.neighborhood || "").trim();
    const city = String(body?.city || "").trim();
    const state = String(body?.state || "").trim().toUpperCase();
    const referencePoint = String(body?.referencePoint || "").trim();

    if (
      postalCode.length !== 8 ||
      !street ||
      !addressNumber ||
      !neighborhood ||
      !city ||
      state.length !== 2 ||
      !referencePoint
    ) {
      return NextResponse.json(
        { error: "Complete CEP, rua, número, bairro, cidade, UF e ponto de referência." },
        { status: 400 }
      );
    }

    const address = [
      [street, addressNumber].filter(Boolean).join(", "),
      complement,
      neighborhood,
      [city, state].join(" - "),
      `CEP ${postalCode.replace(/^(\d{5})(\d{3})$/, "$1-$2")}`,
    ]
      .filter(Boolean)
      .join(" · ");

    const { data: created, error: createError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        whatsapp,
      },
    });

    if (createError) throw createError;
    if (!created.user?.id) throw new Error("Conta criada sem identificador de usuário.");

    const profilePayload = {
      id: created.user.id,
      email,
      full_name: fullName,
      whatsapp,
      address,
      postal_code: postalCode,
      street,
      address_number: addressNumber,
      complement: complement || null,
      neighborhood,
      city,
      state,
      reference_point: referencePoint,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseServer
      .from("customer_profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      await supabaseServer.auth.admin.deleteUser(created.user.id);
      throw profileError;
    }

    return NextResponse.json({
      success: true,
      needs_email_confirmation: false,
      email_queued: false,
      message: "Conta criada com sucesso. Sua senha já está ativa e você pode entrar agora.",
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
