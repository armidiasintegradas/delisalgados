import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { isServerSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items } = body;

    if (!customer || !items) {
      return NextResponse.json({ error: "Dados incompletos para criação do pedido." }, { status: 400 });
    }

    if (process.env.NODE_ENV === "production" && !isServerSupabaseConfigured && process.env.DELI_ALLOW_LOCAL_DB !== "true") {
      return NextResponse.json(
        { error: "Pedidos temporariamente indisponíveis. Banco de dados não configurado." },
        { status: 503 }
      );
    }

    // SERVER-SIDE AUTHORITY: calculate prices, snapshots, validation, transactional RPC
    const result = await DbService.createOrder({ customer, items });
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

