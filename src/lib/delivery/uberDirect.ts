import { DeliveryQuoteOption } from "@/types";

type UberQuoteResponse = {
  id?: string;
  expires?: string;
  fee?: number;
  currency?: string;
  currency_type?: string;
  duration?: number;
  pickup_duration?: number;
  dropoff_eta?: string;
};

function toUberAddress(raw: string) {
  const clean = raw.replace(/\s+/g, " ").trim();
  const cepMatch = clean.match(/\b\d{5}-?\d{3}\b/);
  const zip = cepMatch ? cepMatch[0].replace(/\D/g, "") : undefined;

  return JSON.stringify({
    street_address: [clean],
    country: "BR",
    ...(zip ? { zip_code: zip } : {}),
  });
}

async function getUberAccessToken() {
  const clientId = process.env.UBER_DIRECT_CLIENT_ID;
  const clientSecret = process.env.UBER_DIRECT_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "eats.deliveries",
  });

  const res = await fetch("https://auth.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Uber OAuth respondeu ${res.status}`);
  }

  const data = await res.json();
  return data.access_token as string | undefined;
}

export function isUberDirectConfigured() {
  return Boolean(
    process.env.UBER_DIRECT_CLIENT_ID &&
      process.env.UBER_DIRECT_CLIENT_SECRET &&
      process.env.UBER_DIRECT_CUSTOMER_ID
  );
}

export async function getUberDirectQuote(
  pickupAddress: string,
  dropoffAddress: string
): Promise<DeliveryQuoteOption> {
  if (!isUberDirectConfigured()) {
    return {
      provider: "uber",
      provider_label: "Uber",
      status: "unavailable",
      price: null,
      currency: "BRL",
      eta_minutes: null,
      quote_id: null,
      expires_at: null,
      note: "Cotação oficial será exibida quando a conta Uber Direct da Deli estiver conectada.",
      action_url: "https://www.uber.com/br/pt-br/b/courier-services/",
    };
  }

  try {
    const token = await getUberAccessToken();
    if (!token) throw new Error("Token Uber Direct não disponível.");

    const customerId = process.env.UBER_DIRECT_CUSTOMER_ID!;
    const response = await fetch(
      `https://api.uber.com/v1/customers/${encodeURIComponent(customerId)}/delivery_quotes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup_address: toUberAddress(pickupAddress),
          dropoff_address: toUberAddress(dropoffAddress),
        }),
        cache: "no-store",
      }
    );

    const data = (await response.json().catch(() => ({}))) as UberQuoteResponse & {
      message?: string;
      code?: string;
    };

    if (!response.ok) {
      throw new Error(data.message || data.code || `Uber Direct respondeu ${response.status}`);
    }

    const currency = (data.currency_type || data.currency || "BRL").toUpperCase();
    const fee = typeof data.fee === "number" ? Number((data.fee / 100).toFixed(2)) : null;

    return {
      provider: "uber",
      provider_label: "Uber",
      status: fee !== null ? "available" : "error",
      price: fee,
      currency,
      eta_minutes: typeof data.duration === "number" ? data.duration : null,
      quote_id: data.id || null,
      expires_at: data.expires || null,
      note: fee !== null ? "Cotação oficial em tempo real via Uber Direct." : "A Uber não retornou uma tarifa para este endereço.",
      action_url: null,
    };
  } catch (error: any) {
    return {
      provider: "uber",
      provider_label: "Uber",
      status: "error",
      price: null,
      currency: "BRL",
      eta_minutes: null,
      quote_id: null,
      expires_at: null,
      note: error?.message || "Não foi possível obter a cotação da Uber agora.",
      action_url: "https://www.uber.com/br/pt-br/b/courier-services/",
    };
  }
}
