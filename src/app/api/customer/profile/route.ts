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
    .select("customer_name, customer_phone, customer_email, delivery_address, customer_reference_point, customer_postal_code, customer_street, customer_address_number, customer_complement, customer_neighborhood, customer_city, customer_state")
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
        postal_code: "",
        street: "",
        address_number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
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
    postal_code: latestOrder.customer_postal_code || "",
    street: latestOrder.customer_street || "",
    address_number: latestOrder.customer_address_number || "",
    complement: latestOrder.customer_complement || "",
    neighborhood: latestOrder.customer_neighborhood || "",
    city: latestOrder.customer_city || "",
    state: latestOrder.customer_state || "",
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
    postal_code: String(body.postal_code || "").replace(/\D/g, "").trim() || null,
    street: String(body.street || "").trim() || null,
    address_number: String(body.address_number || "").trim() || null,
    complement: String(body.complement || "").trim() || null,
    neighborhood: String(body.neighborhood || "").trim() || null,
    city: String(body.city || "").trim() || null,
    state: String(body.state || "").trim().toUpperCase() || null,
    reference_point: String(body.reference_point || "").trim(),
    avatar_url: body.avatar_url ? String(body.avatar_url).trim() : null,
    updated_at: new Date().toISOString(),
  };

  const structuredAddressStarted = Boolean(
    profile.postal_code ||
    profile.street ||
    profile.address_number ||
    profile.neighborhood ||
    profile.city ||
    profile.state
  );

  if (
    !profile.full_name ||
    !profile.whatsapp ||
    !profile.address ||
    !profile.reference_point ||
    (structuredAddressStarted &&
      (
        !profile.postal_code ||
        !profile.street ||
        !profile.address_number ||
        !profile.neighborhood ||
        !profile.city ||
        !profile.state
      ))
  ) {
    return NextResponse.json({ error: "Preencha todos os dados obrigatórios." }, { status: 400 });
  }

  const phoneDigits = profile.whatsapp.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return NextResponse.json({ error: "Informe um WhatsApp válido." }, { status: 400 });
  }

  // Do not allow a second customer account to reuse an existing e-mail or WhatsApp.
  const { data: otherProfiles } = await supabaseServer
    .from("customer_profiles")
    .select("id,email,whatsapp")
    .neq("id", user.id);

  const identityConflict = (otherProfiles || []).some((other: any) => {
    const sameEmail = String(other.email || "").trim().toLowerCase() === profile.email;
    const samePhone =
      String(other.whatsapp || "").replace(/\D/g, "") === phoneDigits;
    return sameEmail || samePhone;
  });

  if (identityConflict) {
    return NextResponse.json(
      {
        error: "Este e-mail ou WhatsApp já está cadastrado em outra conta Deli.",
        code: "CUSTOMER_IDENTITY_CONFLICT",
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabaseServer
    .from("customer_profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        {
          error: "Este e-mail ou WhatsApp já está cadastrado em outra conta Deli.",
          code: "CUSTOMER_IDENTITY_CONFLICT",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
