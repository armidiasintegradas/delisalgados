import { Order, Settings } from "@/types";

export const DELI_ORDER_WHATSAPP = "5581995239013";

export function normalizeBrazilWhatsApp(phoneNumber?: string | null): string {
  const digits = String(phoneNumber || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function getDeliOrderWhatsApp(_configuredNumber?: string | null): string {
  // Canonical destination for all customer -> Deli order/payment messages.
  return DELI_ORDER_WHATSAPP;
}

export function getFirstName(fullName?: string | null): string {
  const normalized = String(fullName || "").trim();
  if (!normalized) return "Cliente";
  return normalized.split(/\s+/)[0];
}

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

  // Opening — always identify the customer by first name.
  const firstName = getFirstName(order.customer_name);
  const defaultOpening =
    `Olá, Deli Salgados! Meu nome é ${firstName}. Gostaria de enviar uma solicitação de pedido pelo cardápio digital.`;

  const configuredOpening = String(settings.whatsapp_opening_message || "").trim();
  let personalizedOpening = defaultOpening;

  if (configuredOpening) {
    const hadFirstNameToken = /\{primeiro_nome\}/i.test(configuredOpening);
    const withToken = configuredOpening.replace(/\{primeiro_nome\}/gi, firstName);

    if (hadFirstNameToken) {
      personalizedOpening = withToken;
    } else if (/^Olá, Deli Salgados![\s:]*/i.test(withToken)) {
      personalizedOpening = withToken.replace(
        /^Olá, Deli Salgados![\s:]*/i,
        `Olá, Deli Salgados! Meu nome é ${firstName}. `
      );
    } else {
      personalizedOpening = `Olá, Deli Salgados! Meu nome é ${firstName}. ${withToken}`;
    }
  }

  lines.push(personalizedOpening);
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

  if (order.fulfillment_type === "delivery") {
    lines.push("");
    lines.push("🚚 *ENTREGA:*");
    lines.push("• A taxa de entrega NÃO está incluída no valor do pedido.");
    lines.push("• A Deli fará uma estimativa para este endereço e enviará o valor pelo WhatsApp.");
    lines.push("• A entrega só será contratada após a aprovação do cliente.");
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
    lines.push(`📦 *Saldo dos produtos na entrega:* ${formatCurrency(order.balance_due ?? 0)}`);
  } else {
    lines.push(`✅ *Forma escolhida:* entrada obrigatória de 50%`);
    lines.push(`💳 *Entrada a pagar agora:* ${formatCurrency(order.amount_due_now ?? Number((order.total * 0.5).toFixed(2)))}`);
    lines.push(`📦 *Saldo dos produtos na entrega:* ${formatCurrency(order.balance_due ?? Number((order.total * 0.5).toFixed(2)))}`);
  }
  if (order.fulfillment_type === "delivery") {
    lines.push("🚚 *Taxa de entrega:* a combinar separadamente pelo WhatsApp");
  }
  lines.push("");
  const configuredClosing = String(settings.whatsapp_closing_message || "").trim();
  lines.push(
    configuredClosing
      ? configuredClosing.replace(/\{primeiro_nome\}/gi, firstName)
      : `Aguardo a confirmação da disponibilidade e do pagamento. Obrigado! — ${firstName}`
  );

  return lines.join("\n");
}

export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const cleanPhone = normalizeBrazilWhatsApp(phoneNumber);
  if (!cleanPhone) return "";
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}


export function generateFirstCustomerWhatsAppResponse(order: Order): string {
  const firstName = getFirstName(order.customer_name);

  return [
    `Olá, ${firstName}! 👋`,
    "",
    "Recebemos sua solicitação na Deli Salgados e vamos te atender o mais rápido possível.",
    "",
    "🕘 *Horário de atendimento:*",
    "Segunda a sábado, das 9h às 19h.",
    "",
    "Se sua mensagem chegou fora desse horário, fique tranquilo(a): responderemos assim que possível no próximo período de atendimento.",
    "",
    `📋 *Pedido:* ${order.public_code}`,
  ].join("\n");
}
