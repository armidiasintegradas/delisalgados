import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ cep: string }> }
) {
  const { cep } = await context.params;
  const digits = String(cep || "").replace(/\D/g, "");

  if (digits.length !== 8) {
    return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
  }

  try {
    const viaCep = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      cache: "no-store",
    });

    if (viaCep.ok) {
      const data = await viaCep.json();
      if (!data?.erro) {
        return NextResponse.json({
          postal_code: digits,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
          complement: data.complemento || "",
          source: "viacep",
        });
      }
    }

    const brasilApi = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`, {
      cache: "no-store",
    });

    if (brasilApi.ok) {
      const data = await brasilApi.json();
      return NextResponse.json({
        postal_code: digits,
        street: data.street || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
        complement: "",
        source: "brasilapi",
      });
    }

    return NextResponse.json({ error: "CEP não encontrado." }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar o CEP agora." },
      { status: 502 }
    );
  }
}
