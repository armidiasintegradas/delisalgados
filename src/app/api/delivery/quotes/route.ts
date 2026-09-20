import { NextResponse } from "next/server";
import { DbService } from "@/lib/db";
import { DeliveryQuoteOption } from "@/types";
import { getUberDirectQuote } from "@/lib/delivery/uberDirect";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dropoffAddress = String(body?.dropoffAddress || "").trim();

    if (!dropoffAddress) {
      return NextResponse.json(
        { error: "Informe o endereço completo de entrega." },
        { status: 400 }
      );
    }

    const settings = await DbService.getSettings();
    const pickupAddress = String(settings.address || "").trim();

    if (!pickupAddress) {
      return NextResponse.json(
        { error: "O endereço de retirada da Deli ainda não está configurado." },
        { status: 503 }
      );
    }

    const uber = await getUberDirectQuote(pickupAddress, dropoffAddress);

    const options: DeliveryQuoteOption[] = [
      uber,
      {
        provider: "99",
        provider_label: "99Entrega",
        status: "external",
        price: null,
        currency: "BRL",
        eta_minutes: null,
        quote_id: null,
        expires_at: null,
        action_url: "https://entrega.99app.com/",
        note: "A 99 disponibiliza integração empresarial via API mediante credenciais. Até a conexão ser ativada, consulte a tarifa no serviço 99Entrega.",
      },
      {
        provider: "indrive",
        provider_label: "inDrive",
        status: "external",
        price: null,
        currency: "BRL",
        eta_minutes: null,
        quote_id: null,
        expires_at: null,
        action_url: "https://indrive.com/",
        note: "Não há integração pública de cotação ativada para a Deli. Consulte a oferta atual diretamente no inDrive.",
      },
    ];

    return NextResponse.json({
      success: true,
      pickup_address: pickupAddress,
      dropoff_address: dropoffAddress,
      options,
      quoted_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Não foi possível consultar as opções de entrega." },
      { status: 500 }
    );
  }
}
