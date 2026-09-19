import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { generateWhatsAppMessage, buildWhatsAppLink } from "@/lib/formatters";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, token } = body;

    if (!code || !token || typeof code !== "string" || typeof token !== "string") {
      return NextResponse.json(
        { error: "Código e token de handoff são obrigatórios." },
        { status: 400 }
      );
    }

    const order = await DbService.getOrderByHandoffToken(code, token);
    if (!order) {
      return NextResponse.json(
        { error: "Solicitação não localizada ou link expirado." },
        { status: 404 }
      );
    }

    const settings = await DbService.getSettings();
    const whatsappNumber = settings.whatsapp_number?.replace(/\D/g, "") || "";
    let whatsappUrl = "";
    let whatsappMessage = "";

    if (whatsappNumber) {
      whatsappMessage = generateWhatsAppMessage(order, settings);
      whatsappUrl = buildWhatsAppLink(whatsappNumber, whatsappMessage);
    }

    // Sanitized response for the handoff screen
    const sanitizedOrder = {
      id: order.id,
      public_code: order.public_code,
      customer_name: order.customer_name,
      desired_date: order.desired_date,
      fulfillment_type: order.fulfillment_type,
      delivery_address: order.delivery_address,
      customer_note: order.customer_note,
      total: order.total,
      status: order.status,
      whatsapp_status: order.whatsapp_status,
      created_at: order.created_at,
      items: order.items || [],
    };

    return NextResponse.json({
      success: true,
      order: sanitizedOrder,
      settings: {
        business_name: settings.business_name,
        whatsapp_number: settings.whatsapp_number,
        instagram_url: settings.instagram_url,
      },
      whatsapp_message: whatsappMessage,
      whatsapp_url: whatsappUrl,
    });
  } catch (error: any) {
    console.error("Error in orders/handoff:", error);
    return NextResponse.json(
      { error: "Erro ao processar validação do pedido." },
      { status: 500 }
    );
  }
}
