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

    const allowedStatuses = new Set([
      "generated",
      "contacted",
      "confirmed",
      "preparing",
      "ready",
      "completed",
      "cancelled",
    ]);
    const allowedPaymentStatuses = new Set([
      "pending",
      "partially_paid",
      "paid",
      "failed",
      "refunded",
    ]);

    if (body.status && !allowedStatuses.has(body.status)) {
      return NextResponse.json({ error: "Status do pedido inválido." }, { status: 400 });
    }
    if (body.payment_status && !allowedPaymentStatuses.has(body.payment_status)) {
      return NextResponse.json({ error: "Status de pagamento inválido." }, { status: 400 });
    }

    const order = await DbService.getOrderByCode(code);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    if (body.status) {
      if (
        (body.status === "confirmed" || body.status === "preparing" || body.status === "ready") &&
        order.payment_status !== "paid" &&
        order.payment_status !== "partially_paid"
      ) {
        return NextResponse.json(
          { error: "Confirme o recebimento do Pix antes de receber, preparar ou liberar o pedido." },
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



export async function DELETE(request: Request, context: { params: Promise<{ code: string }> }) {
  const auth = await verifyAdminSession(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || "Acesso restrito a administradores." },
      { status: auth.status }
    );
  }

  try {
    const { code } = await context.params;
    const order = await DbService.getOrderByCode(code);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const deleted = await DbService.deleteOrder(order.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Não foi possível excluir o pedido." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted_code: order.public_code,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao excluir pedido" },
      { status: 500 }
    );
  }
}
