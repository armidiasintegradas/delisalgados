"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Instagram, CheckCircle2, Copy, Check, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/public/Logo";
import { Order, Settings } from "@/types";
import { formatCurrency, generateWhatsAppMessage, buildWhatsAppLink } from "@/lib/formatters";

function EnviadoContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("code");

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!orderCode) {
        setIsLoading(false);
        return;
      }
      try {
        const [orderRes, catRes] = await Promise.all([
          fetch(`/api/orders/${orderCode}`),
          fetch("/api/catalog"),
        ]);
        const orderData = await orderRes.json();
        const catData = await catRes.json();

        if (orderData.order) setOrder(orderData.order);
        if (catData.settings) setSettings(catData.settings);
      } catch (e) {
        console.error("Error loading order details:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [orderCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-8 h-8 border-3 border-[#E05A36] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#7A6357] font-semibold">Preparando envio...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <h2 className="text-base font-bold text-[#3C1F15]">Pedido não encontrado</h2>
        <p className="text-xs text-[#7A6357] mt-1 mb-4">
          Não localizamos a solicitação informada.
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

  const whatsappNumber = settings?.whatsapp_number || "";
  const whatsappMessage =
    order && settings && whatsappNumber
      ? generateWhatsAppMessage(order, settings)
      : "";
  const whatsappUrl = whatsappNumber ? buildWhatsAppLink(whatsappNumber, whatsappMessage) : "";

  return (
    <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex flex-col w-full max-w-[440px] lg:max-w-[720px] mx-auto shadow-2xl lg:my-8 lg:rounded-3xl lg:border lg:border-[#EAD8C7] lg:overflow-hidden justify-between relative">
      {/* Header */}
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
            <h1 className="text-base font-bold leading-tight">Quase lá!</h1>
            <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
              Pronto para envio
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 lg:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3.5 pt-1">
          {/* Top Status Icon & Headline */}
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#D4F7DF] text-[#1FAA52] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={22} className="text-[#109E48]" />
            </div>
            <h2 className="font-display text-base font-extrabold text-[#3C1F15] leading-snug px-2">
              Seu pedido está pronto para ser enviado pelo WhatsApp.
            </h2>
            <p className="text-[11px] text-[#7A6357] px-4 leading-tight">
              Ao clicar no botão abaixo, sua mensagem formatada será aberta no WhatsApp da Deli Salgados.
            </p>
          </div>

          {/* Simulated WhatsApp Message Card */}
          <div className="bg-[#FFFDF6] rounded-[18px] p-3.5 border border-[#EAD8C7] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#F2E5D6] pb-2">
              <span className="text-[10px] font-extrabold text-[#1FAA52] flex items-center gap-1.5 uppercase">
                <span className="w-2 h-2 rounded-full bg-[#1FAA52] inline-block" />
                SOLICITAÇÃO #{order.public_code}
              </span>
              <span className="text-[9px] font-bold text-[#A89688] uppercase tracking-wider">
                MENSAGEM GERADA
              </span>
            </div>

            {/* Speech bubble card */}
            <div className="bg-[#F8FDF9] p-3 rounded-xl border border-[#D5EEDD] space-y-1.5 text-xs text-[#3C1F15] font-sans">
              <p className="font-bold text-[#109E48] text-xs">
                Olá, Deli Salgados! 👋
              </p>
              <p className="text-[11px] text-[#554035]">
                Gostaria de solicitar este pedido:
              </p>

              <div className="py-1 space-y-1 border-y border-[#E2F2E7] text-[11px]">
                {order.items && order.items.map((item, idx) => (
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
                <div><span className="font-bold">Nome:</span> {order.customer_name}</div>
                <div><span className="font-bold">Data:</span> {order.desired_date}</div>
                <div><span className="font-bold">Modalidade:</span> {order.fulfillment_type === "pickup" ? "Retirada" : order.fulfillment_type === "delivery" ? "Entrega" : "A combinar"}</div>
              </div>

              <div className="pt-1.5 border-t border-[#E2F2E7] flex justify-between items-center">
                <span className="text-xs font-extrabold text-[#3C1F15]">Total Estimado:</span>
                <span className="text-sm font-black text-[#E05A36]">
                  {formatCurrency(order.total)}
                </span>
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
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-extrabold uppercase tracking-wide shadow-lg flex items-center justify-center gap-2 transition transform active:scale-[0.98]"
            >
              <MessageCircle size={18} className="fill-white stroke-none" />
              <span>Abrir WhatsApp</span>
            </a>
          ) : (
            <div className="w-full p-3.5 rounded-2xl bg-[#FFF4E8] border border-[#E8D9CB] text-center text-[#7A6357] text-xs font-semibold">
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
  );
}

export default function OrderSentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Carregando...</div>}>
      <EnviadoContent />
    </Suspense>
  );
}
