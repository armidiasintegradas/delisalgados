import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { verifyAdminSession } from "@/lib/auth/adminAuth";

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;

    // Check token from header or body
    let token: string | null = request.headers.get("x-handoff-token");
    if (!token) {
      try {
        const body = await request.json();
        token = body?.token || null;
      } catch {}
    }

    // 1. Authorized via valid handoff token
    if (token) {
      const order = await DbService.getOrderByHandoffToken(code, token);
      if (order) {
        await DbService.updateOrderWhatsAppStatus(order.id, "opened");
        return NextResponse.json({ success: true, whatsapp_status: "opened" });
      }
    }

    // 2. Authorized via admin session
    const auth = await verifyAdminSession(request);
    if (auth.authorized) {
      const order = await DbService.getOrderByCode(code);
      if (order) {
        await DbService.updateOrderWhatsAppStatus(order.id, "opened");
        return NextResponse.json({ success: true, whatsapp_status: "opened" });
      }
    }

    // Unauthenticated or invalid token
    return NextResponse.json(
      { error: "Acesso não autorizado ou solicitação não encontrada." },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error updating whatsapp status:", error);
    return NextResponse.json(
      { error: "Erro ao registrar status do WhatsApp" },
      { status: 500 }
    );
  }
}
