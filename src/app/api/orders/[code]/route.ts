import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/adminAuth";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Acesso restrito a administradores." }, { status: auth.status });
  }

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
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error || "Acesso restrito a administradores." }, { status: auth.status });
  }

  try {
    const { code } = await context.params;
    const body = await request.json();
    const order = await DbService.getOrderByCode(code);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    if (body.status) {
      if (
        (body.status === "confirmed" || body.status === "preparing") &&
        order.payment_status !== "paid" &&
        order.payment_status !== "partially_paid"
      ) {
        return NextResponse.json(
          { error: "Confirme o recebimento do Pix antes de confirmar ou preparar o pedido." },
          { status: 409 }
        );
      }

      await DbService.updateOrderStatus(order.id, body.status);
    }

    if (body.whatsapp_status) {
      await DbService.updateOrderWhatsAppStatus(order.id, body.whatsapp_status);
    }

    if (body.payment_status) {
      await DbService.updateOrderPaymentStatus(order.id, body.payment_status);
    }

    const updated = await DbService.getOrderByCode(code);
    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro ao atualizar pedido" }, { status: 500 });
  }
}

