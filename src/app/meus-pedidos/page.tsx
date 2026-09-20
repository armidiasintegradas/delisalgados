"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, ClipboardList, Clock, CheckCircle2 } from "lucide-react";
import { BottomNav } from "@/components/public/BottomNav";
import { CustomerGreeting } from "@/components/public/CustomerGreeting";
import { Order } from "@/types";
import { formatCurrency, getFirstName } from "@/lib/formatters";

export default function MeusPedidosPage() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accountOrders, setAccountOrders] = useState<any[]>([]);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountAuthenticated, setAccountAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/customer/orders", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          setAccountAuthenticated(false);
          return { orders: [] };
        }
        const data = await res.json();
        setAccountAuthenticated(true);
        return data;
      })
      .then((data) => setAccountOrders(data.orders || []))
      .catch(() => setAccountAuthenticated(false))
      .finally(() => setAccountLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !phone.trim()) {
      setErrorMessage("Por favor, preencha o código do pedido e o número de WhatsApp.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSearchedOrder(null);

    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setSearchedOrder(data.order);
      } else {
        setErrorMessage(data.error || "Não localizamos um pedido com esses dados.");
      }
    } catch {
      setErrorMessage("Não localizamos um pedido com esses dados.");
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    generated: "Solicitação gerada",
    contacted: "Cliente contatado",
    confirmed: "Confirmado pela Deli",
    preparing: "Em preparação",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  const getCustomerStatusClasses = (status?: string) => {
    if (status === "confirmed" || status === "preparing" || status === "completed") {
      return "bg-[#EAF7EE] text-[#1E7A45] border border-[#BFE7CC]";
    }
    if (status === "cancelled") {
      return "bg-[#FFF0EE] text-[#B5412A] border border-[#F2C5BC]";
    }
    return "bg-[#FFF4E8] text-[#8C5237] border border-[#F0D5BE]";
  };

  return (
    <div className="w-full max-w-[440px] lg:max-w-none mx-auto min-h-screen bg-[#FFFDF9] shadow-2xl lg:shadow-none flex flex-col pb-24 lg:pb-16 relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-b from-[#E25C37] via-[#DF532E] to-[#D5451F] text-white shadow-md">
        <div className="w-full max-w-[1000px] mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <img
              src="/deli-logo-cream-official.png"
              alt="Deli Salgados"
              className="h-9 w-auto object-contain select-none"
            />
            <div>
              <h1 className="text-base lg:text-lg font-bold leading-tight">Consultar Pedido</h1>
              <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
                Acompanhe o status com segurança
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="hidden lg:inline-flex px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
          >
            Voltar ao Cardápio
          </Link>
        </div>
      </header>

      <main className="w-full max-w-[440px] lg:max-w-[720px] mx-auto p-4 lg:p-8 space-y-4 flex-1">
        {!accountLoading && accountAuthenticated && <CustomerGreeting />}
        {!accountLoading && accountAuthenticated && (
          <div className="bg-white p-5 rounded-3xl border border-[#EBDCCF] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#3C1F15]">
                  Histórico de pedidos
                </h2>
                <p className="text-[11px] text-[#7A6357]">
                  {accountOrders.length > 0
                    ? "Aqui estão os pedidos vinculados ao seu e-mail de acesso."
                    : "Pedidos vinculados ao seu e-mail de acesso."}
                </p>
              </div>
              <Link href="/" className="px-3 py-2 rounded-xl bg-[#3C1F15] text-white text-[10px] font-bold">
                NOVO PEDIDO
              </Link>
            </div>

            {accountOrders.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#FFF9E6] text-xs text-[#7A6357]">
                Você ainda não possui pedidos vinculados a esta conta.
              </div>
            ) : (
              <div className="space-y-3">
                {accountOrders.map((order) => (
                  <div key={order.id} className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#EFE2D5] space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-base font-black text-[#E05A36]">{order.public_code}</div>
                        <div className="text-[10px] text-[#8C7367]">{new Date(order.created_at).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getCustomerStatusClasses(order.status)}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#614439]">
                      {(order.items || []).map((item: any) => (
                        <div key={item.id} className="flex justify-between gap-3 py-0.5">
                          <span>{item.quantity} {item.unit_label_snapshot} — {item.product_name_snapshot}</span>
                          <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-[#F0E2D4] space-y-1 text-xs">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-[#E05A36]">{formatCurrency(order.total)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#7A6357]">
                        <span>{order.payment_plan === "full" ? "Pagamento integral" : "Entrada de 50%"}</span>
                        <strong>{formatCurrency(order.amount_due_now ?? order.total)}</strong>
                      </div>
                      <div className="flex justify-between text-[10px] text-[#7A6357]">
                        <span>Saldo na entrega</span>
                        <strong>{formatCurrency(order.balance_due ?? 0)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!accountLoading && !accountAuthenticated && (
          <div className="bg-[#FFF4E8] border border-[#F0D5BE] rounded-3xl p-4 text-xs text-[#7A4B36]">
            Para ver todo o seu histórico automaticamente, <Link href="/perfil" className="font-black underline">acesse sua conta</Link> com o e-mail usado no pedido.
          </div>
        )}

        {/* Search input */}
        <form onSubmit={handleSearch} className="bg-white p-5 rounded-3xl border border-[#EBDCCF] shadow-xs space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#3C1F15] block">
              Código do Pedido
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: DL-0001"
              className="w-full bg-[#FFFBF7] border border-[#EBDCCF] rounded-2xl px-4 py-3 text-sm uppercase text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#3C1F15] block">
              WhatsApp informado no pedido
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: (81) 98765-4321"
              className="w-full bg-[#FFFBF7] border border-[#EBDCCF] rounded-2xl px-4 py-3 text-sm text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#3C1F15] text-white font-bold text-xs shadow-lg hover:bg-[#27120A] transition shrink-0 cursor-pointer"
          >
            {loading ? "Consultando..." : "Consultar Status do Pedido"}
          </button>
        </form>

        {errorMessage && (
          <div className="p-4 bg-white rounded-2xl border border-[#F0DCBE] text-center">
            <p className="text-xs text-[#7A6357]">
              {errorMessage}
            </p>
          </div>
        )}

        {searchedOrder && (
          <div className="bg-white p-5 rounded-3xl border border-[#EBDCCF] shadow-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#F4E8DB] pb-3">
              <div>
                <span className="text-xs text-[#8C7367]">Código:</span>
                <div className="text-lg font-black text-[#E05A36]">
                  {searchedOrder.public_code}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCustomerStatusClasses(searchedOrder.status)}`}>
                {statusLabels[searchedOrder.status] || searchedOrder.status}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFF4E8] text-xs font-bold text-[#7A4B36]">
              Olá, {getFirstName(searchedOrder.customer_name)}! Aqui estão os dados do seu pedido.
            </div>

            <div className="space-y-1.5 text-xs text-[#614439]">
              <div><strong>Data desejada:</strong> {searchedOrder.desired_date}</div>
              <div><strong>Modalidade:</strong> {searchedOrder.fulfillment_type === "pickup" ? "Retirada no balcão" : "Entrega"}</div>
              <div><strong>Total:</strong> {formatCurrency(searchedOrder.total)}</div>
            </div>

            <div className="border-t border-[#F4E8DB] pt-3">
              <span className="text-[11px] font-bold text-[#8C5237] uppercase block mb-1.5">
                Itens:
              </span>
              <div className="space-y-1">
                {(searchedOrder.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="text-xs flex justify-between text-[#3C1F15]">
                    <span>
                      {item.quantity} {item.unit_label} — {item.product_name} {item.variant_name ? `(${item.variant_name})` : ""}
                    </span>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

