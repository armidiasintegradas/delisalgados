import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";
import {
  createMercadoPagoPixOrder,
  extractMercadoPagoPix,
  getMercadoPagoOrder,
  isMercadoPagoConfigured,
  mercadoPagoOrderIsPaid,
} from "@/lib/payments/mercadoPago";

export const runtime = "nodejs";

function targetPaymentStatus(order: any) {
  return order.payment_plan === "full" ? "paid" : "partially_paid";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body?.code || "").trim().toUpperCase();
    const token = String(body?.token || "").trim();

    if (!code || !token) {
      return NextResponse.json(
        { error: "Código e token do pedido são obrigatórios." },
        { status: 400 }
      );
    }

    const order = await DbService.getOrderByHandoffToken(code, token);
    if (!order) {
      return NextResponse.json(
        { error: "Pedido não localizado ou acesso expirado." },
        { status: 404 }
      );
    }

    if (order.payment_status === "paid" || order.payment_status === "partially_paid") {
      return NextResponse.json({
        success: true,
        confirmed: true,
        payment_status: order.payment_status,
        provider: order.payment_provider || null,
      });
    }

    if (!isMercadoPagoConfigured()) {
      return NextResponse.json({
        success: true,
        confirmed: false,
        mode: "static",
        provider: null,
      });
    }

    let providerOrder: any;

    if (order.payment_provider === "mercadopago" && order.payment_reference) {
      providerOrder = await getMercadoPagoOrder(order.payment_reference);
    } else {
      providerOrder = await createMercadoPagoPixOrder({
        amount: Number(order.amount_due_now || 0),
        externalReference: order.public_code,
        payerEmail: order.customer_email || "",
      });

      const providerReference = String(providerOrder?.id || "");
      if (!providerReference) {
        throw new Error("Mercado Pago não retornou a referência da cobrança.");
      }

      const { error: updateError } = await supabaseServer!
        .from("orders")
        .update({
          payment_provider: "mercadopago",
          payment_reference: providerReference,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        throw new Error("Não foi possível vincular a cobrança ao pedido.");
      }
    }

    if (mercadoPagoOrderIsPaid(providerOrder)) {
      await DbService.updateOrderPaymentStatus(order.id, targetPaymentStatus(order));
    }

    const pix = extractMercadoPagoPix(providerOrder);

    return NextResponse.json({
      success: true,
      confirmed: mercadoPagoOrderIsPaid(providerOrder),
      mode: "mercadopago",
      provider: "mercadopago",
      provider_reference: pix.providerReference,
      qr_code: pix.qrCode,
      qr_code_base64: pix.qrCodeBase64,
      ticket_url: pix.ticketUrl,
      provider_status: pix.orderStatus,
      provider_payment_status: pix.paymentStatus,
      provider_payment_status_detail: pix.paymentStatusDetail,
    });
  } catch (error: any) {
    console.error("Pix provider error:", error);
    return NextResponse.json(
      { error: error?.message || "Não foi possível preparar o Pix automático." },
      { status: 500 }
    );
  }
}
