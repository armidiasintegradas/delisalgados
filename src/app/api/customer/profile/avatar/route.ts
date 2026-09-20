import { NextResponse } from "next/server";
import { createSupabaseServerClient, supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const client = await createSupabaseServerClient();
  if (!client || !supabaseServer) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: { user } } = await client.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const avatarUrl = body?.avatar_url ? String(body.avatar_url).trim() : null;

    const { data, error } = await supabaseServer
      .from("customer_profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível atualizar a foto do perfil." },
      { status: 500 }
    );
  }
}
