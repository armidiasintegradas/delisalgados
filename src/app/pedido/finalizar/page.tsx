"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, MapPin, Calendar, User, Phone, MessageSquare, AlertCircle, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { formatCurrency } from "@/lib/formatters";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, customerData, setCustomerData, totalAmount, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

    if (!customerData.customerName.trim()) {
      setErrorMessage("Por favor, informe seu nome completo.");
      return;
    }
    if (!customerData.customerPhone.trim()) {
      setErrorMessage("Por favor, informe seu número de WhatsApp.");
      return;
    }
    if (!customerData.desiredDate.trim()) {
      setErrorMessage("Por favor, selecione a data desejada.");
      return;
    }
    if (customerData.fulfillmentType === "delivery" && !customerData.deliveryAddress?.trim()) {
      setErrorMessage("Por favor, preencha o endereço completo para entrega.");
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
        throw new Error(data.error || "Não foi possível criar o pedido.");
      }

      // Order created server-side! Clear cart and redirect to Screen 06
      clearCart();
      router.push(`/pedido/enviado?code=${data.order.public_code}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado ao processar pedido.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex flex-col w-full max-w-[440px] mx-auto shadow-2xl relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#DF5F45] text-white px-4 py-3.5 shadow-md flex items-center gap-3">
        <Link
          href="/pedido"
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-base font-bold leading-tight">Finalizar pedido</h1>
          <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
            Informações para contato e entrega
          </span>
        </div>
      </header>

      {/* Form Content */}
      <main className="p-4 flex-1 flex flex-col justify-between">
        <form onSubmit={handleSubmit} className="space-y-3.5 flex-1 flex flex-col justify-between">
          <div className="space-y-3.5">
            {/* Order Summary Mini Card */}
            <Link
              href="/pedido"
              className="bg-[#FFFDF6] rounded-[18px] p-3.5 border border-[#EAD8C7] shadow-xs flex items-center justify-between hover:bg-[#FFF9E6] transition"
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
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
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
              {/* Desired Date */}
              <div>
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1">
                  DATA DA ENTREGA *
                </label>
                <input
                  type="date"
                  required
                  value={customerData.desiredDate || "2026-09-25"}
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
            </div>

            {/* Address (if delivery) */}
            {customerData.fulfillmentType === "delivery" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1">
                  ENDEREÇO COMPLETO *
                </label>
                <textarea
                  required
                  rows={2}
                  value={customerData.deliveryAddress || ""}
                  onChange={(e) =>
                    setCustomerData((prev) => ({
                      ...prev,
                      deliveryAddress: e.target.value,
                    }))
                  }
                  placeholder="Rua, número, complemento, bairro e ponto de referência"
                  className="w-full bg-[#FFFDF6] border border-[#EAD8C7] rounded-2xl p-2.5 text-xs text-[#3C1F15] placeholder:text-[#A89688] focus:outline-none focus:ring-2 focus:ring-[#E05A36] focus:border-transparent transition shadow-2xs"
                />
              </div>
            )}

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
          </div>

          {/* Sticky Submit Button */}
          <div className="pt-3 pb-4 space-y-1.5 mt-auto">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-white text-xs font-extrabold uppercase tracking-wide shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
            >
              <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                <Send size={11} className="ml-0.5" />
              </div>
              <span>{isSubmitting ? "Criando solicitação..." : "Enviar pedido pelo WhatsApp"}</span>
            </button>
            <p className="text-[10px] text-center text-[#7A6357]">
              Você será redirecionado para o WhatsApp com a mensagem pronta.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
