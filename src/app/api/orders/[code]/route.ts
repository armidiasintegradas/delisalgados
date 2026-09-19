import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const order = await DbService.getOrderByCode(code);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao buscar pedido" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const order = await DbService.getOrderByCode(code);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    if (body.status) {
      await DbService.updateOrderStatus(order.id, body.status);
    }

    const updated = await DbService.getOrderByCode(code);
    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar pedido" }, { status: 500 });
  }
}
