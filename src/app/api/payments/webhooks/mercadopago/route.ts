import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";
import {
  getMercadoPagoOrder,
  mercadoPagoOrderIsPaid,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/payments/mercadoPago";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const dataId = url.searchParams.get("data.id");
    const xSignature = request.headers.get("x-signature");
    const xRequestId = request.headers.get("x-request-id");

    if (
      !verifyMercadoPagoWebhookSignature({
        xSignature,
        xRequestId,
        dataId,
      })
    ) {
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const eventId = String(body?.id || `${body?.action || "event"}:${dataId || ""}`);
    const action = String(body?.action || "");
    const providerReference = String(body?.data?.id || dataId || "");

    if (!providerReference) {
      return NextResponse.json({ received: true });
    }

    const { error: eventError } = await supabaseServer!
      .from("payment_webhook_events")
      .insert({
        provider: "mercadopago",
        event_id: eventId,
        action: action || null,
        payment_reference: providerReference,
        payload: body || {},
      });

    if (eventError?.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (eventError) {
      console.error("Webhook audit insert error:", eventError);
      return NextResponse.json({ error: "Falha ao registrar webhook." }, { status: 500 });
    }

    const providerOrder = await getMercadoPagoOrder(providerReference);
    const externalReference = String(providerOrder?.external_reference || "");

    let localOrder: any = null;

    const byReference = await supabaseServer!
      .from("orders")
      .select("*")
      .eq("payment_provider", "mercadopago")
      .eq("payment_reference", providerReference)
      .maybeSingle();

    if (byReference.data) {
      localOrder = byReference.data;
    } else if (externalReference) {
      const byCode = await supabaseServer!
        .from("orders")
        .select("*")
        .eq("public_code", externalReference.toUpperCase())
        .maybeSingle();
      localOrder = byCode.data || null;
    }

    if (!localOrder) {
      return NextResponse.json({ received: true, unmatched: true });
    }

    if (mercadoPagoOrderIsPaid(providerOrder)) {
      const nextStatus =
        localOrder.payment_plan === "full" ? "paid" : "partially_paid";

      await DbService.updateOrderPaymentStatus(localOrder.id, nextStatus);

      if (
        localOrder.payment_provider !== "mercadopago" ||
        localOrder.payment_reference !== providerReference
      ) {
        await supabaseServer!
          .from("orders")
          .update({
            payment_provider: "mercadopago",
            payment_reference: providerReference,
            updated_at: new Date().toISOString(),
          })
          .eq("id", localOrder.id);
      }
    } else if (
      action === "order.canceled" ||
      action === "order.expired"
    ) {
      await DbService.updateOrderPaymentStatus(localOrder.id, "failed");
    } else if (action === "order.refunded") {
      await DbService.updateOrderPaymentStatus(localOrder.id, "refunded");
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Mercado Pago webhook error:", error);
    return NextResponse.json(
      { error: "Falha ao processar notificação." },
      { status: 500 }
    );
  }
}
