"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Baby,
  Calculator,
  CheckCircle2,
  MessageCircle,
  PartyPopper,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";
import { Header } from "@/components/public/Header";
import { BottomNav } from "@/components/public/BottomNav";
import { Product, Settings } from "@/types";
import { useCart } from "@/lib/cartContext";
import { buildWhatsAppLink, formatCurrency, getFirstName } from "@/lib/formatters";

type PartyMode = "cocktail" | "party" | "meal";
type ComboMode = "balanced" | "best_sellers" | "economy";

interface ComboLine {
  product: Product;
  quantity: number;
  subtotal: number;
}

const PARTY_RULES: Record<PartyMode, { label: string; adult: number; child: number; helper: string }> = {
  cocktail: {
    label: "Coquetel / recepção",
    adult: 12,
    child: 8,
    helper: "Salgados como principal comida por algumas horas.",
  },
  party: {
    label: "Festa completa",
    adult: 15,
    child: 10,
    helper: "Uma margem confortável para aniversários e confraternizações.",
  },
  meal: {
    label: "Com refeição principal",
    adult: 8,
    child: 5,
    helper: "Quando haverá bolo, almoço, jantar ou outra refeição.",
  },
};

function priceOf(product: Product) {
  if (product.price_type === "variants") return Number.POSITIVE_INFINITY;
  return Number(product.base_price ?? Number.POSITIVE_INFINITY);
}

function rankProducts(products: Product[], mode: ComboMode) {
  const maxSales = Math.max(1, ...products.map((p) => Number(p.sales_count || 0)));
  const finitePrices = products.map(priceOf).filter(Number.isFinite);
  const minPrice = Math.min(...finitePrices);
  const maxPrice = Math.max(...finitePrices);
  const range = Math.max(0.01, maxPrice - minPrice);

  const score = (p: Product) => {
    const sales = Number(p.sales_count || 0) / maxSales;
    const price = 1 - (priceOf(p) - minPrice) / range;
    const promo = p.is_promotion ? 0.2 : 0;
    if (mode === "best_sellers") return sales * 0.85 + price * 0.15 + promo;
    if (mode === "economy") return price * 0.9 + sales * 0.1 + promo;
    return sales * 0.55 + price * 0.45 + promo;
  };

  return [...products].sort((a, b) => {
    const diff = score(b) - score(a);
    if (Math.abs(diff) > 0.0001) return diff;
    return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
  });
}

function buildCombo(products: Product[], units: number, mode: ComboMode): ComboLine[] {
  if (!products.length) return [];

  const ranked = rankProducts(products, mode);
  const blocks = Math.max(2, Math.ceil(units / 25));
  const flavorCount = Math.min(ranked.length, Math.max(2, Math.min(6, blocks)));
  const selected = ranked.slice(0, flavorCount);
  const quantities = Array(flavorCount).fill(25);

  let remainingBlocks = blocks - flavorCount;
  let index = 0;
  while (remainingBlocks > 0) {
    quantities[index % flavorCount] += 25;
    remainingBlocks -= 1;
    index += 1;
  }

  return selected.map((product, i) => ({
    product,
    quantity: quantities[i],
    subtotal: Number((priceOf(product) * quantities[i]).toFixed(2)),
  }));
}

export default function FestaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [adults, setAdults] = useState(20);
  const [children, setChildren] = useState(5);
  const [partyMode, setPartyMode] = useState<PartyMode>("party");
  const [comboMode, setComboMode] = useState<ComboMode>("balanced");
  const [added, setAdded] = useState(false);

  const { addItem, customerData, setCustomerData } = useCart();

  useEffect(() => {
    fetch("/api/catalog", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data.products) ? data.products : []);
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const eligibleProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.is_visible &&
          p.availability === "available" &&
          p.price_type === "simple" &&
          (p.unit_label || "").trim().toUpperCase() === "UND" &&
          p.minimum_quantity >= 25 &&
          p.slug !== "produto-teste-pix" &&
          Number.isFinite(priceOf(p))
      ),
    [products]
  );

  const recommendedUnits = useMemo(() => {
    const rule = PARTY_RULES[partyMode];
    const raw = adults * rule.adult + children * rule.child;
    return Math.max(50, Math.ceil(raw / 25) * 25);
  }, [adults, children, partyMode]);

  const combo = useMemo(
    () => buildCombo(eligibleProducts, recommendedUnits, comboMode),
    [eligibleProducts, recommendedUnits, comboMode]
  );

  const comboTotal = combo.reduce((sum, item) => sum + item.subtotal, 0);
  const guestCount = adults + children;
  const averagePerGuest = guestCount > 0 ? recommendedUnits / guestCount : 0;

  const comboTitle =
    comboMode === "best_sellers"
      ? "Favoritos da Deli"
      : comboMode === "economy"
        ? "Combo Econômico"
        : "Combo Equilibrado";

  const customerFirstName = getFirstName(customerData.customerName);
  const hasCustomerName = Boolean(customerData.customerName.trim());
  const intro = hasCustomerName
    ? `Olá, Deli Salgados! Meu nome é ${customerFirstName}.`
    : "Olá, Deli Salgados!";

  const whatsappMessage = combo.length
    ? `${intro} Montei uma sugestão para minha festa no cardápio digital. São ${guestCount} convidados e a calculadora sugeriu ${recommendedUnits} salgados, no perfil "${comboTitle}", estimado em ${formatCurrency(comboTotal)}. Gostaria de confirmar a disponibilidade e ajustar o combo.`
    : `${intro} Gostaria de ajuda para montar um combo para minha festa.`;

  const whatsappUrl = settings?.whatsapp_number
    ? buildWhatsAppLink(settings.whatsapp_number, whatsappMessage)
    : "";

  function addComboToCart() {
    combo.forEach((line) => addItem(line.product, line.quantity));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] catalog-bg-pattern pb-24 lg:pb-12">
      <Header searchQuery="" onSearchChange={() => {}} showSearch={false} title="Festa" />

      <main className="w-full max-w-[1180px] mx-auto px-4 lg:px-8 py-5 lg:py-8">
        <section className="grid lg:grid-cols-[1.05fr_.95fr] gap-5 lg:gap-7 items-start">
          <div className="space-y-4">
            <div className="bg-[#3C1F15] text-white rounded-3xl p-5 lg:p-7 overflow-hidden relative">
              <div className="absolute -right-8 -top-10 opacity-10">
                <PartyPopper size={160} />
              </div>
              <div className="relative max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest">
                  <Sparkles size={13} />
                  Planejador inteligente de festa
                </div>
                <h1 className="font-display text-3xl lg:text-4xl font-black mt-3 leading-tight">
                  Quantos salgados pedir?
                </h1>
                <p className="text-sm text-white/75 mt-2 leading-relaxed">
                  A Deli estima a quantidade e monta combinações usando preço, histórico de vendas
                  e promoções ativas, sempre respeitando os mínimos do cardápio.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#EAD8C7] p-4 lg:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-[#E05A36]" />
                <h2 className="font-black text-[#3C1F15]">1. Monte sua Festa</h2>
              </div>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wide text-[#7A6357]">
                  Seu nome
                </span>
                <input
                  type="text"
                  value={customerData.customerName}
                  onChange={(e) =>
                    setCustomerData((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  placeholder="Ex: Alessandre Ribeiro"
                  className="w-full h-12 rounded-2xl border border-[#EAD8C7] bg-[#FFFDF9] px-4 text-base font-bold text-[#3C1F15] outline-none focus:ring-2 focus:ring-[#E05A36]/30"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wide text-[#7A6357] flex items-center gap-1.5">
                    <Users size={13} /> Adultos
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={adults}
                    onChange={(e) => setAdults(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
                    className="w-full h-12 rounded-2xl border border-[#EAD8C7] bg-[#FFFDF9] px-4 text-lg font-black text-[#3C1F15] outline-none focus:ring-2 focus:ring-[#E05A36]/30"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wide text-[#7A6357] flex items-center gap-1.5">
                    <Baby size={13} /> Crianças
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={children}
                    onChange={(e) => setChildren(Math.max(0, Math.min(500, Number(e.target.value) || 0)))}
                    className="w-full h-12 rounded-2xl border border-[#EAD8C7] bg-[#FFFDF9] px-4 text-lg font-black text-[#3C1F15] outline-none focus:ring-2 focus:ring-[#E05A36]/30"
                  />
                </label>
              </div>

              <div className="grid gap-2">
                {(Object.keys(PARTY_RULES) as PartyMode[]).map((mode) => {
                  const rule = PARTY_RULES[mode];
                  const active = partyMode === mode;
                  return (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPartyMode(mode)}
                      className={`text-left p-3.5 rounded-2xl border transition ${
                        active
                          ? "bg-[#FFF0E2] border-[#E05A36] ring-1 ring-[#E05A36]/20"
                          : "bg-white border-[#EAD8C7]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-black text-sm text-[#3C1F15]">{rule.label}</span>
                        <span className="text-[10px] font-black text-[#E05A36]">
                          {rule.adult}/adulto · {rule.child}/criança
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A6357] mt-1">{rule.helper}</p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-[#FFF8EE] border border-[#F0D5BE] p-3 text-center">
                  <div className="text-[9px] uppercase font-black text-[#8C7367]">Convidados</div>
                  <div className="text-xl font-black text-[#3C1F15]">{guestCount}</div>
                </div>
                <div className="rounded-2xl bg-[#FFF8EE] border border-[#F0D5BE] p-3 text-center">
                  <div className="text-[9px] uppercase font-black text-[#8C7367]">Sugestão</div>
                  <div className="text-xl font-black text-[#E05A36]">{recommendedUnits}</div>
                  <div className="text-[9px] text-[#8C7367]">unidades</div>
                </div>
                <div className="rounded-2xl bg-[#FFF8EE] border border-[#F0D5BE] p-3 text-center">
                  <div className="text-[9px] uppercase font-black text-[#8C7367]">Média</div>
                  <div className="text-xl font-black text-[#3C1F15]">{averagePerGuest.toFixed(1)}</div>
                  <div className="text-[9px] text-[#8C7367]">por pessoa</div>
                </div>
              </div>

              <p className="text-[10px] text-[#8C7367] leading-relaxed">
                Estimativa de planejamento: o consumo real varia conforme duração, bebidas e outros alimentos.
                O cálculo arredonda em blocos de 25 unidades para respeitar a venda mínima da Deli.
              </p>
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-5">
            <div className="bg-white rounded-3xl border border-[#EAD8C7] p-4 lg:p-5 space-y-4 shadow-sm">
              <div>
                <div className="text-[10px] uppercase font-black tracking-wider text-[#8C7367]">
                  2. Escolha o perfil do combo
                </div>
                <h2 className="font-display text-xl font-black text-[#3C1F15] mt-1">
                  {comboTitle}
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setComboMode("balanced")}
                  className={`p-3 rounded-2xl border text-center transition ${
                    comboMode === "balanced" ? "border-[#3C1F15] bg-[#3C1F15] text-white" : "border-[#EAD8C7] bg-white text-[#3C1F15]"
                  }`}
                >
                  <WalletCards size={18} className="mx-auto mb-1" />
                  <span className="block text-[10px] font-black">Equilibrado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComboMode("best_sellers")}
                  className={`p-3 rounded-2xl border text-center transition ${
                    comboMode === "best_sellers" ? "border-[#3C1F15] bg-[#3C1F15] text-white" : "border-[#EAD8C7] bg-white text-[#3C1F15]"
                  }`}
                >
                  <Trophy size={18} className="mx-auto mb-1" />
                  <span className="block text-[10px] font-black">Mais pedidos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComboMode("economy")}
                  className={`p-3 rounded-2xl border text-center transition ${
                    comboMode === "economy" ? "border-[#3C1F15] bg-[#3C1F15] text-white" : "border-[#EAD8C7] bg-white text-[#3C1F15]"
                  }`}
                >
                  <TrendingDown size={18} className="mx-auto mb-1" />
                  <span className="block text-[10px] font-black">Menor preço</span>
                </button>
              </div>

              {loading ? (
                <div className="py-10 text-center text-xs text-[#7A6357]">Montando sugestões...</div>
              ) : combo.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#FFF4E8] border border-[#F0D5BE] text-xs text-[#7A6357]">
                  Não encontramos salgados unitários disponíveis para montar o combo agora.
                </div>
              ) : (
                <div className="space-y-2">
                  {combo.map((line, index) => (
                    <div
                      key={line.product.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF9E6] border border-[#EFE2C4]"
                    >
                      <div className="w-8 h-8 rounded-full bg-white border border-[#EAD8C7] flex items-center justify-center text-[11px] font-black text-[#E05A36] shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-sm text-[#3C1F15] truncate">
                          {line.product.name}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Number(line.product.sales_count || 0) > 0 && (
                            <span className="text-[9px] font-black bg-white border border-[#EAD8C7] px-2 py-0.5 rounded-full text-[#7A6357]">
                              {line.product.sales_count} un. vendidas
                            </span>
                          )}
                          {line.product.is_promotion && (
                            <span className="text-[9px] font-black bg-[#E05A36] text-white px-2 py-0.5 rounded-full">
                              Promoção
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-sm text-[#3C1F15]">{line.quantity} un.</div>
                        <div className="text-[10px] text-[#7A6357]">{formatCurrency(line.subtotal)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-[#F0E2D4] pt-4 space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-wider text-[#8C7367]">
                      Combo sugerido
                    </div>
                    <div className="text-sm font-bold text-[#3C1F15]">
                      {recommendedUnits} unidades · {combo.length} sabores
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#8C7367]">Estimativa</div>
                    <div className="text-2xl font-black text-[#E05A36]">{formatCurrency(comboTotal)}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addComboToCart}
                  disabled={combo.length === 0}
                  className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition ${
                    added
                      ? "bg-[#1FAA52] text-white"
                      : "bg-[#3C1F15] text-white hover:bg-[#27120A] disabled:opacity-50"
                  }`}
                >
                  {added ? <CheckCircle2 size={18} /> : <ShoppingBag size={18} />}
                  {added ? "Combo adicionado!" : "Adicionar combo ao pedido"}
                </button>

                <Link
                  href="/pedido"
                  className="w-full py-3 rounded-2xl border border-[#EAD8C7] bg-white text-[#3C1F15] text-xs font-black text-center block"
                >
                  VER MEU PEDIDO
                </Link>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-[#25D366] text-white text-xs font-black flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    AJUSTAR COM A DELI NO WHATSAPP
                  </a>
                )}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[#FFF8EE] border border-[#F0D5BE] text-[11px] text-[#7A6357] leading-relaxed">
              <strong className="text-[#3C1F15]">Como a sugestão funciona:</strong> “Mais pedidos”
              usa o histórico real de vendas; “Menor preço” prioriza o custo unitário; “Equilibrado”
              combina popularidade, preço e promoções ativas. A calculadora nunca usa o produto teste Pix.
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
