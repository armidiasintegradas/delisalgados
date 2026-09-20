import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { isServerSupabaseConfigured, createSupabaseServerClient, supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items, paymentPlan } = body;

    if (!customer || !items) {
      return NextResponse.json({ error: "Dados incompletos para criação do pedido." }, { status: 400 });
    }

    if (process.env.NODE_ENV === "production" && !isServerSupabaseConfigured && process.env.DELI_ALLOW_LOCAL_DB !== "true") {
      return NextResponse.json(
        { error: "Pedidos temporariamente indisponíveis. Banco de dados não configurado." },
        { status: 503 }
      );
    }

    const sessionClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = sessionClient ? await sessionClient.auth.getUser() : { data: { user: null } };

    const customerName = String(customer.customerName || "").trim();
    const customerPhone = String(customer.customerPhone || "").trim();
    const phoneDigits = customerPhone.replace(/\D/g, "");
    const customerEmail = String(customer.customerEmail || "").trim().toLowerCase();
    const deliveryAddress = String(customer.deliveryAddress || "").trim();
    const referencePoint = String(customer.referencePoint || "").trim();
    const desiredDate = String(customer.desiredDate || "").trim();
    const fulfillmentType = String(customer.fulfillmentType || "").trim();

    // Registration data are mandatory for the first order and remain required thereafter.
    if (
      !customerName ||
      !customerPhone ||
      phoneDigits.length < 10 ||
      !customerEmail ||
      !/^\S+@\S+\.\S+$/.test(customerEmail) ||
      !deliveryAddress ||
      !referencePoint ||
      !desiredDate ||
      !fulfillmentType
    ) {
      return NextResponse.json(
        { error: "Preencha todos os dados obrigatórios do cadastro antes de continuar.", code: "CUSTOMER_DATA_REQUIRED" },
        { status: 400 }
      );
    }

    if (supabaseServer) {
      // Existing customers must authenticate before placing another order.
      // Match either e-mail or normalized WhatsApp so a duplicate identity cannot create a second account.
      const [{ data: profiles }, { data: previousOrders }] = await Promise.all([
        supabaseServer
          .from("customer_profiles")
          .select("id,email,whatsapp")
          .or(`email.ilike.${customerEmail},whatsapp.eq.${customerPhone}`),
        supabaseServer
          .from("orders")
          .select("customer_user_id,customer_email,customer_phone")
          .or(`customer_email.ilike.${customerEmail},customer_phone.eq.${customerPhone}`)
          .limit(20),
      ]);

      const matchesPhone = (value?: string | null) =>
        String(value || "").replace(/\D/g, "") === phoneDigits;

      const matchingProfiles = (profiles || []).filter(
        (p: any) => String(p.email || "").toLowerCase() === customerEmail || matchesPhone(p.whatsapp)
      );
      const matchingOrders = (previousOrders || []).filter(
        (o: any) => String(o.customer_email || "").toLowerCase() === customerEmail || matchesPhone(o.customer_phone)
      );

      const hasKnownIdentity = matchingProfiles.length > 0 || matchingOrders.length > 0;

      if (!user && hasKnownIdentity) {
        return NextResponse.json(
          {
            error: "Este e-mail ou WhatsApp já pertence a um cliente Deli. Use “Já sou cliente” e faça seu login para continuar.",
            code: "CUSTOMER_LOGIN_REQUIRED",
          },
          { status: 409 }
        );
      }

      if (user) {
        const authEmail = String(user.email || "").trim().toLowerCase();
        if (!authEmail || authEmail !== customerEmail) {
          return NextResponse.json(
            {
              error: "O e-mail do pedido deve ser o mesmo da conta Deli conectada.",
              code: "CUSTOMER_IDENTITY_MISMATCH",
            },
            { status: 409 }
          );
        }

        const conflictingProfile = matchingProfiles.find((p: any) => p.id !== user.id);
        const conflictingOrder = matchingOrders.find(
          (o: any) => o.customer_user_id && o.customer_user_id !== user.id
        );

        if (conflictingProfile || conflictingOrder) {
          return NextResponse.json(
            {
              error: "Este WhatsApp ou e-mail já está vinculado a outra conta Deli.",
              code: "CUSTOMER_IDENTITY_CONFLICT",
            },
            { status: 409 }
          );
        }
      }
    }

    // SERVER-SIDE AUTHORITY: calculate prices, snapshots, validation, transactional RPC
    const result = await DbService.createOrder({
      customer,
      items,
      customerUserId: user?.id || null,
      paymentPlan: paymentPlan === "full" ? "full" : "deposit_50"
    });
    const { handoffToken, ...orderData } = result;

    return NextResponse.json(
      {
        success: true,
        order: orderData,
        handoffToken: handoffToken,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating order:", error);
    const status = error.status || 400;
    return NextResponse.json({ error: error.message || "Falha ao processar pedido" }, { status });
  }
}

export async function GET(request: Request) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Acesso restrito a administradores." }, { status: auth.status });
  }

  try {
    const orders = await DbService.getOrders();
    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.message || "Erro ao buscar pedidos" }, { status: 500 });
  }
}

