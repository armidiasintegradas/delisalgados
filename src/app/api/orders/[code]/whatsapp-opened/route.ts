import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const order = await DbService.getOrderByCode(code);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    await DbService.updateOrderWhatsAppStatus(order.id, "opened");

    return NextResponse.json({ success: true, whatsapp_status: "opened" });
  } catch (error: any) {
    console.error("Error updating whatsapp status:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao registrar status do WhatsApp" },
      { status: 500 }
    );
  }
}
