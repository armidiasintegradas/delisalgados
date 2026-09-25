"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MessageCircle,
  Instagram,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { Order, Settings } from "@/types";
import { formatCurrency, generateWhatsAppMessage, buildWhatsAppLink, getFirstName, getDeliOrderWhatsApp } from "@/lib/formatters";

function EnviadoContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("code");
  const handoffToken = searchParams.get("t");
  const { clearCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [serverWhatsappUrl, setServerWhatsappUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Recovery & Error states
  const [needsRecovery, setNeedsRecovery] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function fetchCatalogSettings() {
    try {
      const catRes = await fetch("/api/catalog");
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.settings) setSettings(catData.settings);
      }
    } catch {}
  }

  async function loadOrderData() {
    if (!orderCode) {
      setIsLoading(false);
      setNeedsRecovery(true);
      return;
    }

    setIsLoading(true);
    setServerError(null);
    setRecoveryError(null);

    await fetchCatalogSettings();

    // 1. Try Token Handoff via URL parameter
    const activeToken =
      handoffToken ||
      (typeof window !== "undefined" ? sessionStorage.getItem("deli_handoff_token") : null);

    if (activeToken) {
      try {
        const handoffRes = await fetch("/api/orders/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: orderCode, token: activeToken }),
        });

        if (handoffRes.ok) {
          const data = await handoffRes.json();
          if (data.order) {
            setOrder(data.order);
            if (data.settings) setSettings(data.settings);
            if (data.whatsapp_url) setServerWhatsappUrl(data.whatsapp_url);
            // Safe to clear cart now that handoff is confirmed loaded
            clearCart();
            if (typeof window !== "undefined") {
              sessionStorage.setItem("deli_last_order", JSON.stringify(data.order));
              sessionStorage.setItem("deli_handoff_token", activeToken);
            }
            setIsLoading(false);
            setNeedsRecovery(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn("Handoff token fetch error:", err);
      }
    }

    // 2. Try sessionStorage memory fallback
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("deli_last_order");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.public_code?.toUpperCase() === orderCode.toUpperCase()) {
            setOrder(parsed);
            clearCart();
            setIsLoading(false);
            setNeedsRecovery(false);
            return;
          }
        } catch {}
      }
    }

    // 3. Neither token nor session storage succeeded: enter recovery mode
    setIsLoading(false);
    setNeedsRecovery(true);
  }

  useEffect(() => {
    loadOrderData();
  }, [orderCode, handoffToken]);

  // Handle phone-based recovery via /api/orders/lookup
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (!orderCode) {
      setRecoveryError("Código do pedido não informado na URL.");
      return;
    }
    if (!recoveryPhone.trim()) {
      setRecoveryError("Por favor, digite seu telefone WhatsApp.");
      return;
    }

    setIsRecovering(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: orderCode, phone: recoveryPhone }),
      });

      const data = await res.json();
      if (!res.ok || !data.order) {
        setRecoveryError("Não localizamos um pedido com esses dados.");
        setIsRecovering(false);
        return;
      }

      setOrder(data.order);
      clearCart();
      if (typeof window !== "undefined") {
        sessionStorage.setItem("deli_last_order", JSON.stringify(data.order));
      }
      setNeedsRecovery(false);
    } catch (err: any) {
      setRecoveryError("Erro ao comunicar com o servidor. Tente novamente.");
    } finally {
      setIsRecovering(false);
    }
  };

  const handleOpenWhatsApp = () => {
    clearCart();
    if (order?.public_code) {
      const activeToken =
        handoffToken ||
        (typeof window !== "undefined" ? sessionStorage.getItem("deli_handoff_token") : null);

      fetch(`/api/orders/${order.public_code}/whatsapp-opened`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(activeToken ? { "x-handoff-token": activeToken } : {}),
        },
        body: JSON.stringify({ token: activeToken }),
      }).catch(() => {});
    }
  };

  // Compute final WhatsApp link
  const whatsappNumber = getDeliOrderWhatsApp(settings?.whatsapp_number);
  let finalWhatsappUrl = serverWhatsappUrl;
  if (!finalWhatsappUrl && whatsappNumber && order && settings) {
    const msg = generateWhatsAppMessage(order, settings);
    finalWhatsappUrl = buildWhatsAppLink(whatsappNumber, msg);
  }

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex items-center justify-center p-4">
        <div className="bg-[#FFFDF6] rounded-3xl p-8 max-w-sm w-full text-center border border-[#EAD8C7] shadow-xl space-y-4">
          <div className="w-10 h-10 border-3 border-[#DF5F45] border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h2 className="font-display text-base font-bold text-[#3C1F15]">Carregando solicitação...</h2>
            <p className="text-xs text-[#7A6357] mt-1">Conectando aos dados do seu pedido.</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Server Error State
  if (serverError) {
    return (
      <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex items-center justify-center p-4">
        <div className="bg-[#FFFDF6] rounded-3xl p-8 max-w-md w-full text-center border border-[#EAD8C7] shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#3C1F15]">Não foi possível carregar seu pedido agora.</h2>
            <p className="text-xs text-[#7A6357] mt-1.5">{serverError}</p>
          </div>
          <button
            onClick={loadOrderData}
            className="w-full py-3.5 rounded-2xl bg-[#DF5F45] hover:bg-[#C94D35] text-white font-extrabold text-xs uppercase tracking-wide transition shadow"
          >
            TENTAR NOVAMENTE
          </button>
          <Link
            href="/"
            className="inline-block text-xs font-bold text-[#7A6357] hover:text-[#3C1F15] transition pt-2"
          >
            Voltar ao Cardápio
          </Link>
        </div>
      </div>
    );
  }

  // 3. Recovery Mode State (Token / Session Absent)
  if (needsRecovery && !order) {
    return (
      <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-[440px] lg:max-w-[560px] bg-[#FFFDF6] rounded-3xl border border-[#EAD8C7] shadow-2xl p-6 lg:p-8 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#FFE8E0] text-[#DF5F45] flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck size={24} />
            </div>
            <h2 className="font-display text-lg lg:text-xl font-bold text-[#3C1F15]">
              Precisamos recuperar os dados do seu pedido
            </h2>
            <p className="text-xs text-[#7A6357] leading-relaxed px-2">
              Para sua segurança e privacidade, informe o WhatsApp cadastrado no momento do pedido para acessar os detalhes da solicitação <span className="font-bold text-[#3C1F15]">#{orderCode || "DL-????"}</span>.
            </p>
          </div>

          <form onSubmit={handleRecoverySubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1.5">
                SEU WHATSAPP COM DDD *
              </label>
              <input
                type="tel"
                required
                placeholder="(81) 99999-9999"
                value={recoveryPhone}
                onChange={(e) => setRecoveryPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#EAD8C7] bg-white text-[#3C1F15] text-sm focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              />
            </div>

            {recoveryError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{recoveryError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isRecovering}
              className="w-full py-4 rounded-2xl bg-[#DF5F45] hover:bg-[#C94D35] disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wide shadow-md transition transform active:scale-[0.98]"
            >
              {isRecovering ? "Localizando..." : "RECUPERAR PEDIDO"}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs font-bold text-[#7A6357] hover:text-[#3C1F15] transition"
            >
              ← Voltar ao Cardápio Principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex items-center justify-center p-4">
        <div className="bg-[#FFFDF6] rounded-3xl p-8 max-w-md w-full text-center border border-[#EAD8C7] shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Search size={22} />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-[#3C1F15]">Não localizamos um pedido com esses dados</h2>
            <p className="text-xs text-[#7A6357] mt-1.5">
              Verifique se o código da solicitação ou o telefone foram digitados corretamente.
            </p>
          </div>
          <button
            onClick={() => setNeedsRecovery(true)}
            className="w-full py-3 rounded-2xl bg-[#DF5F45] text-white font-extrabold text-xs uppercase tracking-wide shadow transition"
          >
            TENTAR NOVAMENTE
          </button>
          <Link
            href="/"
            className="inline-block text-xs font-bold text-[#7A6357] hover:text-[#3C1F15] transition pt-2"
          >
            Voltar ao Cardápio
          </Link>
        </div>
      </div>
    );
  }

  const firstName = getFirstName(order.customer_name);

  // 4. Confirmed Handoff State
  return (
    <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex flex-col items-center justify-start p-0 lg:p-6 relative">
      <div className="w-full max-w-[440px] lg:max-w-[720px] bg-[#FFFDF6] min-h-screen lg:min-h-0 lg:rounded-3xl lg:border lg:border-[#EAD8C7] shadow-2xl overflow-hidden flex flex-col justify-between">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#DF5F45] text-white px-4 lg:px-6 py-3.5 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <img
              src="/deli-logo-cream-official.png"
              alt="Deli Salgados"
              className="h-8 w-auto object-contain select-none"
            />
            <div>
              <h1 className="text-base font-bold leading-tight font-display">Pedido registrado</h1>
              <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
                Pagamento e confirmação
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 lg:p-6 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5 pt-1">
            {/* Top Status Icon & Headline */}
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-[#D4F7DF] text-[#1FAA52] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={22} className="text-[#109E48]" />
              </div>
              <h2 className="font-display text-base lg:text-lg font-extrabold text-[#3C1F15] leading-snug px-2">
                {firstName}, seu pedido foi registrado com sucesso.
              </h2>
              <p className="text-[11px] text-[#7A6357] px-4 leading-tight">
                Confira o valor a pagar agora e use o WhatsApp para concluir o pagamento com a Deli.
              </p>
            </div>

            <div className="bg-[#FFF4E8] rounded-[18px] p-4 border border-[#F0D5BE] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-[#8C7367]">Pagamento</div>
                  <div className="text-sm font-black text-[#3C1F15]">
                    {order.payment_plan === "full" ? "Pagamento integral no ato" : "Entrada obrigatória de 50%"}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#FFFDF9] border border-[#E8D9CB] text-[10px] font-bold text-[#8C5237]">
                  {order.payment_status === "paid"
                    ? "Pago"
                    : order.payment_status === "partially_paid"
                      ? "Entrada paga"
                      : "Aguardando pagamento"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white border border-[#F0E2D2]">
                  <div className="text-[9px] uppercase font-bold text-[#9E8679]">Total</div>
                  <div className="text-xs font-black">{formatCurrency(order.total)}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#F0E2D2]">
                  <div className="text-[9px] uppercase font-bold text-[#9E8679]">Agora</div>
                  <div className="text-xs font-black text-[#E05A36]">{formatCurrency(order.amount_due_now ?? order.total)}</div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#F0E2D2]">
                  <div className="text-[9px] uppercase font-bold text-[#9E8679]">Na entrega</div>
                  <div className="text-xs font-black">{formatCurrency(order.balance_due ?? 0)}</div>
                </div>
              </div>

              <p className="text-[10px] text-[#7A6357] leading-relaxed">
                A entrada de 50% é obrigatória para confirmar a encomenda. Se você escolheu pagar 100% agora, o saldo na entrega será zero.
              </p>
            </div>

            {order.fulfillment_type === "delivery" && (
              <div className="bg-[#FFF8EE] rounded-[18px] p-4 border border-[#F0D5BE] shadow-xs space-y-2.5">
                <div className="text-[10px] uppercase font-black tracking-wider text-[#8C7367]">Entrega</div>
                <div className="text-sm font-black text-[#3C1F15]">Valor da entrega a combinar</div>
                <p className="text-[11px] text-[#7A6357] leading-relaxed">
                  A taxa de entrega não faz parte do total do pedido. A Deli irá consultar uma estimativa para o endereço informado e enviar o valor pelo WhatsApp. A entrega só será solicitada após sua aprovação.
                </p>
              </div>
            )}

            {/* Simulated WhatsApp Message Card */}
            <div className="bg-[#FFFDF6] rounded-[18px] p-3.5 border border-[#EAD8C7] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#F2E5D6] pb-2">
                <span className="text-[10px] font-extrabold text-[#1FAA52] flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-[#1FAA52] inline-block animate-pulse" />
                  SOLICITAÇÃO #{order.public_code}
                </span>
                <span className="text-[9px] font-bold text-[#A89688] uppercase tracking-wider">
                  MENSAGEM GERADA
                </span>
              </div>

              {/* Speech bubble card */}
              <div className="bg-[#F8FDF9] p-3.5 rounded-xl border border-[#D5EEDD] space-y-2 text-xs text-[#3C1F15] font-sans">
                <p className="font-bold text-[#109E48] text-xs">
                  Olá, Deli Salgados! Meu nome é {firstName}. 👋
                </p>
                <p className="text-[11px] text-[#554035]">
                  Gostaria de enviar uma solicitação de pedido pelo cardápio digital.
                </p>

                <div className="py-1.5 space-y-1 border-y border-[#E2F2E7] text-[11px]">
                  {order.items &&
                    order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[#3C1F15]">
                        <span>
                          • {item.product_name_snapshot}
                          {item.variant_name_snapshot && ` (${item.variant_name_snapshot})`} · {item.quantity} {item.unit_label_snapshot || "un."}
                        </span>
                        <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                </div>

                <div className="text-[10px] space-y-0.5 text-[#6B5347] pt-0.5">
                  <div>
                    <span className="font-bold">Nome:</span> {order.customer_name}
                  </div>
                  <div>
                    <span className="font-bold">Data:</span> {order.desired_date}
                  </div>
                  <div>
                    <span className="font-bold">Modalidade:</span>{" "}
                    {order.fulfillment_type === "pickup"
                      ? "Retirada"
                      : order.fulfillment_type === "delivery"
                      ? "Entrega"
                      : "A combinar"}
                  </div>
                  {order.delivery_address && (
                    <div>
                      <span className="font-bold">Endereço:</span> {order.delivery_address}
                    </div>
                  )}
                  {order.customer_reference_point && (
                    <div>
                      <span className="font-bold">Referência:</span> {order.customer_reference_point}
                    </div>
                  )}
                  {order.customer_note && (
                    <div>
                      <span className="font-bold">Observações:</span> {order.customer_note}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E2F2E7] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-[#3C1F15]">Total do pedido:</span>
                    <span className="text-sm font-black text-[#E05A36]">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#6B5347]">{order.payment_plan === "full" ? "Pagamento agora" : "Entrada agora"}</span>
                    <strong>{formatCurrency(order.amount_due_now ?? order.total)}</strong>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#6B5347]">Saldo dos produtos na entrega</span>
                    <strong>{formatCurrency(order.balance_due ?? 0)}</strong>
                  </div>
                </div>
              </div>

              {/* Helper note */}
              <p className="text-[10px] text-center text-[#8C7367] leading-tight">
                💬 Caso o WhatsApp não abra no app, você também pode abrir no navegador.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pb-4">
            {finalWhatsappUrl ? (
              <a
                href={finalWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleOpenWhatsApp}
                className="w-full py-4 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-extrabold uppercase tracking-wide shadow-lg flex items-center justify-center gap-2 transition transform active:scale-[0.98]"
              >
                <MessageCircle size={18} className="fill-white stroke-none" />
                <span>{order.fulfillment_type === "delivery" ? "ABRIR WHATSAPP E COMBINAR ENTREGA" : "ABRIR WHATSAPP"}</span>
              </a>
            ) : (
              <div className="w-full p-4 rounded-2xl bg-[#FFF4E8] border border-[#E8D9CB] text-center text-[#7A6357] text-xs font-bold">
                Contato temporariamente indisponível
              </div>
            )}

            {settings?.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-[#FFFDF9] text-xs font-extrabold uppercase tracking-wide shadow-md flex items-center justify-center gap-2 transition transform active:scale-[0.98] border border-[#EAD8C7]"
              >
                <Instagram size={17} className="stroke-[2.2] text-[#E05A36]" />
                <span>DELI NO INSTA</span>
              </a>
            )}

            <Link
              href="/"
              className="w-full py-3 rounded-2xl bg-white hover:bg-[#FFF9E6] border border-[#EAD8C7] text-[#3C1F15] text-xs font-bold uppercase tracking-wide text-center block transition"
            >
              Voltar ao Cardápio
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function OrderSentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Carregando...</div>}>
      <EnviadoContent />
    </Suspense>
  );
}
