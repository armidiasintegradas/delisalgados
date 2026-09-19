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
      if (orderCode === "DL-0042" || searchParams.get("mock") === "stitch") {
        setOrder({
          id: "mock-order-0042",
          public_code: "DL-0042",
          customer_name: "Maria Silva",
          customer_phone: "(81) 98765-4321",
          desired_date: "25/09/2026",
          fulfillment_type: "pickup",
          total: 545.0,
          status: "confirmed",
          whatsapp_status: "sent",
          delivery_address: null,
          customer_note: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: [
            {
              id: "item-1",
              order_id: "mock-order-0042",
              product_id: "p0000000-0000-0000-0000-000000000031",
              variant_id: null,
              product_name_snapshot: "Coxinha",
              variant_name_snapshot: null,
              unit_price_snapshot: 1.7,
              unit_label_snapshot: "un.",
              quantity: 100,
              subtotal: 170.0,
              note: null,
              created_at: new Date().toISOString(),
            },
            {
              id: "item-2",
              order_id: "mock-order-0042",
              product_id: "p0000000-0000-0000-0000-000000000038",
              variant_id: null,
              product_name_snapshot: "Bolinho de Queijo",
              variant_name_snapshot: null,
              unit_price_snapshot: 2.0,
              unit_label_snapshot: "un.",
              quantity: 100,
              subtotal: 200.0,
              note: null,
              created_at: new Date().toISOString(),
            },
            {
              id: "item-3",
              order_id: "mock-order-0042",
              product_id: "p0000000-0000-0000-0000-000000000036",
              variant_id: "v-1",
              product_name_snapshot: "Camarão Empanado",
              variant_name_snapshot: "Congelado",
              unit_price_snapshot: 175.0,
              unit_label_snapshot: "1 kg",
              quantity: 1,
              subtotal: 175.0,
              note: null,
              created_at: new Date().toISOString(),
            },
          ],
        });
        setIsLoading(false);
        return;
      }
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

  const effectiveSettings: Settings = settings || {
    business_name: "Deli Salgados",
    whatsapp_number: "5581987654321",
    instagram_url: "https://www.instagram.com/deli.salgados",
    address: "Recife, PE",
    pickup_information: "",
    delivery_information: "",
    whatsapp_opening_message: "Olá, Deli Salgados! Gostaria de enviar uma solicitação de pedido pelo cardápio digital:",
    whatsapp_closing_message: "Aguardo confirmação da disponibilidade e do valor final. Obrigado!",
    catalog_show_search: true,
    catalog_show_prices: true,
    catalog_show_unavailable: false,
    special_order_cta_enabled: true,
    special_order_cta_text: "",
    logo_url: null,
    pattern_url: null,
  };

  const whatsappMessage = order ? generateWhatsAppMessage(order, effectiveSettings) : "";
  const whatsappUrl = buildWhatsAppLink(effectiveSettings.whatsapp_number, whatsappMessage);

  return (
    <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex flex-col w-[390px] max-w-[390px] mx-auto justify-between">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#DF5F45] text-white px-4 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
            <img src="/logo-official.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">Quase lá!</h1>
            <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
              Pronto para envio
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 flex-1 flex flex-col justify-between space-y-4">
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
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[#3C1F15]">
                      <span>
                        • {item.product_name_snapshot}
                        {item.variant_name_snapshot && ` (${item.variant_name_snapshot})`} · {item.quantity} {item.unit_label_snapshot || "un."}
                      </span>
                      <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between text-[#3C1F15]">
                      <span>• Coxinha · 100 un.</span>
                      <span className="font-bold">R$ 170,00</span>
                    </div>
                    <div className="flex justify-between text-[#3C1F15]">
                      <span>• Bolinho de Queijo · 100 un.</span>
                      <span className="font-bold">R$ 200,00</span>
                    </div>
                    <div className="flex justify-between text-[#3C1F15]">
                      <span>• Camarão Empanado (Congelado) · 1 kg</span>
                      <span className="font-bold">R$ 175,00</span>
                    </div>
                  </>
                )}
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
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-extrabold uppercase tracking-wide shadow-lg flex items-center justify-center gap-2 transition transform active:scale-[0.98]"
          >
            <MessageCircle size={18} className="fill-white stroke-none" />
            <span>Abrir WhatsApp</span>
          </a>

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
