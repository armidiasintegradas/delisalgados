"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, MapPin, Calendar, User, Phone, MessageSquare, AlertCircle, ShoppingBag, Mail, BadgeDollarSign, CheckCircle2, Navigation, ExternalLink } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { formatCurrency } from "@/lib/formatters";
import { MIN_ORDER_UNITS, isUnitBasedMinimum } from "@/lib/orderRules";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, customerData, setCustomerData, totalAmount, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<"deposit_50" | "full">("deposit_50");
  const [pickupAddress, setPickupAddress] = useState("");

  const qualifyingUnitTotal = items
    .filter((item) => isUnitBasedMinimum(item.minimumQuantity, item.unitLabel))
    .reduce((sum, item) => sum + item.quantity, 0);
  const hasUnitBasedItems = items.some((item) =>
    isUnitBasedMinimum(item.minimumQuantity, item.unitLabel)
  );
  const amountDueNow = paymentPlan === "full"
    ? Number(totalAmount.toFixed(2))
    : Number((totalAmount * 0.5).toFixed(2));
  const balanceOnDelivery = Number((totalAmount - amountDueNow).toFixed(2));

  useEffect(() => {
    setMounted(true);

    fetch("/api/catalog", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.address) setPickupAddress(data.settings.address);
      })
      .catch(() => {});

    fetch("/api/customer/profile", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.authenticated || !data?.profile) return;
        const p = data.profile;
        setCustomerData((prev) => ({
          ...prev,
          customerName: prev.customerName || p.full_name || "",
          customerPhone: prev.customerPhone || p.whatsapp || "",
          customerEmail: prev.customerEmail || p.email || "",
          deliveryAddress: prev.deliveryAddress || p.address || "",
          referencePoint: prev.referencePoint || p.reference_point || "",
        }));
      })
      .catch(() => {});
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex flex-col w-full max-w-[440px] mx-auto shadow-2xl" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <h2 className="text-lg font-bold text-[#3C1F15]">Seu carrinho está vazio</h2>
        <p className="text-xs text-[#7A6357] mt-1 mb-4">
          Adicione itens ao seu pedido antes de finalizar.
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-[#3C1F15] text-white text-xs font-bold shadow"
        >
          Voltar ao Cardápio
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (hasUnitBasedItems && qualifyingUnitTotal < MIN_ORDER_UNITS) {
      setErrorMessage(
        `O pedido mínimo é de ${MIN_ORDER_UNITS} unidades. Seu pedido possui ${qualifyingUnitTotal} unidades.`
      );
      return;
    }

    if (!customerData.customerName.trim()) {
      setErrorMessage("Por favor, informe seu nome completo.");
      return;
    }
    if (!customerData.customerPhone.trim()) {
      setErrorMessage("Por favor, informe seu número de WhatsApp.");
      return;
    }
    if (!customerData.customerEmail.trim()) {
      setErrorMessage("Por favor, informe seu e-mail.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(customerData.customerEmail.trim())) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }
    if (!customerData.deliveryAddress.trim()) {
      setErrorMessage("Por favor, informe seu endereço completo.");
      return;
    }
    if (!customerData.referencePoint.trim()) {
      setErrorMessage("Por favor, informe um ponto de referência.");
      return;
    }
    if (!customerData.desiredDate.trim()) {
      setErrorMessage("Por favor, selecione a data desejada.");
      return;
    }
    setIsSubmitting(true);

    try {
      // POST to server for server-side authority & snapshots
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customerData,
          paymentPlan,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            note: i.note,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível registrar seu pedido agora. Seus itens continuam no carrinho. Tente novamente em instantes.");
      }

      // Create/reuse the customer login through passwordless e-mail access.
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const authClient = createClient();
        if (authClient && customerData.customerEmail) {
          await authClient.auth.signInWithOtp({
            email: customerData.customerEmail.trim().toLowerCase(),
            options: {
              shouldCreateUser: true,
              emailRedirectTo: `${window.location.origin}/auth/callback?next=/perfil`,
            },
          });
        }
      } catch (authError) {
        console.warn("Customer access link could not be sent:", authError);
      }

      // Order created server-side! Store in session with handoff token
      if (typeof window !== "undefined") {
        sessionStorage.setItem("deli_last_order", JSON.stringify(data.order));
        if (data.handoffToken) {
          sessionStorage.setItem("deli_handoff_token", data.handoffToken);
        }
      }

      // Note: Cart is NOT cleared here. It remains intact until the handoff page confirms loading.
      const tokenParam = data.handoffToken ? `&t=${encodeURIComponent(data.handoffToken)}` : "";
      router.push(`/pedido/pagamento?code=${encodeURIComponent(data.order.public_code)}${tokenParam}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Não foi possível registrar seu pedido agora. Seus itens continuam no carrinho. Tente novamente em instantes.");
      setIsSubmitting(false);
    }
  };

  const todayDate = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex flex-col w-full max-w-[440px] lg:max-w-none mx-auto shadow-2xl lg:shadow-none relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#DF5F45] text-white shadow-md">
        <div className="w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/pedido"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <img
              src="/deli-logo-cream-official.png"
              alt="Deli Salgados"
              className="h-9 w-auto object-contain select-none"
            />
            <div>
              <h1 className="text-base lg:text-lg font-bold leading-tight">Finalizar pedido</h1>
              <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
                Informações para contato e entrega
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="w-full max-w-[440px] lg:max-w-[1280px] mx-auto p-4 lg:p-8 flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start flex-1 flex flex-col justify-between">
          {/* Left Column: Form Fields */}
          <div className="space-y-3.5 bg-[#FFFDF6] lg:p-6 lg:rounded-3xl lg:border lg:border-[#EAD8C7] lg:shadow-xs">
            {/* Mobile Order Summary Mini Card */}
            <Link
              href="/pedido"
              className="lg:hidden bg-[#FFFDF6] rounded-[18px] p-3.5 border border-[#EAD8C7] shadow-xs flex items-center justify-between hover:bg-[#FFF9E6] transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FFE8E0] text-[#E05A36] flex items-center justify-center shrink-0">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#3C1F15] block leading-tight">
                    Resumo do seu pedido · {items.length} {items.length === 1 ? "item" : "itens"}
                  </span>
                  <span className="text-[10px] text-[#7A6357]">
                    Toque para ver os detalhes ou alterar
                  </span>
                </div>
              </div>
              <span className="text-sm font-extrabold text-[#E05A36] whitespace-nowrap">
                {formatCurrency(totalAmount)} &gt;
              </span>
            </Link>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-900 leading-snug">Não foi possível registrar seu pedido agora.</p>
                    <p className="text-rose-700 mt-0.5">{errorMessage}</p>
                    <p className="text-rose-600/90 text-[11px] mt-1 font-semibold">Seus itens continuam seguros no carrinho.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as any)}
                  className="self-start px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-xs"
                >
                  TENTAR NOVAMENTE
                </button>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1">
                NOME COMPLETO *
              </label>
              <input
                type="text"
                required
                value={customerData.customerName}
                onChange={(e) =>
                  setCustomerData((prev) => ({ ...prev, customerName: e.target.value }))
                }
                placeholder="Ex: Maria Silva"
                className="w-full bg-[#FFFDF6] border border-[#EAD8C7] rounded-2xl p-3 text-xs text-[#3C1F15] placeholder:text-[#A89688] focus:outline-none focus:ring-2 focus:ring-[#E05A36] focus:border-transparent transition shadow-2xs"
              />
            </div>

            {/* Date and Phone Row (Two Columns) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Desired Date - Section 11: Dynamic min date, starts empty unless persisted */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1">
                  DATA DA ENTREGA *
                </label>
                <input
                  type="date"
                  required
                  min={todayDate}
                  value={customerData.desiredDate || ""}
                  onChange={(e) =>
                    setCustomerData((prev) => ({ ...prev, desiredDate: e.target.value }))
                  }
                  className="w-full bg-[#FFFDF6] border border-[#EAD8C7] rounded-2xl p-3 text-xs text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#E05A36] focus:border-transparent transition shadow-2xs"
                />
              </div>

              {/* Customer Phone (WhatsApp) */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1">
                  WhatsApp para contato *
                </label>
                <input
                  type="tel"
                  required
                  value={customerData.customerPhone}
                  onChange={(e) =>
                    setCustomerData((prev) => ({ ...prev, customerPhone: e.target.value }))
                  }
                  placeholder="(81) 98765-4321"
                  className="w-full bg-[#FFFDF6] border border-[#EAD8C7] rounded-2xl p-3 text-xs text-[#3C1F15] placeholder:text-[#A89688] focus:outline-none focus:ring-2 focus:ring-[#E05A36] focus:border-transparent transition shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1">
                E-MAIL *
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89688]" />
                <input
                  type="email"
                  required
                  value={customerData.customerEmail}
                  onChange={(e) =>
                    setCustomerData((prev) => ({ ...prev, customerEmail: e.target.value }))
                  }
                  placeholder="seuemail@exemplo.com"
                  className="w-full bg-[#FFFDF6] border border-[#EAD8C7] rounded-2xl pl-9 pr-3 py-3 text-xs text-[#3C1F15] placeholder:text-[#A89688] focus:outline-none focus:ring-2 focus:ring-[#E05A36] focus:border-transparent transition shadow-2xs"
                />
              </div>
              <p className="text-[10px] text-[#7A6357] mt-1">
                Este e-mail será usado para acessar sua conta e seu histórico de pedidos.
              </p>
            </div>

            {/* Fulfillment Type */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1.5">
                MODALIDADE DE ATENDIMENTO *
              </label>
              <div className="grid grid-cols-3 gap-2 bg-[#FFFDF6] p-1 rounded-2xl border border-[#EAD8C7]">
                {[
                  { id: "pickup", label: "Retirada" },
                  { id: "delivery", label: "Entrega" },
                  { id: "to_agree", label: "A combinar" },
                ].map((m) => {
                  const isSelected = customerData.fulfillmentType === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() =>
                        setCustomerData((prev) => ({
                          ...prev,
                          fulfillmentType: m.id as any,
                        }))
                      }
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition text-center ${
                        isSelected
                          ? "bg-[#3C1F15] text-white shadow-xs"
                          : "bg-transparent text-[#614439] hover:bg-[#FFF4E8]"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#7A6357] mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E05A36] inline-block shrink-0" />
                <span>
                  {customerData.fulfillmentType === "pickup" && "Retirada em nosso balcão de atendimento no horário combinado."}
                  {customerData.fulfillmentType === "delivery" && "Os detalhes da entrega serão confirmados pela Deli no WhatsApp."}
                  {customerData.fulfillmentType === "to_agree" && "Os detalhes da entrega serão confirmados pela Deli no WhatsApp."}
                </span>
              </p>

              {customerData.fulfillmentType === "pickup" && pickupAddress && (
                <div className="mt-3 p-4 rounded-2xl bg-[#FFF4E8] border border-[#F0D5BE] space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#F0D5BE] text-[#E05A36] flex items-center justify-center shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-black text-[#8C7367]">
                        Endereço para retirada
                      </div>
                      <div className="text-xs font-bold text-[#3C1F15] leading-relaxed mt-0.5">
                        {pickupAddress}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-white border border-[#E8D9CB] text-[#3C1F15] text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-[#FFFDF9] transition"
                    >
                      <ExternalLink size={13} />
                      VER NO MAPA
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-[#3C1F15] text-white text-[10px] font-black flex items-center justify-center gap-1.5 hover:bg-[#27120A] transition"
                    >
                      <Navigation size={13} />
                      VER ROTAS
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Customer address — required for account and future orders. This is the customer address, not the Deli pickup address. */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1">
                  SEU ENDEREÇO COMPLETO *
                </label>
                <textarea
                  required
                  rows={2}
                  value={customerData.deliveryAddress}
                  onChange={(e) =>
                    setCustomerData((prev) => ({
                      ...prev,
                      deliveryAddress: e.target.value,
                    }))
                  }
                  placeholder="Rua, número, complemento, bairro, cidade e CEP"
                  className="w-full bg-[#FFFDF6] border border-[#EAD8C7] rounded-2xl p-2.5 text-xs text-[#3C1F15] placeholder:text-[#A89688] focus:outline-none focus:ring-2 focus:ring-[#E05A36] focus:border-transparent transition shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1">
                  PONTO DE REFERÊNCIA *
                </label>
                <input
                  type="text"
                  required
                  value={customerData.referencePoint}
                  onChange={(e) =>
                    setCustomerData((prev) => ({
                      ...prev,
                      referencePoint: e.target.value,
                    }))
                  }
                  placeholder="Ex: ao lado da farmácia, portão azul..."
                  className="w-full bg-[#FFFDF6] border border-[#EAD8C7] rounded-2xl p-3 text-xs text-[#3C1F15] placeholder:text-[#A89688] focus:outline-none focus:ring-2 focus:ring-[#E05A36] focus:border-transparent transition shadow-2xs"
                />
              </div>
            </div>

            {/* Payment plan */}
            <div className="bg-white rounded-3xl border border-[#EAD8C7] p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#FFF0E2] text-[#E05A36] flex items-center justify-center">
                  <BadgeDollarSign size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#3C1F15]">Pagamento</h3>
                  <p className="text-[10px] text-[#7A6357]">A entrada mínima de 50% é obrigatória para confirmar a encomenda.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentPlan("deposit_50")}
                className={`w-full p-3.5 rounded-2xl border text-left transition ${
                  paymentPlan === "deposit_50"
                    ? "border-[#E05A36] bg-[#FFF4E8] ring-2 ring-[#E05A36]/10"
                    : "border-[#EAD8C7] bg-[#FFFDF9]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-[#3C1F15]">Pagar 50% agora</div>
                    <div className="text-[10px] text-[#7A6357] mt-0.5">Entrada obrigatória. Os outros 50% ficam para a entrega.</div>
                  </div>
                  {paymentPlan === "deposit_50" && <CheckCircle2 size={18} className="text-[#E05A36] shrink-0" />}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#7A6357]">Pagamento agora</span>
                  <span className="font-black text-[#E05A36]">{formatCurrency(Number((totalAmount * 0.5).toFixed(2)))}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentPlan("full")}
                className={`w-full p-3.5 rounded-2xl border text-left transition ${
                  paymentPlan === "full"
                    ? "border-[#3C1F15] bg-[#FFF9E6] ring-2 ring-[#3C1F15]/10"
                    : "border-[#EAD8C7] bg-[#FFFDF9]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-[#3C1F15]">Pagar 100% agora</div>
                    <div className="text-[10px] text-[#7A6357] mt-0.5">Deixe o pedido totalmente quitado no ato.</div>
                  </div>
                  {paymentPlan === "full" && <CheckCircle2 size={18} className="text-[#3C1F15] shrink-0" />}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#7A6357]">Pagamento agora</span>
                  <span className="font-black text-[#3C1F15]">{formatCurrency(totalAmount)}</span>
                </div>
              </button>

              <div className="rounded-2xl bg-[#F8F4EF] p-3 text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-[#7A6357]">Total do pedido</span><strong>{formatCurrency(totalAmount)}</strong></div>
                <div className="flex justify-between"><span className="text-[#7A6357]">A pagar agora</span><strong className="text-[#E05A36]">{formatCurrency(amountDueNow)}</strong></div>
                <div className="flex justify-between"><span className="text-[#7A6357]">Saldo na entrega</span><strong>{formatCurrency(balanceOnDelivery)}</strong></div>
              </div>
            </div>

            {/* General Notes */}
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1">
                OBSERVAÇÕES (OPCIONAL)
              </label>
              <textarea
                rows={2}
                value={customerData.customerNote || ""}
                onChange={(e) =>
                  setCustomerData((prev) => ({ ...prev, customerNote: e.target.value }))
                }
                placeholder="Alguma informação importante sobre seu pedido? (horário previsto, separar em caixas...)"
                className="w-full bg-[#FFFDF6] border border-[#EAD8C7] rounded-2xl p-2.5 text-xs text-[#3C1F15] placeholder:text-[#A89688] focus:outline-none focus:ring-2 focus:ring-[#E05A36] focus:border-transparent transition shadow-2xs"
              />
            </div>

            {/* Mobile Submit Button inside left flow */}
            <div className="pt-3 pb-2 space-y-1.5 lg:hidden">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-white text-xs font-extrabold uppercase tracking-wide shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
              >
                <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                  <Send size={11} className="ml-0.5" />
                </div>
                <span>{isSubmitting ? "Criando pedido..." : "Finalizar pedido"}</span>
              </button>
              <p className="text-[10px] text-center text-[#7A6357]">
                Após registrar o pedido, você verá o valor da entrada e os próximos passos para pagamento.
              </p>
            </div>
          </div>

          {/* Right Column: Desktop Compact Order Summary & Sticky Submit */}
          <div className="hidden lg:flex lg:flex-col lg:sticky lg:top-24 bg-[#FFFDF6] rounded-3xl p-5 border border-[#EAD8C7] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E2D4] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#E05A36]" />
                <h3 className="text-sm font-extrabold text-[#3C1F15]">Resumo do Pedido</h3>
              </div>
              <span className="bg-[#FFE8E0] text-[#E05A36] text-[11px] px-2.5 py-0.5 rounded-full font-extrabold">
                {items.length} {items.length === 1 ? "item" : "itens"}
              </span>
            </div>

            <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 no-scrollbar text-xs">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FFF9E6] p-2.5 rounded-xl border border-[#EFE5D5] flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#3C1F15] truncate">
                      {item.quantity}× {item.productName}
                    </div>
                    {item.variantName && (
                      <div className="text-[9px] font-bold text-[#E05A36] uppercase">
                        {item.variantName}
                      </div>
                    )}
                  </div>
                  <span className="font-extrabold text-[#7A6357] shrink-0">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#F0E2D4] pt-3 flex items-center justify-between">
              <span className="text-xs font-bold text-[#7A6357]">Total estimado:</span>
              <span className="text-xl font-extrabold text-[#E05A36]">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="rounded-2xl bg-[#FFF4E8] border border-[#F0D5BE] p-3 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#7A6357]">{paymentPlan === "full" ? "Pagamento integral agora" : "Entrada obrigatória agora"}</span>
                <strong className="text-[#E05A36]">{formatCurrency(amountDueNow)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6357]">Saldo na entrega</span>
                <strong>{formatCurrency(balanceOnDelivery)}</strong>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-white text-xs font-extrabold uppercase tracking-wide shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                  <Send size={11} className="ml-0.5" />
                </div>
                <span>{isSubmitting ? "Criando pedido..." : "Finalizar pedido"}</span>
              </button>
              <Link
                href="/pedido"
                className="w-full py-2.5 rounded-xl bg-white hover:bg-[#FFF9E6] border border-[#EAD8C7] text-[#3C1F15] text-[11px] font-bold text-center block uppercase transition"
              >
                Alterar itens do pedido
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
