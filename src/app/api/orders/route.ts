import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items } = body;

    if (!customer || !items) {
      return NextResponse.json({ error: "Dados incompletos para criação do pedido." }, { status: 400 });
    }

    // SERVER-SIDE AUTHORITY: calculate prices, snapshots, validation
    const order = await DbService.createOrder({ customer, items });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: error.message || "Falha ao processar pedido" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const orders = await DbService.getOrders();
    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.message || "Erro ao buscar pedidos" }, { status: 500 });
  }
}
