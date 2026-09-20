"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  MessageCircle,
  QrCode,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Order, Settings } from "@/types";
import { formatCurrency, getFirstName } from "@/lib/formatters";
import { buildPixPayload } from "@/lib/pix";
import { PaymentSuccessModal } from "@/components/public/PaymentSuccessModal";

function PaymentContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("code");
  const handoffToken = searchParams.get("t");

  const [order, setOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Partial<Settings> | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportingPayment, setReportingPayment] = useState(false);
  const [paymentReportError, setPaymentReportError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  async function load(options?: { silent?: boolean }) {
    const silent = Boolean(options?.silent);
    if (!orderCode) {
      setError("Código do pedido não informado.");
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError(null);

    const activeToken =
      handoffToken ||
      (typeof window !== "undefined" ? sessionStorage.getItem("deli_handoff_token") : null);

    if (!activeToken) {
      setError("Não foi possível validar este pedido. Volte ao histórico ou refaça o acesso.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/orders/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: orderCode, token: activeToken }),
      });
      const data = await res.json();

      if (!res.ok || !data.order) {
        throw new Error(data.error || "Pedido não localizado.");
      }

      setOrder(data.order);
      setSettings(data.settings || null);
      setWhatsappUrl(data.whatsapp_url || "");

      if (typeof window !== "undefined") {
        sessionStorage.setItem("deli_last_order", JSON.stringify(data.order));
        sessionStorage.setItem("deli_handoff_token", activeToken);
      }
    } catch (err: any) {
      setError(err?.message || "Não foi possível carregar o pagamento.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [orderCode, handoffToken]);

  useEffect(() => {
    if (!order || order.payment_status === "paid") return;

    const interval = window.setInterval(() => {
      load({ silent: true });
    }, 10000);

    return () => window.clearInterval(interval);
  }, [order?.id, order?.payment_status, orderCode, handoffToken]);

  useEffect(() => {
    if (!order || order.payment_status !== "paid" || typeof window === "undefined") return;

    const storageKey = `deli_final_payment_popup_${order.public_code}`;
    if (sessionStorage.getItem(storageKey) === "dismissed") return;

    setShowSuccessModal(true);
  }, [order?.payment_status, order?.public_code]);



  const pixPayload = useMemo(() => {
    if (!order || !settings?.pix_key) return "";
    return buildPixPayload({
      key: settings.pix_key,
      receiverName: settings.pix_receiver_name || settings.business_name || "DELI SALGADOS",
      receiverCity: settings.pix_receiver_city || "RECIFE",
      amount: Number(order.amount_due_now || 0),
      txid: order.public_code.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***",
      description: `Pedido ${order.public_code}`,
    });
  }, [order, settings]);

  const qrUrl = pixPayload
    ? `https://quickchart.io/qr?size=300&margin=2&ecLevel=M&text=${encodeURIComponent(pixPayload)}`
    : "";

  const paymentReportedWhatsappUrl = useMemo(() => {
    if (!order?.payment_reported_at || !settings?.whatsapp_number) return "";
    const phone = settings.whatsapp_number.replace(/\D/g, "");
    if (!phone) return "";
    const firstName = getFirstName(order.customer_name);
    const message = `Olá, Deli Salgados! Meu nome é ${firstName}. Já realizei o Pix do pedido ${order.public_code} no valor de ${formatCurrency(Number(order.payment_reported_amount ?? order.amount_due_now ?? 0))}. Já informei o pagamento pelo cardápio digital e aguardo a conferência. Obrigado!`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }, [order, settings]);

  async function copyPix() {
    if (!pixPayload) return;
    await navigator.clipboard.writeText(pixPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function reportPayment() {
    if (!order?.public_code) return;

    const activeToken =
      handoffToken ||
      (typeof window !== "undefined" ? sessionStorage.getItem("deli_handoff_token") : null);

    if (!activeToken) {
      setPaymentReportError("Não foi possível validar este pedido.");
      return;
    }

    setReportingPayment(true);
    setPaymentReportError(null);

    try {
      const res = await fetch(`/api/orders/${order.public_code}/payment-reported`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: activeToken }),
      });
      const data = await res.json();

      if (!res.ok || !data.order) {
        throw new Error(data.error || "Não foi possível informar o pagamento.");
      }

      setOrder(data.order);
      setShowSuccessModal(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("deli_last_order", JSON.stringify(data.order));
        sessionStorage.removeItem(`deli_final_payment_popup_${data.order.public_code}`);
      }
    } catch (err: any) {
      setPaymentReportError(err?.message || "Não foi possível informar o pagamento.");
    } finally {
      setReportingPayment(false);
    }
  }

  function markWhatsappOpened() {
    if (!order?.public_code) return;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex items-center justify-center p-4">
        <div className="bg-[#FFFDF6] rounded-3xl p-8 border border-[#EAD8C7] text-center space-y-3">
          <RefreshCw size={24} className="mx-auto animate-spin text-[#E05A36]" />
          <p className="text-xs font-bold text-[#7A6357]">Preparando pagamento...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex items-center justify-center p-4">
        <div className="bg-[#FFFDF6] rounded-3xl p-7 max-w-md w-full border border-[#EAD8C7] text-center space-y-4">
          <AlertCircle size={28} className="mx-auto text-[#C04220]" />
          <h1 className="font-display text-lg font-black text-[#3C1F15]">Pagamento indisponível</h1>
          <p className="text-xs text-[#7A6357]">{error}</p>
          <Link href="/meus-pedidos" className="block w-full py-3 rounded-2xl bg-[#3C1F15] text-white text-xs font-bold">
            IR PARA MEUS PEDIDOS
          </Link>
        </div>
      </div>
    );
  }

  const firstName = getFirstName(order.customer_name);
  const dueNow = Number(order.amount_due_now || 0);
  const balance = Number(order.balance_due || 0);
  const paymentAlreadyConfirmed =
    order.payment_status === "paid" || order.payment_status === "partially_paid";

  return (
    <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern">
      <header className="sticky top-0 z-20 bg-[#DF5F45] text-white shadow-md">
        <div className="w-full max-w-[920px] mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/pedido" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <ArrowLeft size={18} />
          </Link>
          <img src="/deli-logo-cream-official.png" alt="Deli Salgados" className="h-9 w-auto" />
          <div>
            <h1 className="font-display text-base font-bold">Pagamento do pedido</h1>
            <span className="text-[10px] text-[#FCE9D8]">#{order.public_code}</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[920px] mx-auto p-4 lg:p-8 grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <section className="bg-[#FFFDF6] rounded-3xl border border-[#EAD8C7] p-5 lg:p-6 space-y-5 shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8C7367]">Plano escolhido</span>
            <h2 className="font-display text-xl font-black text-[#3C1F15] mt-1">
              {order.payment_plan === "full" ? "Pagamento integral" : "Entrada obrigatória de 50%"}
            </h2>
            <p className="text-xs text-[#7A6357] mt-1">
              {order.payment_plan === "full"
                ? "Seu pedido ficará totalmente quitado após a confirmação do Pix."
                : "O pedido é confirmado com a entrada. O saldo restante será pago na entrega."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-white border border-[#F0E2D2] text-center">
              <div className="text-[9px] uppercase font-bold text-[#9E8679]">Total</div>
              <div className="text-sm font-black text-[#3C1F15]">{formatCurrency(order.total)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#FFF4E8] border border-[#F0D5BE] text-center">
              <div className="text-[9px] uppercase font-bold text-[#9E8679]">Pagar agora</div>
              <div className="text-sm font-black text-[#E05A36]">{formatCurrency(dueNow)}</div>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#F0E2D2] text-center">
              <div className="text-[9px] uppercase font-bold text-[#9E8679]">Saldo produtos</div>
              <div className="text-sm font-black text-[#3C1F15]">{formatCurrency(balance)}</div>
            </div>
          </div>

          {order.fulfillment_type === "delivery" && (
            <div className="p-4 rounded-3xl bg-[#FFF8EE] border border-[#F0D5BE] space-y-2">
              <div className="text-[10px] uppercase font-black tracking-wider text-[#8C7367]">
                Entrega
              </div>
              <div className="text-sm font-black text-[#3C1F15]">
                Frete não incluído neste pagamento
              </div>
              <p className="text-[11px] text-[#7A6357] leading-relaxed">
                Este Pix corresponde somente aos produtos. A Deli fará uma estimativa da entrega para o endereço informado e enviará o valor pelo WhatsApp. A contratação da entrega só acontece após sua aprovação.
              </p>
            </div>
          )}

          {paymentAlreadyConfirmed ? (
            <div className="p-5 rounded-3xl bg-[#EAF7EE] border border-[#CDEEDB] text-center space-y-2">
              <ShieldCheck size={28} className="mx-auto text-[#1FAA52]" />
              <div className="font-black text-[#1E5631]">
                {order.payment_status === "paid" ? "Pagamento confirmado" : "Entrada confirmada"}
              </div>
              <p className="text-xs text-[#52765E]">
                {firstName}, a Deli conferiu o recebimento do Pix e confirmou seu pagamento.
              </p>
            </div>
          ) : pixPayload ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#3C1F15]">
                  <QrCode size={15} className="text-[#E05A36]" />
                  Pague com Pix
                </div>
                <p className="text-[10px] text-[#7A6357] mt-1">Escaneie o QR Code ou use o Pix Copia e Cola.</p>
              </div>

              <div className="w-full max-w-[300px] aspect-square mx-auto rounded-3xl bg-white border border-[#EAD8C7] p-3 flex items-center justify-center">
                <img
                  src={qrUrl}
                  alt={`QR Code Pix do pedido ${order.public_code}`}
                  className="w-full h-full object-contain"
                />
              </div>

              <button
                type="button"
                onClick={copyPix}
                className="w-full py-3.5 rounded-2xl bg-[#3C1F15] text-white text-xs font-black flex items-center justify-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "PIX COPIADO" : "COPIAR PIX COPIA E COLA"}
              </button>

              {order.payment_reported_at ? (
                <div className="p-4 rounded-2xl bg-[#FFF4D9] border border-[#FDE0A2] text-center space-y-1.5">
                  <ShieldCheck size={22} className="mx-auto text-[#B85D19]" />
                  <div className="text-xs font-black text-[#7A4A13]">Pagamento informado</div>
                  <p className="text-[10px] text-[#8C6D1F] leading-relaxed">
                    {firstName}, recebemos seu aviso. A Deli fará a conferência do Pix no Nubank e atualizará seu pedido assim que o crédito for localizado.
                  </p>
                  {paymentReportedWhatsappUrl && (
                    <a
                      href={paymentReportedWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-[10px] font-black items-center justify-center gap-1.5"
                    >
                      <MessageCircle size={14} />
                      AVISAR TAMBÉM PELO WHATSAPP
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={reportPayment}
                    disabled={reportingPayment}
                    className="w-full py-3.5 rounded-2xl bg-[#E05A36] disabled:opacity-60 text-white text-xs font-black flex items-center justify-center gap-2"
                  >
                    <ShieldCheck size={16} />
                    {reportingPayment ? "INFORMANDO..." : "JÁ FIZ O PIX"}
                  </button>

                  <div className="p-3 rounded-2xl bg-[#FFF9E6] border border-[#EFE2C4] text-[10px] text-[#7A6357] leading-relaxed">
                    {firstName}, depois de pagar, toque em <strong>JÁ FIZ O PIX</strong>. A Deli receberá seu aviso e fará a conferência manual no Nubank. Seu pedido só será marcado como pago depois dessa conferência.
                  </div>

                  {paymentReportError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-[10px] text-rose-700">
                      {paymentReportError}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-[#FFF4E8] border border-[#F0D5BE] space-y-2">
              <AlertCircle size={22} className="text-[#B85D19]" />
              <div className="font-black text-[#3C1F15] text-sm">Pix ainda não configurado</div>
              <p className="text-xs text-[#7A6357]">
                A Deli ainda não cadastrou a chave Pix no painel. O pedido foi registrado normalmente; use o WhatsApp abaixo para combinar o pagamento.
              </p>
            </div>
          )}
        </section>

        <aside className="bg-[#FFFDF6] rounded-3xl border border-[#EAD8C7] p-5 shadow-sm space-y-4 lg:sticky lg:top-24">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8C7367]">Pedido</span>
            <div className="font-display text-xl font-black text-[#E05A36]">{order.public_code}</div>
          </div>

          <div className="space-y-2 text-xs">
            {(order.items || []).map((item) => (
              <div key={item.id} className="flex justify-between gap-3 pb-2 border-b border-[#F4E8DB]">
                <span className="text-[#614439]">
                  {item.quantity} {item.unit_label_snapshot} · {item.product_name_snapshot}
                </span>
                <strong>{formatCurrency(item.subtotal)}</strong>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-black text-sm">
            <span>Total</span>
            <span className="text-[#E05A36]">{formatCurrency(order.total)}</span>
          </div>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={markWhatsappOpened}
              className="w-full py-3.5 rounded-2xl bg-[#25D366] text-white text-xs font-black flex items-center justify-center gap-2 shadow"
            >
              <MessageCircle size={17} />
              FALAR COM A DELI
            </a>
          )}

          <Link
            href={`/pedido/enviado?code=${encodeURIComponent(order.public_code)}${handoffToken ? `&t=${encodeURIComponent(handoffToken)}` : ""}`}
            className="w-full py-3 rounded-2xl border border-[#EAD8C7] bg-white text-[#3C1F15] text-xs font-bold text-center block"
          >
            ACOMPANHAR PEDIDO
          </Link>
        </aside>
      </main>
      {showSuccessModal && (
        <PaymentSuccessModal
          firstName={firstName}
          onClose={() => {
            setShowSuccessModal(false);
            if (typeof window !== "undefined") {
              sessionStorage.setItem(
                `deli_final_payment_popup_${order.public_code}`,
                "dismissed"
              );
            }
          }}
        />
      )}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Carregando...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
