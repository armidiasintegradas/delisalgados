"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  MessageCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  ExternalLink,
  ChevronDown,
  Filter,
  Download,
  AlertCircle,
  Maximize2,
  FileText
} from "lucide-react";
import { Order, OrderStatus, PaymentStatus } from "@/types";
import { formatCurrency, buildWhatsAppLink } from "@/lib/formatters";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadRealOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
          if (data.orders.length > 0) {
            setSelectedOrder(data.orders[0]);
          }
        }
      }
    } catch (e) {
      console.error("Orders load notice:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRealOrders();
  }, []);

  const handleCopyOrderText = (order: Order) => {
    const text = [
      `SOLICITAÇÃO: ${order.public_code}`,
      `CLIENTE: ${order.customer_name}`,
      `WHATSAPP: ${order.customer_phone}`,
      `DATA: ${order.desired_date}`,
      `MODALIDADE: ${order.fulfillment_type === "pickup" ? "Retirada" : order.fulfillment_type === "delivery" ? "Entrega" : "A combinar"}`,
      order.customer_note ? `OBS: ${order.customer_note}` : null,
      `TOTAL: ${formatCurrency(order.total)}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const target = orders.find((o) => o.id === orderId);
      if (target) {
        await fetch(`/api/orders/${target.public_code}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      }
    } catch (e) {
      console.error("Error updating status:", e);
      loadRealOrders();
    }
  };

  const handlePaymentStatusChange = async (orderId: string, paymentStatus: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, payment_status: paymentStatus } : o))
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, payment_status: paymentStatus } : null));
    }

    try {
      const target = orders.find((o) => o.id === orderId);
      if (target) {
        const res = await fetch(`/api/orders/${target.public_code}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_status: paymentStatus }),
        });
        if (!res.ok) throw new Error("Falha ao atualizar pagamento");
        const data = await res.json();
        if (data.order) {
          setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
          setSelectedOrder(data.order);
        }
      }
    } catch (e) {
      console.error("Error updating payment status:", e);
      loadRealOrders();
    }
  };

  const getPaymentBadge = (status?: PaymentStatus, reportedAt?: string | null) => {
    if (status === "pending" && reportedAt) {
      return { label: "Cliente informou Pix", bg: "bg-[#FFF0CC] text-[#9A5A00] border-[#F3D083]" };
    }

    switch (status) {
      case "partially_paid":
        return { label: "Entrada paga", bg: "bg-[#E6F0FA] text-[#1E70B8] border-[#CFE2F5]" };
      case "paid":
        return { label: "Pago integral", bg: "bg-[#E5F7EB] text-[#1FAA52] border-[#C3ECD0]" };
      case "failed":
        return { label: "Falha no pagamento", bg: "bg-[#FCECE8] text-[#C04220] border-[#FAD2C5]" };
      case "refunded":
        return { label: "Estornado", bg: "bg-[#F5EBE6] text-[#7A6357] border-[#E8D9CF]" };
      default:
        return { label: "Aguardando pagamento", bg: "bg-[#FFF4D9] text-[#B85D19] border-[#FDE0A2]" };
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "generated":
        return { label: "Solicitação gerada", bg: "bg-[#FCECE8] text-[#DF5F45] border-[#FAD2C5]" };
      case "contacted":
        return { label: "Cliente contatado", bg: "bg-[#E6F0FA] text-[#1E70B8] border-[#CFE2F5]" };
      case "confirmed":
        return { label: "Confirmado pela Deli", bg: "bg-[#E5F7EB] text-[#1FAA52] border-[#C3ECD0]" };
      case "preparing":
        return { label: "Em preparação", bg: "bg-[#FFF4D9] text-[#B85D19] border-[#FDE0A2]" };
      case "completed":
        return { label: "Concluído", bg: "bg-[#E5F7EB] text-[#1FAA52] border-[#C3ECD0]" };
      case "cancelled":
        return { label: "Cancelado", bg: "bg-[#F5EBE6] text-[#7A6357] border-[#E8D9CF]" };
      default:
        return { label: "Solicitação gerada", bg: "bg-[#FCECE8] text-[#DF5F45] border-[#FAD2C5]" };
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const codeMatch = o.public_code.toLowerCase().includes(q);
      const nameMatch = o.customer_name.toLowerCase().includes(q);
      const phoneMatch = o.customer_phone.toLowerCase().includes(q);
      return codeMatch || nameMatch || phoneMatch;
    }
    return true;
  });

  const prioritizedOrders = [...filteredOrders].sort((a, b) => {
    const aReported = a.payment_status === "pending" && a.payment_reported_at ? 1 : 0;
    const bReported = b.payment_status === "pending" && b.payment_reported_at ? 1 : 0;
    if (aReported !== bReported) return bReported - aReported;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4 font-sans text-[#3C1F15]">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C7367]">
            PAINEL GESTÃO · PEDIDOS &amp; SOLICITAÇÕES
          </div>
          <h1 className="text-2xl font-display font-black text-[#3C1F15] tracking-tight">
            Gestão de Pedidos
          </h1>
          <p className="text-xs text-[#7A6357]">
            Acompanhe solicitações recebidas, atenda clientes no WhatsApp e atualize status operacionais.
          </p>
        </div>

        <button
          onClick={loadRealOrders}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white border border-[#EBDCCF] text-xs font-bold text-[#3C1F15] hover:bg-[#FAF3E8] transition shadow-2xs"
        >
          Atualizar Pedidos
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por código, cliente ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#EBDCCF] rounded-2xl pl-9 pr-3 py-2.5 text-xs text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7367]" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-[#EBDCCF] rounded-2xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
        >
          <option value="all">Todos os Status</option>
          <option value="generated">Solicitação gerada</option>
          <option value="contacted">Cliente contatado</option>
          <option value="confirmed">Confirmado pela Deli</option>
          <option value="preparing">Em preparação</option>
          <option value="completed">Concluído</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Main Content Area: Split View */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#7A6357] font-semibold bg-white rounded-3xl border border-[#F0E2D2]">
          Carregando pedidos do sistema...
        </div>
      ) : prioritizedOrders.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-white rounded-3xl border border-[#F0E2D2]">
          <div className="w-12 h-12 rounded-full bg-[#FFF4E8] text-[#DF5F45] flex items-center justify-center mx-auto">
            <FileText size={22} />
          </div>
          <h3 className="font-display font-black text-base text-[#3C1F15]">Nenhum pedido encontrado</h3>
          <p className="text-xs text-[#7A6357] max-w-sm mx-auto">
            {search || statusFilter !== "all"
              ? "Nenhum pedido corresponde aos filtros aplicados."
              : "As solicitações feitas pelos clientes através do cardápio digital aparecerão aqui em tempo real."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Order List (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            {prioritizedOrders.map((ord) => {
              const badge = getStatusBadge(ord.status);
              const isSelected = selectedOrder?.id === ord.id;
              const rawPhone = (ord.customer_phone || "").replace(/\D/g, "");
              const isValidPhone = rawPhone.length >= 10;
              const waUrl = isValidPhone
                ? `https://wa.me/${rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`}`
                : null;

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#DF5F45] shadow-sm ring-2 ring-[#DF5F45]/15"
                      : "bg-white/80 border-[#F0E2D2] hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-xs text-[#DF5F45]">
                      {ord.public_code}
                    </span>
                    <span className="text-xs font-black text-[#3C1F15]">
                      {formatCurrency(ord.total)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-bold text-xs text-[#3C1F15]">
                      {ord.customer_name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#7A6357] mt-1 flex items-center justify-between">
                    <span>{ord.desired_date} · {ord.fulfillment_type === "pickup" ? "Retirada" : "Entrega"}</span>
                    <span>{ord.items?.length || 0} {ord.items?.length === 1 ? "item" : "itens"}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPaymentBadge(ord.payment_status, ord.payment_reported_at).bg}`}>
                      {getPaymentBadge(ord.payment_status, ord.payment_reported_at).label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Detail (7 cols) */}
          {selectedOrder && (
            <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-[#F0E2D2] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#F4E8DB] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-[#DF5F45]">
                      {selectedOrder.public_code}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedOrder.status).bg}`}>
                      {getStatusBadge(selectedOrder.status).label}
                    </span>
                  </div>
                  <span className="text-xs text-[#7A6357]">
                    Criado em: {new Date(selectedOrder.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyOrderText(selectedOrder)}
                  className="px-3 py-1.5 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#3C1F15] hover:bg-[#F5ECE0] transition flex items-center gap-1.5"
                >
                  {copied ? <Check size={13} className="text-[#1FAA52]" /> : <Copy size={13} />}
                  <span>{copied ? "Copiado!" : "Copiar Dados"}</span>
                </button>
              </div>

              {/* Customer Info Card */}
              <div className="p-3.5 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] space-y-1.5 text-xs text-[#3C1F15]">
                <div className="flex justify-between">
                  <span className="text-[#7A6357]">Cliente:</span>
                  <span className="font-bold">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6357]">WhatsApp:</span>
                  <span className="font-bold">{selectedOrder.customer_phone}</span>
                </div>
                {selectedOrder.customer_email && (
                  <div className="flex justify-between">
                    <span className="text-[#7A6357]">E-mail:</span>
                    <span className="font-bold">{selectedOrder.customer_email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#7A6357]">Data de Encomenda:</span>
                  <span className="font-bold">{selectedOrder.desired_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A6357]">Modalidade:</span>
                  <span className="font-bold">
                    {selectedOrder.fulfillment_type === "pickup" ? "Retirada no Balcão" : selectedOrder.fulfillment_type === "delivery" ? "Entrega" : "A combinar"}
                  </span>
                </div>
                {selectedOrder.delivery_address && (
                  <div className="flex justify-between">
                    <span className="text-[#7A6357]">Endereço:</span>
                    <span className="font-bold max-w-xs text-right">{selectedOrder.delivery_address}</span>
                  </div>
                )}
                {selectedOrder.customer_reference_point && (
                  <div className="flex justify-between">
                    <span className="text-[#7A6357]">Referência:</span>
                    <span className="font-bold max-w-xs text-right">{selectedOrder.customer_reference_point}</span>
                  </div>
                )}
                {selectedOrder.customer_note && (
                  <div className="pt-1.5 border-t border-[#F0E2D2] text-[11px] text-[#7A6357]">
                    <span className="font-bold block text-[#3C1F15]">Observações:</span>
                    {selectedOrder.customer_note}
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="p-4 rounded-2xl bg-[#FFF8EE] border border-[#F0D5BE] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-wider text-[#8C7367]">Pagamento</div>
                    <div className="text-xs font-black text-[#3C1F15]">
                      {selectedOrder.payment_plan === "full" ? "100% no pedido" : "50% no pedido + 50% na entrega"}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getPaymentBadge(selectedOrder.payment_status, selectedOrder.payment_reported_at).bg}`}>
                    {getPaymentBadge(selectedOrder.payment_status, selectedOrder.payment_reported_at).label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white border border-[#F0E2D2]">
                    <div className="text-[9px] uppercase font-bold text-[#9E8679]">Total</div>
                    <div className="text-xs font-black">{formatCurrency(selectedOrder.total)}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#F0E2D2]">
                    <div className="text-[9px] uppercase font-bold text-[#9E8679]">Pago</div>
                    <div className="text-xs font-black text-[#1FAA52]">{formatCurrency(selectedOrder.amount_paid || 0)}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#F0E2D2]">
                    <div className="text-[9px] uppercase font-bold text-[#9E8679]">Saldo</div>
                    <div className="text-xs font-black text-[#DF5F45]">{formatCurrency(selectedOrder.balance_due ?? selectedOrder.total)}</div>
                  </div>
                </div>

                {selectedOrder.payment_status === "pending" && selectedOrder.payment_reported_at && (
                  <div className="p-3 rounded-xl bg-[#FFF0CC] border border-[#F3D083] space-y-2">
                    <div className="text-[10px] uppercase font-black tracking-wider text-[#9A5A00]">
                      Cliente informou que fez o Pix
                    </div>
                    <div className="text-[11px] text-[#7A5A22]">
                      Aviso recebido em {new Date(selectedOrder.payment_reported_at).toLocaleString("pt-BR")}
                      {selectedOrder.payment_reported_amount != null
                        ? ` · valor informado pelo sistema: ${formatCurrency(selectedOrder.payment_reported_amount)}`
                        : ""}.
                    </div>
                    <div className="text-[10px] text-[#8C6D1F]">
                      Confira a entrada no Nubank antes de confirmar.
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handlePaymentStatusChange(
                          selectedOrder.id,
                          selectedOrder.payment_plan === "full" ? "paid" : "partially_paid"
                        )
                      }
                      className="w-full py-2.5 rounded-xl bg-[#1FAA52] hover:bg-[#198B43] text-white text-[10px] font-black uppercase tracking-wide transition"
                    >
                      {selectedOrder.payment_plan === "full"
                        ? "CONFIRMEI R$ NO NUBANK — MARCAR COMO PAGO"
                        : "CONFIRMEI R$ NO NUBANK — MARCAR ENTRADA PAGA"}
                    </button>
                  </div>
                )}

                <select
                  value={selectedOrder.payment_status || "pending"}
                  onChange={(e) => handlePaymentStatusChange(selectedOrder.id, e.target.value as PaymentStatus)}
                  className="w-full bg-white border border-[#EBDCCF] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                >
                  <option value="pending">Aguardando pagamento</option>
                  <option value="partially_paid">Entrada paga</option>
                  <option value="paid">Pago integralmente</option>
                  <option value="failed">Falha no pagamento</option>
                  <option value="refunded">Estornado</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {(() => {
                  const rawPhone = (selectedOrder.customer_phone || "").replace(/\D/g, "");
                  const isValid = rawPhone.length >= 10;
                  const waUrl = isValid
                    ? `https://wa.me/${rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`}`
                    : null;

                  return waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-extrabold uppercase tracking-wide shadow-sm flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle size={16} className="fill-white stroke-none" />
                      <span>Atender no WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 py-3 px-4 rounded-xl bg-[#F5ECE0] text-[#9E8679] text-xs font-bold cursor-not-allowed text-center"
                    >
                      Telefone do Cliente Inválido
                    </button>
                  );
                })()}

                {/* Status selector */}
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                  className="bg-[#FFF8EE] border border-[#EBDCCF] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                >
                  <option value="generated">Solicitação gerada</option>
                  <option value="contacted">Cliente contatado</option>
                  <option value="confirmed">Confirmado pela Deli</option>
                  <option value="preparing">Em preparação</option>
                  <option value="completed">Concluído</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Order Items Table */}
              <div className="border-t border-[#F4E8DB] pt-3 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
                  Itens do Pedido ({selectedOrder.items?.length || 0})
                </span>

                <div className="divide-y divide-[#F7EFE6] border border-[#F0E2D2] rounded-2xl overflow-hidden">
                  {(selectedOrder.items || []).map((it, idx) => (
                    <div key={it.id || idx} className="p-3 bg-white flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-[#3C1F15]">
                          {it.product_name_snapshot}
                          {it.variant_name_snapshot && (
                            <span className="ml-1 text-[#DF5F45]">({it.variant_name_snapshot})</span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#7A6357]">
                          {it.quantity} {it.unit_label_snapshot || "un."} × {formatCurrency(it.unit_price_snapshot)}
                        </div>
                        {it.note && <div className="text-[10px] text-[#9E8679] italic">Obs: {it.note}</div>}
                      </div>

                      <div className="font-black text-[#3C1F15]">
                        {formatCurrency(it.subtotal)}
                      </div>
                    </div>
                  ))}

                  <div className="p-3 bg-[#FFFBF7] flex justify-between items-center text-sm font-black border-t border-[#F0E2D2]">
                    <span>Total Estimado</span>
                    <span className="text-base text-[#DF5F45]">
                      {formatCurrency(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
