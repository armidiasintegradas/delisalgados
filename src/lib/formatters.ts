import { Order, Settings } from "@/types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function generateWhatsAppMessage(order: Order, settings: Settings): string {
  const fulfillmentLabels: Record<string, string> = {
    pickup: "Retirada no balcão",
    delivery: "Entrega no endereço",
    to_agree: "A combinar",
  };

  const lines: string[] = [];

  // Opening
  lines.push(settings.whatsapp_opening_message || "Olá, Deli Salgados! Gostaria de enviar uma solicitação de pedido:");
  lines.push("");
  lines.push(`📋 *Pedido:* ${order.public_code}`);
  lines.push(`👤 *Cliente:* ${order.customer_name}`);
  lines.push(`📱 *WhatsApp:* ${order.customer_phone}`);
  lines.push(`📅 *Data desejada:* ${order.desired_date}`);
  lines.push(`📍 *Modalidade:* ${fulfillmentLabels[order.fulfillment_type] || order.fulfillment_type}`);

  if (order.delivery_address) {
    lines.push(`🏠 *Endereço:* ${order.delivery_address}`);
  }
  if (order.customer_reference_point) {
    lines.push(`📌 *Referência:* ${order.customer_reference_point}`);
  }

  if (order.customer_note) {
    lines.push(`💬 *Obs. Geral:* ${order.customer_note}`);
  }

  lines.push("");
  lines.push("🛒 *ITENS DO PEDIDO:*");

  (order.items || []).forEach((item) => {
    const variantStr = item.variant_name_snapshot ? ` (${item.variant_name_snapshot})` : "";
    lines.push(`• ${item.quantity} ${item.unit_label_snapshot} — ${item.product_name_snapshot}${variantStr}: ${formatCurrency(item.subtotal)}`);
    if (item.note) {
      lines.push(`   _Obs: ${item.note}_`);
    }
  });

  lines.push("");
  lines.push(`💰 *Total do pedido:* ${formatCurrency(order.total)}`);
  if (order.payment_plan === "full") {
    lines.push(`✅ *Forma escolhida:* pagamento integral no ato`);
    lines.push(`💳 *Valor a pagar agora:* ${formatCurrency(order.amount_due_now ?? order.total)}`);
    lines.push(`📦 *Saldo na entrega:* ${formatCurrency(order.balance_due ?? 0)}`);
  } else {
    lines.push(`✅ *Forma escolhida:* entrada obrigatória de 50%`);
    lines.push(`💳 *Entrada a pagar agora:* ${formatCurrency(order.amount_due_now ?? Number((order.total * 0.5).toFixed(2)))}`);
    lines.push(`📦 *Saldo na entrega:* ${formatCurrency(order.balance_due ?? Number((order.total * 0.5).toFixed(2)))}`);
  }
  lines.push("");
  lines.push(settings.whatsapp_closing_message || "Aguardo confirmação da disponibilidade e do pagamento. Obrigado!");

  return lines.join("\n");
}

export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const cleanPhone = (phoneNumber || "").replace(/\D/g, "");
  if (!cleanPhone) return "";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
