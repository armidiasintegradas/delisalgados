import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";

function normalizeDigits(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

function phonesMatch(phoneA: string, phoneB: string): boolean {
  const a = normalizeDigits(phoneA);
  const b = normalizeDigits(phoneB);
  if (!a || !b) return false;
  if (a === b) return true;

  // Handle optional Brazil country code 55
  const strip55 = (d: string) => (d.startsWith("55") && d.length >= 12 ? d.substring(2) : d);
  const cleanA = strip55(a);
  const cleanB = strip55(b);
  if (cleanA === cleanB) return true;

  // Handle 8 vs 9 digits mobile variation if applicable (last 8 digits)
  if (cleanA.length >= 8 && cleanB.length >= 8) {
    return cleanA.slice(-8) === cleanB.slice(-8);
  }

  return false;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, phone } = body;

    if (!code || !phone || typeof code !== "string" || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Informe o código do pedido e o WhatsApp informado na finalização." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanPhone = phone.trim();

    const order = await DbService.getOrderByCode(cleanCode);

    // Neutral response if order doesn't exist or phone doesn't match
    if (!order || !phonesMatch(order.customer_phone, cleanPhone)) {
      return NextResponse.json(
        { error: "Não localizamos um pedido com esses dados." },
        { status: 404 }
      );
    }

    // Return ONLY minimal sanitized public data (never expose customer phone or full address)
    const sanitizedOrder = {
      public_code: order.public_code,
      status: order.status,
      desired_date: order.desired_date,
      fulfillment_type: order.fulfillment_type,
      items: (order.items || []).map((item) => ({
        product_name: item.product_name_snapshot,
        variant_name: item.variant_name_snapshot,
        quantity: item.quantity,
        unit_label: item.unit_label_snapshot,
        unit_price: item.unit_price_snapshot,
        subtotal: item.subtotal,
        note: item.note,
      })),
      total: order.total,
      payment_plan: order.payment_plan,
      payment_status: order.payment_status,
      amount_due_now: order.amount_due_now,
      amount_paid: order.amount_paid,
      balance_due: order.balance_due,
      created_at: order.created_at,
    };

    return NextResponse.json({ order: sanitizedOrder });
  } catch (error: any) {
    console.error("Error in order lookup:", error);
    return NextResponse.json(
      { error: "Erro ao processar consulta." },
      { status: 500 }
    );
  }
}
