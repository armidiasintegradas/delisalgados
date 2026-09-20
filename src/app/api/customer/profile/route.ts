import { NextResponse } from "next/server";
import { createSupabaseServerClient, supabaseServer } from "@/lib/supabase/server";

async function getUser() {
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user || !supabaseServer) {
    return NextResponse.json({ authenticated: false, profile: null });
  }

  const { data: existing } = await supabaseServer
    .from("customer_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ authenticated: true, profile: existing });
  }

  const email = (user.email || "").toLowerCase();
  const { data: latestOrder } = await supabaseServer
    .from("orders")
    .select("customer_name, customer_phone, customer_email, delivery_address, customer_reference_point")
    .eq("customer_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestOrder) {
    return NextResponse.json({
      authenticated: true,
      profile: {
        id: user.id,
        email,
        full_name: "",
        whatsapp: "",
        address: "",
        reference_point: "",
        avatar_url: null,
      },
    });
  }

  const profile = {
    id: user.id,
    email,
    full_name: latestOrder.customer_name || "",
    whatsapp: latestOrder.customer_phone || "",
    address: latestOrder.delivery_address || "",
    reference_point: latestOrder.customer_reference_point || "",
    avatar_url: null,
    updated_at: new Date().toISOString(),
  };

  await supabaseServer.from("customer_profiles").upsert(profile, { onConflict: "id" });
  await supabaseServer
    .from("orders")
    .update({ customer_user_id: user.id })
    .eq("customer_email", email)
    .is("customer_user_id", null);

  return NextResponse.json({ authenticated: true, profile });
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user || !supabaseServer) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const profile = {
    id: user.id,
    email: (user.email || body.email || "").toLowerCase(),
    full_name: String(body.full_name || "").trim(),
    whatsapp: String(body.whatsapp || "").trim(),
    address: String(body.address || "").trim(),
    reference_point: String(body.reference_point || "").trim(),
    avatar_url: body.avatar_url ? String(body.avatar_url).trim() : null,
    updated_at: new Date().toISOString(),
  };

  if (!profile.full_name || !profile.whatsapp || !profile.address || !profile.reference_point) {
    return NextResponse.json({ error: "Preencha todos os dados obrigatórios." }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("customer_profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
