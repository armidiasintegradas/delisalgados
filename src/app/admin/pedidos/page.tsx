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
  Maximize2
} from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { formatCurrency, buildWhatsAppLink } from "@/lib/formatters";

interface MockOrder {
  id: string;
  public_code: string;
  customer_name: string;
  customer_phone: string;
  desired_date: string;
  fulfillment_type: string;
  delivery_address?: string;
  customer_note?: string;
  items_count: number;
  total_units: number;
  total: number;
  created_time: string;
  status: OrderStatus;
  items: Array<{
    id: string;
    product_name_snapshot: string;
    variant_name_snapshot?: string;
    quantity: number;
    unit_price_snapshot: number;
    unit_label_snapshot: string;
    subtotal: number;
    option_note?: string;
  }>;
}

const INITIAL_ORDERS: MockOrder[] = [
  {
    id: "ord-42",
    public_code: "#DL-0042",
    customer_name: "Maria Clara",
    customer_phone: "(81) 98765-4321",
    desired_date: "24/09/2026",
    fulfillment_type: "Retirada Balcão",
    items_count: 3,
    total_units: 300,
    total: 565.0,
    created_time: "Hoje às 14:15",
    status: "generated",
    customer_note:
      'Peço a informação de separação para a Deli Grand Cru em duas caixas bem lacradas para o transporte. Retiro pontualmente às 11:30h.',
    items: [
      {
        id: "it-1",
        product_name_snapshot: "Coxinha de Frango com Catupiry",
        quantity: 100,
        unit_price_snapshot: 1.7,
        unit_label_snapshot: "unidades",
        subtotal: 170.0,
        option_note: "Opção: Pronta-entrega para retirada",
      },
      {
        id: "it-2",
        product_name_snapshot: "Bolinho de Queijo Especial",
        quantity: 100,
        unit_price_snapshot: 2.0,
        unit_label_snapshot: "unidades",
        subtotal: 200.0,
        option_note: "Opção: Congelado em embalagem térmica",
      },
      {
        id: "it-3",
        product_name_snapshot: "Camarão Empanado",
        variant_name_snapshot: "Frito Pronto",
        quantity: 1,
        unit_price_snapshot: 195.0,
        unit_label_snapshot: "kg",
        subtotal: 195.0,
        option_note: 'Observação: "Massa bem sequinha, por favor!"',
      },
    ],
  },
  {
    id: "ord-41",
    public_code: "#DL-0041",
    customer_name: "Carlos Henrique",
    customer_phone: "(81) 99123-0011",
    desired_date: "Hoje (às 18h)",
    fulfillment_type: "Entrega Expressa",
    delivery_address: "Av. Boa Viagem, 2400 - Ap 801",
    items_count: 2,
    total_units: 150,
    total: 328.0,
    created_time: "Hoje às 12:42",
    status: "contacted",
    items: [
      {
        id: "it-4",
        product_name_snapshot: "Empadinha de Camarão",
        quantity: 100,
        unit_price_snapshot: 2.0,
        unit_label_snapshot: "unidades",
        subtotal: 200.0,
      },
      {
        id: "it-5",
        product_name_snapshot: "Mini Quiche Lorraine",
        quantity: 50,
        unit_price_snapshot: 2.56,
        unit_label_snapshot: "unidades",
        subtotal: 128.0,
      },
    ],
  },
  {
    id: "ord-40",
    public_code: "#DL-0040",
    customer_name: "Juliana Santos",
    customer_phone: "(81) 98844-1122",
    desired_date: "22/09/2026",
    fulfillment_type: "Retirada Balcão",
    items_count: 2,
    total_units: 200,
    total: 368.0,
    created_time: "Hoje às 11:05",
    status: "confirmed",
    items: [
      {
        id: "it-6",
        product_name_snapshot: "Pastelzinho de Festa Carne",
        quantity: 100,
        unit_price_snapshot: 1.84,
        unit_label_snapshot: "unidades",
        subtotal: 184.0,
      },
      {
        id: "it-7",
        product_name_snapshot: "Trouxinha de Frango com Queijo",
        quantity: 100,
        unit_price_snapshot: 1.84,
        unit_label_snapshot: "unidades",
        subtotal: 184.0,
      },
    ],
  },
  {
    id: "ord-39",
    public_code: "#DL-0039",
    customer_name: "Roberto Alcantara",
    customer_phone: "(81) 98210-9944",
    desired_date: "Hoje (às 16h)",
    fulfillment_type: "Retirada Balcão",
    items_count: 1,
    total_units: 100,
    total: 165.0,
    created_time: "Ontem às 19:10",
    status: "preparing",
    items: [
      {
        id: "it-8",
        product_name_snapshot: "Risoles de Carne",
        quantity: 100,
        unit_price_snapshot: 1.65,
        unit_label_snapshot: "unidades",
        subtotal: 165.0,
      },
    ],
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<MockOrder[]>(INITIAL_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<MockOrder>(INITIAL_ORDERS[0]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadRealOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.orders && data.orders.length > 0) {
          const adapted = data.orders.map((o: any) => ({
            id: o.id,
            public_code: o.public_code.startsWith("#") ? o.public_code : `#${o.public_code}`,
            customer_name: o.customer_name,
            customer_phone: o.customer_phone,
            desired_date: o.desired_date,
            fulfillment_type: o.fulfillment_type === "pickup" ? "Retirada Balcão" : "Entrega Expressa",
            customer_note: o.customer_note,
            items_count: o.items?.length || 1,
            total_units: o.items?.reduce((acc: number, it: any) => acc + (it.quantity || 0), 0) || 100,
            total: Number(o.total) || 0,
            created_time: "Recente",
            status: o.status,
            items: o.items || [],
          }));
          // Put Stitch canonical orders first, then append real orders
          const combined = [...INITIAL_ORDERS, ...adapted];
          setOrders(combined);
          setSelectedOrder(INITIAL_ORDERS[0]);
        }
      } catch (e) {
        console.error("Orders load notice:", e);
      }
    }
    loadRealOrders();
  }, []);

  const handleCopyOrderText = (order: MockOrder) => {
    const text = [
      `SOLICITAÇÃO: ${order.public_code}`,
      `CLIENTE: ${order.customer_name}`,
      `WHATSAPP: ${order.customer_phone}`,
      `DATA: ${order.desired_date}`,
      `MODALIDADE: ${order.fulfillment_type}`,
      order.customer_note ? `OBS: ${order.customer_note}` : null,
      `TOTAL: ${formatCurrency(order.total)}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "generated":
        return { label: "Solicitação gerada", bg: "bg-[#FBECE8] text-[#DF5F45]" };
      case "contacted":
        return { label: "Cliente Contactado", bg: "bg-[#E6F0FA] text-[#1E70B8]" };
      case "confirmed":
        return { label: "Confirmado para Prod.", bg: "bg-[#E5F7EB] text-[#1FAA52]" };
      case "preparing":
        return { label: "Em Preparação", bg: "bg-[#FBECE8] text-[#C04220]" };
      case "completed":
        return { label: "Concluído", bg: "bg-[#E5F7EB] text-[#1FAA52]" };
      default:
        return { label: "Pendente", bg: "bg-gray-100 text-gray-600" };
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#3C1F15]">
      {/* Copied Toast */}
      {copied && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2E7D47] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} />
          <span>Resumo do pedido copiado!</span>
        </div>
      )}

      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C7367]">
            FLUXO COMERCIAL &gt; SINCRONIZAÇÃO WHATSAPP BUSINESS
          </div>
          <h1 className="text-2xl font-serif italic font-black text-[#3C1F15] tracking-tight mt-0.5">
            Solicitações de Pedidos (WhatsApp)
          </h1>
          <p className="text-xs text-[#7A6357] mt-1 max-w-xl leading-relaxed">
            Acompanhe os pedidos gerados pelos clientes pelo cardápio online. Faça o processamento e o envio nativo diretamente via WhatsApp.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#F0E2D2] shadow-2xs">
            <div className="w-6 h-6 rounded-lg bg-[#FAF3E8] flex items-center justify-center text-[#DF5F45] text-xs">
              📋
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C7367] block">
                TOTAL
              </span>
              <span className="text-xs font-black text-[#3C1F15]">18 Pedidos</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-[#F0E2D2] shadow-2xs">
            <div className="w-6 h-6 rounded-lg bg-[#E5F7EB] flex items-center justify-center text-[#1FAA52] text-xs">
              💰
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C7367] block">
                VOLUME ESTIMADO
              </span>
              <span className="text-xs font-black text-[#1FAA52]">R$ 5.928,00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Chips Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-full font-bold transition whitespace-nowrap ${
            statusFilter === "all"
              ? "bg-[#52291D] text-white shadow-2xs"
              : "bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8]"
          }`}
        >
          Todos (18)
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("generated")}
          className="px-3 py-1.5 rounded-full bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8] font-bold transition whitespace-nowrap flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-[#DF5F45]" />
          <span>Solicitação Gerada (4)</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("contacted")}
          className="px-3 py-1.5 rounded-full bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8] font-bold transition whitespace-nowrap flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-[#1E70B8]" />
          <span>Cliente Contactado (3)</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("confirmed")}
          className="px-3 py-1.5 rounded-full bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8] font-bold transition whitespace-nowrap flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-[#1FAA52]" />
          <span>Confirmado para Prod. (5)</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("preparing")}
          className="px-3 py-1.5 rounded-full bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8] font-bold transition whitespace-nowrap flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-[#C04220]" />
          <span>Em Preparação (4)</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className="px-3 py-1.5 rounded-full bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8] font-bold transition whitespace-nowrap flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-[#1FAA52]" />
          <span>Concluído (2)</span>
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7.5 cols): Orders Table */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search & Action Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, telefone ou código..."
                className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl pl-8 pr-3 py-2 text-xs text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C7367]" />
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] transition"
            >
              <Filter size={13} />
              <span>Filtrar</span>
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] transition"
            >
              <Download size={13} />
              <span>Exportar</span>
            </button>
          </div>

          {/* Orders List Container */}
          <div className="bg-white rounded-3xl border border-[#F0E2D2] shadow-2xs overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-4 py-3 bg-[#FAF3E8] border-b border-[#EEDFCE] text-[10px] font-bold uppercase tracking-wider text-[#8C7367]">
              <div className="col-span-3">REF / CLIENTE</div>
              <div className="col-span-3">PARA / ENTREGA</div>
              <div className="col-span-2">VOLUME</div>
              <div className="col-span-2">TOTAL</div>
              <div className="col-span-2 text-center">STATUS</div>
            </div>

            {/* Orders Rows */}
            <div className="divide-y divide-[#F6ECE2]">
              {orders.slice(0, 4).map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                const badge = getStatusBadge(ord.status);
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`grid grid-cols-12 items-center px-4 py-3.5 cursor-pointer transition ${
                      isSelected
                        ? "bg-[#FFFBF7] border-l-4 border-l-[#DF5F45]"
                        : "hover:bg-[#FFFCF8]"
                    }`}
                  >
                    {/* Ref & Customer */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-[#DF5F45]">
                          {ord.public_code}
                        </span>
                        {ord.public_code === "#DL-0042" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DF5F45]" />
                        )}
                      </div>
                      <div className="font-bold text-xs text-[#3C1F15] mt-0.5">
                        {ord.customer_name}
                      </div>
                      <div className="text-[10px] text-[#9E8679] font-mono">
                        {ord.customer_phone}
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="col-span-3">
                      <div className="text-xs font-bold text-[#3C1F15]">
                        {ord.desired_date}
                      </div>
                      <div className="text-[10px] text-[#8C7367] flex items-center gap-1 mt-0.5">
                        <span>📦</span>
                        <span>{ord.fulfillment_type}</span>
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="col-span-2">
                      <div className="text-xs font-bold text-[#3C1F15]">
                        {ord.items_count} itens
                      </div>
                      <div className="text-[10px] text-[#9E8679]">
                        {ord.total_units} salgados
                      </div>
                    </div>

                    {/* Total */}
                    <div className="col-span-2">
                      <div className="text-xs font-black text-[#3C1F15]">
                        {formatCurrency(ord.total)}
                      </div>
                      <div className="text-[10px] text-[#9E8679]">
                        {ord.created_time}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="col-span-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Row */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#FAF3E8] border-t border-[#EEDFCE] text-xs text-[#7A6357]">
              <span>Mostrando 4 de 18 pedidos registrados</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-6 h-6 rounded-lg bg-white border border-[#EBDCCF] flex items-center justify-center text-xs font-bold hover:bg-[#FAF3E8]"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  className="w-6 h-6 rounded-lg bg-[#52291D] text-white flex items-center justify-center text-xs font-bold"
                >
                  1
                </button>
                <button
                  type="button"
                  className="w-6 h-6 rounded-lg bg-white border border-[#EBDCCF] flex items-center justify-center text-xs font-bold hover:bg-[#FAF3E8]"
                >
                  2
                </button>
                <button
                  type="button"
                  className="w-6 h-6 rounded-lg bg-white border border-[#EBDCCF] flex items-center justify-center text-xs font-bold hover:bg-[#FAF3E8]"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Snapshot Note */}
          <div className="p-3.5 rounded-2xl bg-[#FFF8EE] border border-[#F0E2D2] flex items-start gap-2.5 text-[11px] text-[#7A6357] leading-relaxed">
            <span className="text-base text-[#DF5F45] leading-none shrink-0 font-serif">*</span>
            <p>
              <span className="font-bold text-[#3C1F15]">Arquivamento de Snapshot Operacional:</span> Cada registro salva o valor unitário e histórico exato da ocasião em que o cliente clicou em "Enviar Pedido". Reajustes do cardápio nunca corrompem pedidos em aberto.
            </p>
          </div>
        </div>

        {/* Right Column (4.5 cols): Order Detail Drawer */}
        <div className="lg:col-span-5 bg-white p-4 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-2.5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#F4E8DB]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF3E8] text-[#8C7367] flex items-center justify-center text-xs">
                📋
              </span>
              <span className="text-[11px] font-bold text-[#8C7367]">
                Pedido #42 - Agendamento
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#FCECE8] text-[#DF5F45] text-[9px] font-bold">
                WhatsApp Aberto
              </span>
              <button
                type="button"
                className="p-0.5 rounded text-[#8C7367] hover:text-[#3C1F15]"
              >
                <Maximize2 size={12} />
              </button>
            </div>
          </div>

          {/* Order Title */}
          <div>
            <h2 className="text-lg font-serif italic font-black text-[#3C1F15]">
              Solicitação {selectedOrder.public_code}
            </h2>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#DF5F45]">
              {selectedOrder.customer_name}
            </div>
          </div>

          {/* 2 Cards: Data Desejada + Modalidade */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF]">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#8C7367] block">
                DATA DESEJADA
              </span>
              <span className="text-xs font-bold text-[#3C1F15] mt-0.5 block">
                {selectedOrder.desired_date}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF]">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#8C7367] block">
                MODALIDADE
              </span>
              <span className="text-xs font-bold text-[#3C1F15] mt-0.5 block">
                {selectedOrder.fulfillment_type}
              </span>
            </div>
          </div>

          {/* Snapshot Imutável Alert */}
          <div className="p-2 rounded-xl bg-[#FFFBF7] border border-[#F4E8DB] flex items-start gap-1.5 text-[9px] text-[#7A6357] leading-tight">
            <span className="text-[10px] text-[#DF5F45] shrink-0 leading-none">ℹ</span>
            <p>
              <span className="font-bold text-[#3C1F15]">Snapshot Imutável:</span> Os itens e descrições fixados no momento da solicitação. Alterações futuras no catálogo não afetam este histórico.
            </p>
          </div>

          {/* Requested Items List */}
          <div className="space-y-1.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#8C7367] pb-1 border-b border-[#F4E8DB]">
              ITENS SOLICITADOS ({selectedOrder.items.length} ITENS)
            </div>

            <div className="space-y-1.5 divide-y divide-[#F6ECE2]">
              {selectedOrder.items.map((it) => (
                <div key={it.id} className="pt-1.5 first:pt-0 space-y-0.2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#3C1F15]">
                      {it.product_name_snapshot}
                      {it.variant_name_snapshot ? ` (${it.variant_name_snapshot})` : ""}
                    </span>
                    <span className="text-[11px] font-black text-[#3C1F15]">
                      {formatCurrency(it.subtotal)}
                    </span>
                  </div>
                  <div className="text-[9px] text-[#7A6357]">
                    {it.quantity} {it.unit_label_snapshot} x {formatCurrency(it.unit_price_snapshot)} / un
                  </div>
                  {it.option_note && (
                    <div className="text-[9px] text-[#1FAA52] font-semibold">
                      {it.option_note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Customer Note Box */}
          {selectedOrder.customer_note && (
            <div className="p-2 rounded-xl bg-[#FFF8EE] border border-[#F0E2D2] space-y-0.5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#8C7367] block">
                OBSERVAÇÃO ENVIADA PELO CLIENTE:
              </span>
              <p className="text-[10px] text-[#3C1F15] italic leading-tight">
                "{selectedOrder.customer_note}"
              </p>
            </div>
          )}

          {/* Financial Summary */}
          <div className="p-2 rounded-xl bg-[#FFFBF7] border border-[#F4E8DB] space-y-1 text-[11px]">
            <div className="flex justify-between text-[#7A6357]">
              <span>Subtotal dos Salgados (27 kg):</span>
              <span className="font-bold text-[#3C1F15]">{formatCurrency(selectedOrder.total)}</span>
            </div>
            <div className="flex justify-between text-[#7A6357]">
              <span>Taxa de Embalagem Térmica Especial:</span>
              <span className="font-bold text-[#1FAA52]">Cortesia</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#F0E2D2] text-xs font-black text-[#3C1F15]">
              <span>Total Estimado:</span>
              <span className="text-[#DF5F45]">{formatCurrency(selectedOrder.total)}</span>
            </div>
          </div>

          {/* Status Selection & Actions */}
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-[11px]">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C7367]">
                STATUS:
              </span>
              <span className="font-bold text-[#DF5F45] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DF5F45]" />
                <span>Solicitação Gerada</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={buildWhatsAppLink(selectedOrder.customer_phone, `Olá ${selectedOrder.customer_name}, referente ao seu pedido ${selectedOrder.public_code} na Deli Salgados:`)}
                target="_blank"
                rel="noreferrer"
                className="py-2 rounded-xl bg-[#2E7D47] hover:bg-[#256639] text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs text-center"
              >
                <MessageCircle size={13} />
                <span>Abrir Chat</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopyOrderText(selectedOrder)}
                className="py-2 rounded-xl bg-[#52291D] hover:bg-[#3D1E15] text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs text-center"
              >
                <Copy size={12} />
                <span>Copiar Resumo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
