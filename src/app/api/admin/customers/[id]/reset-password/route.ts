import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { supabaseServer } from "@/lib/supabase/server";
import { buildAuthCallbackUrl } from "@/lib/appUrl";

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

    const { data: profile, error: profileError } = await supabaseServer
      .from("customer_profiles")
      .select("id,email,full_name")
      .eq("id", id)
      .single();

    if (profileError || !profile?.email) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    const redirectTo = buildAuthCallbackUrl("/auth/redefinir-senha");
    const { error } = await supabaseServer.auth.resetPasswordForEmail(
      String(profile.email).trim().toLowerCase(),
      { redirectTo }
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Link de redefinição enviado para ${profile.email}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível enviar o link de redefinição." },
      { status: 500 }
    );
  }
}
