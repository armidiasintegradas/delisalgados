import crypto from "crypto";

type MercadoPagoOrder = any;

const API_BASE = "https://api.mercadopago.com";

function accessToken() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim() || "";
}

export function isMercadoPagoConfigured() {
  return Boolean(accessToken());
}

function headers(idempotencyKey?: string) {
  const h: Record<string, string> = {
    Authorization: `Bearer ${accessToken()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (idempotencyKey) h["X-Idempotency-Key"] = idempotencyKey;
  return h;
}

export async function createMercadoPagoPixOrder(input: {
  amount: number;
  externalReference: string;
  payerEmail: string;
}) {
  if (!isMercadoPagoConfigured()) {
    throw new Error("Mercado Pago não configurado.");
  }

  const amount = Number(input.amount.toFixed(2));
  const idempotencyKey = crypto
    .createHash("sha256")
    .update(`deli|${input.externalReference}|${amount.toFixed(2)}`)
    .digest("hex");

  const response = await fetch(`${API_BASE}/v1/orders`, {
    method: "POST",
    headers: headers(idempotencyKey),
    body: JSON.stringify({
      type: "online",
      total_amount: amount.toFixed(2),
      external_reference: input.externalReference,
      processing_mode: "automatic",
      transactions: {
        payments: [
          {
            amount: amount.toFixed(2),
            payment_method: {
              id: "pix",
              type: "bank_transfer",
            },
            expiration_time: "PT24H",
          },
        ],
      },
      payer: {
        email: input.payerEmail,
      },
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      data?.message ||
      data?.error ||
      data?.cause?.[0]?.description ||
      `Mercado Pago respondeu ${response.status}`;
    throw new Error(detail);
  }

  return data as MercadoPagoOrder;
}

export async function getMercadoPagoOrder(orderId: string) {
  if (!isMercadoPagoConfigured()) {
    throw new Error("Mercado Pago não configurado.");
  }

  const response = await fetch(
    `${API_BASE}/v1/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: headers(),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Mercado Pago respondeu ${response.status}`
    );
  }

  return data as MercadoPagoOrder;
}

export function extractMercadoPagoPix(order: MercadoPagoOrder) {
  const payment =
    order?.transactions?.payments?.[0] ||
    order?.transaction?.payments?.[0] ||
    order?.payments?.[0] ||
    null;

  const method = payment?.payment_method || {};
  const qrCode =
    method?.qr_code ||
    payment?.qr_code ||
    order?.qr_code ||
    "";

  const qrCodeBase64 =
    method?.qr_code_base64 ||
    method?.qr_code_based64 ||
    payment?.qr_code_base64 ||
    payment?.qr_code_based64 ||
    order?.qr_code_base64 ||
    order?.qr_code_based64 ||
    "";

  const ticketUrl =
    method?.ticket_url ||
    payment?.ticket_url ||
    order?.ticket_url ||
    "";

  return {
    providerReference: String(order?.id || ""),
    externalReference: String(order?.external_reference || ""),
    qrCode,
    qrCodeBase64,
    ticketUrl,
    orderStatus: String(order?.status || ""),
    paymentStatus: String(payment?.status || ""),
    paymentStatusDetail: String(payment?.status_detail || ""),
  };
}

export function mercadoPagoOrderIsPaid(order: MercadoPagoOrder) {
  const pix = extractMercadoPagoPix(order);
  const orderStatus = pix.orderStatus.toLowerCase();
  const paymentStatus = pix.paymentStatus.toLowerCase();

  return (
    orderStatus === "processed" ||
    orderStatus === "approved" ||
    paymentStatus === "approved" ||
    paymentStatus === "processed"
  );
}

export function verifyMercadoPagoWebhookSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}) {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim() || "";
  if (!secret || !input.xSignature || !input.dataId) return false;

  let ts = "";
  let v1 = "";

  for (const part of input.xSignature.split(",")) {
    const [key, value] = part.split("=", 2).map((v) => v?.trim());
    if (key === "ts") ts = value || "";
    if (key === "v1") v1 = value || "";
  }

  if (!ts || !v1) return false;

  const normalizedDataId = input.dataId.toLowerCase();
  const manifest =
    `id:${normalizedDataId};` +
    (input.xRequestId ? `request-id:${input.xRequestId};` : "") +
    `ts:${ts};`;

  const calculated = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const expected = Buffer.from(v1, "hex");
  const actual = Buffer.from(calculated, "hex");
  if (expected.length !== actual.length) return false;

  return crypto.timingSafeEqual(expected, actual);
}
