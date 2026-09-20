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
      const { data: identityState, error: identityError } = await supabaseServer.rpc(
        "check_deli_customer_identity",
        {
          p_email: customerEmail,
          p_phone: customerPhone,
          p_user_id: user?.id || null,
        }
      );

      if (identityError) {
        console.error("Customer identity guard failed:", identityError);
        return NextResponse.json(
          { error: "Não foi possível validar seu cadastro agora. Tente novamente.", code: "CUSTOMER_IDENTITY_CHECK_FAILED" },
          { status: 503 }
        );
      }

      const hasKnownIdentity = Boolean(identityState?.known);
      const hasIdentityConflict = Boolean(identityState?.conflict);

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

        if (hasIdentityConflict) {
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

