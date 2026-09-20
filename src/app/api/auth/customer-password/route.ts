import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizePhone(value: string) {
  return String(value || "").replace(/\D/g, "");
}

export async function POST(request: Request) {
  if (!supabaseServer) {
    return NextResponse.json({ error: "Criação de senha indisponível." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const phone = normalizePhone(body?.phone || "");
    const orderCode = String(body?.orderCode || "").trim().toUpperCase();
    const password = String(body?.password || "");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (phone.length < 10) {
      return NextResponse.json({ error: "Informe o WhatsApp usado no pedido." }, { status: 400 });
    }
    if (!/^DL-\d{4,}$/.test(orderCode)) {
      return NextResponse.json({ error: "Informe um código de pedido válido, como DL-0001." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseServer
      .from("orders")
      .select("id,customer_name,customer_phone,customer_email,delivery_address,customer_reference_point")
      .eq("public_code", orderCode)
      .maybeSingle();

    if (orderError) throw orderError;

    const orderEmail = String(order?.customer_email || "").trim().toLowerCase();
    const orderPhone = normalizePhone(order?.customer_phone || "");

    if (!order || orderEmail !== email || orderPhone !== phone) {
      return NextResponse.json(
        { error: "Os dados não conferem com o pedido informado." },
        { status: 403 }
      );
    }

    let authUser: any = null;
    let page = 1;

    while (!authUser && page <= 10) {
      const { data, error } = await supabaseServer.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) throw error;

      authUser = (data.users || []).find(
        (user) => String(user.email || "").toLowerCase() === email
      );

      if (!data.users || data.users.length < 200) break;
      page += 1;
    }

    if (!authUser) {
      const { data, error } = await supabaseServer.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: order.customer_name || "",
          whatsapp: order.customer_phone || "",
        },
      });
      if (error) throw error;
      authUser = data.user;
    } else {
      const { data, error } = await supabaseServer.auth.admin.updateUserById(
        authUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            ...(authUser.user_metadata || {}),
            full_name: order.customer_name || authUser.user_metadata?.full_name || "",
            whatsapp: order.customer_phone || authUser.user_metadata?.whatsapp || "",
          },
        }
      );
      if (error) throw error;
      authUser = data.user;
    }

    await supabaseServer
      .from("orders")
      .update({ customer_user_id: authUser.id, updated_at: new Date().toISOString() })
      .eq("customer_email", email);

    const profilePayload = {
      id: authUser.id,
      email,
      full_name: order.customer_name || "",
      whatsapp: order.customer_phone || "",
      address: order.delivery_address || "",
      reference_point: order.customer_reference_point || "",
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabaseServer
      .from("customer_profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError && profileError.code !== "23505") {
      console.warn("Customer profile backfill notice:", profileError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Senha criada com sucesso. Você já pode entrar na sua conta Deli.",
    });
  } catch (error: any) {
    console.error("Customer password setup error:", error);
    return NextResponse.json(
      { error: error?.message || "Não foi possível criar sua senha agora." },
      { status: 500 }
    );
  }
}
