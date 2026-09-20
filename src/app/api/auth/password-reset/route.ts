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

    const { data: profile } = await supabaseServer
      .from("customer_profiles")
      .select("id,email")
      .eq("email", email)
      .maybeSingle();

    // Keep response neutral for unknown e-mails.
    if (!profile) {
      return NextResponse.json({
        success: true,
        message: "Se este e-mail estiver cadastrado, enviaremos um link de redefinição.",
      });
    }

    const { error } = await supabaseServer.auth.resetPasswordForEmail(email, {
      redirectTo: buildAuthCallbackUrl("/auth/redefinir-senha"),
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Enviamos um link para seu e-mail. Verifique também Spam, Lixo Eletrônico e Promoções.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível enviar o link de redefinição." },
      { status: 500 }
    );
  }
}
