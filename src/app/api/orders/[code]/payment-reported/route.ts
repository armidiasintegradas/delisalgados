import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const token = String(body?.token || "").trim();

    if (!token) {
      return NextResponse.json({ error: "Token do pedido ausente." }, { status: 400 });
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
        already_confirmed: true,
        order,
      });
    }

    const amount = Number(order.amount_due_now || 0);
    const now = new Date().toISOString();

    const { data, error } = await supabaseServer!
      .from("orders")
      .update({
        payment_reported_at: now,
        payment_reported_amount: amount,
        updated_at: now,
      })
      .eq("id", order.id)
      .select("*, items:order_items(*)")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "Pagamento informado. A Deli fará a conferência.",
      order: data,
    });
  } catch (error: any) {
    console.error("Payment reported error:", error);
    return NextResponse.json(
      { error: error?.message || "Não foi possível informar o pagamento." },
      { status: 500 }
    );
  }
}
