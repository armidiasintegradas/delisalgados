"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Plus,
  Volume2,
  ArrowRight,
  MessageCircle,
  FileText,
  Bell,
  ChevronRight,
} from "lucide-react";
import { Product, Order, Availability } from "@/types";
import { formatCurrency } from "@/lib/formatters";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState({
    availableProducts: 0,
    unavailableProducts: 0,
    hiddenProducts: 0,
    todayOrders: 0,
    totalOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [quickProducts, setQuickProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboardData() {
    try {
      const [dashRes, prodsRes] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/products"),
      ]);
      const dashData = await dashRes.json();
      const prodsData = await prodsRes.json();

      if (dashData.metrics) {
        setMetrics({
          availableProducts: dashData.metrics.availableProducts ?? 0,
          unavailableProducts: dashData.metrics.unavailableProducts ?? 0,
          hiddenProducts: dashData.metrics.hiddenProducts ?? 0,
          todayOrders: dashData.metrics.todayOrders ?? 0,
          totalOrders: dashData.metrics.totalOrders ?? 0,
        });
        if (dashData.metrics.recentOrders && dashData.metrics.recentOrders.length > 0) {
          setRecentOrders(dashData.metrics.recentOrders);
        }
      }

      if (prodsData.products && prodsData.products.length > 0) {
        setQuickProducts(prodsData.products.slice(0, 6));
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleAvailabilityChange = async (productId: string, newAvailability: Availability) => {
    // Optimistic update
    setQuickProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, availability: newAvailability } : p))
    );
    try {
      await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          action: "updateAvailability",
          availability: newAvailability,
        }),
      });
    } catch (e) {
      console.error("Error toggling availability:", e);
      loadDashboardData();
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#8C7367]">
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#DF5F45]">
            Painel Gestão
          </span>
          <span>·</span>
          <span>Visão Operacional</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDashboardData()}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#EBDCCF] text-[#3C1F15] hover:bg-[#FAF3E8] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw size={13} className="text-[#DF5F45]" />
            <span>Atualizar Preços</span>
          </button>
          <Link
            href="/"
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-[#FDEAE4] border border-[#FAD2C5] text-[#DF5F45] hover:bg-[#FADBD0] text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>Ver Cardápio Online</span>
            <ExternalLink size={13} />
          </Link>
          <Link
            href="/delisalgados/admin/produtos/novo"
            className="px-3 py-1.5 rounded-xl bg-[#3C1F15] text-white hover:bg-[#27120A] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {/* Greeting Title */}
      <div>
        <h1 className="text-2xl font-display font-black text-[#3C1F15] tracking-tight">
          Bom dia, Deli!
        </h1>
        <p className="text-xs text-[#7A6357] mt-0.5 max-w-2xl leading-relaxed">
          Aqui você acompanha os destaques do cardápio e a operação de hoje. Ajuste a disponibilidade dos itens com um clique e prepare sua produção com tranquilidade.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Itens Ativos */}
        <div className="bg-[#F2F8F4] p-3.5 rounded-2xl border border-[#D5EADB] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#1FAA52]">
              Itens Ativos
            </span>
            <div className="w-5 h-5 rounded-full bg-[#E0F2E6] flex items-center justify-center text-[#1FAA52]">
              <CheckCircle2 size={13} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1FAA52] my-1">
            {metrics.availableProducts}
          </div>
          <div className="text-[10px] text-[#2E7D47] font-medium bg-[#E3F4E9] px-2 py-0.5 rounded-md">
            Pronta-entrega e sob encomenda
          </div>
        </div>

        {/* Card 2: Pausados / Esgotados */}
        <div className="bg-[#FFF4F2] p-3.5 rounded-2xl border border-[#FBD6CF] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#DF5F45]">
              Pausados / Esgotados
            </span>
            <div className="w-5 h-5 rounded-full bg-[#FCE6E2] flex items-center justify-center text-[#DF5F45]">
              <AlertCircle size={13} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#DF5F45] my-1">
            {metrics.unavailableProducts}
          </div>
          <div className="text-[10px] text-[#C04220] font-medium bg-[#FCE8E4] px-2 py-0.5 rounded-md">
            Itens indisponíveis no catálogo
          </div>
        </div>

        {/* Card 3: Produtos com Variação */}
        <div className="bg-[#FFFBF2] p-3.5 rounded-2xl border border-[#F8E7C5] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B8860B]">
              Total de Pedidos
            </span>
            <div className="w-5 h-5 rounded-full bg-[#FDF0D5] flex items-center justify-center text-[#B8860B]">
              <Layers size={13} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#3C1F15] my-1">
            {metrics.totalOrders}
          </div>
          <div className="text-[10px] text-[#8C6D1F] font-medium bg-[#FAF2D8] px-2 py-0.5 rounded-md">
            Histórico registrado no sistema
          </div>
        </div>

        {/* Card 4: Solicitações Hoje (Solid Coral) */}
        <div className="bg-[#DF5F45] text-white p-3.5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-white/90">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Solicitações Hoje
            </span>
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
              <ShoppingBag size={13} />
            </div>
          </div>
          <div className="my-1">
            <div className="text-2xl font-black">
              {metrics.todayOrders}{" "}
              <span className="text-xs font-semibold opacity-90">pedidos</span>
            </div>
          </div>
          <div className="text-[10px] font-bold text-white/95 bg-black/15 px-2 py-0.5 rounded-md">
            Solicitações geradas pelo cardápio
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-white rounded-2xl p-2.5 px-4 border border-[#F0E2D2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#3C1F15] text-white flex items-center justify-center shrink-0">
            <Volume2 size={14} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#3C1F15]">
                Aviso ativo no cardápio público
              </span>
              <span className="px-2 py-0.2 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[9px] font-bold">
                ● Em Exibição
              </span>
            </div>
            <p className="text-xs text-[#7A6357]">
              Recomendação para o fim de semana: encomendas com 48h de antecedência.
            </p>
          </div>
        </div>
        <Link
          href="/delisalgados/admin/cardapio"
          className="px-2.5 py-1 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#3C1F15] hover:bg-[#F5ECE0] transition shrink-0"
        >
          Editar Aviso
        </Link>
      </div>

      {/* Main Two Columns: Disponibilidade & Últimos Pedidos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Disponibilidade de Hoje (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-[#F0E2D2] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-[#F4E8DB]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#DF5F45] text-sm">⚡</span>
                  <h2 className="text-sm font-bold text-[#3C1F15]">
                    Disponibilidade de Hoje
                  </h2>
                </div>
                <p className="text-[11px] text-[#7A6357] mt-0.5">
                  Controle rápido de 6 itens para edição imediata no cardápio público.
                </p>
              </div>
              <span className="px-2 py-1 rounded-full bg-[#FFF4E8] text-[#DF5F45] text-[10px] font-bold shrink-0">
                Edição Rápida
              </span>
            </div>

            {/* Product items list */}
            <div className="divide-y divide-[#F7EFE6] mt-1">
              {quickProducts.map((item) => {
                const thumb = item.image_url || "/deli-avatar-official.png";

                return (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] border border-[#F0E2D2] overflow-hidden shrink-0 relative flex items-center justify-center p-1">
                        <img
                          src={thumb}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#3C1F15] truncate">
                            {item.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-[#FFF4E8] text-[#8C5237] text-[9px] font-semibold">
                            {item.category?.name || "Salgados"}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-[#9E8679] truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleAvailabilityChange(item.id, "available")}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          item.availability === "available"
                            ? "bg-[#1FAA52] text-white shadow-2xs"
                            : "bg-[#F5F2EB] text-[#7A6357] hover:bg-[#EBDCCF]"
                        }`}
                      >
                        Disponível
                      </button>
                      <button
                        onClick={() => handleAvailabilityChange(item.id, "unavailable")}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          item.availability === "unavailable"
                            ? "bg-[#C04220] text-white shadow-2xs"
                            : "bg-[#F5F2EB] text-[#7A6357] hover:bg-[#EBDCCF]"
                        }`}
                      >
                        Esgotado
                      </button>
                      <button
                        onClick={() => handleAvailabilityChange(item.id, "on_request")}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          item.availability === "on_request"
                            ? "bg-[#4A3228] text-white shadow-2xs"
                            : "bg-[#F5F2EB] text-[#7A6357] hover:bg-[#EBDCCF]"
                        }`}
                      >
                        Sob Consulta
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F4E8DB] mt-3">
            <Link
              href="/delisalgados/admin/produtos"
              className="text-xs font-bold text-[#DF5F45] hover:underline flex items-center gap-1"
            >
              <span>Ver todos os produtos do cardápio</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right Column: Últimas Solicitações (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-[#F0E2D2] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="text-[#1FAA52] text-sm">📋</span>
                <h2 className="text-sm font-bold text-[#3C1F15]">
                  Últimas Solicitações
                </h2>
              </div>
              <p className="text-[11px] text-[#7A6357] mt-0.5">
                Pedidos criados pelo cardápio digital e encaminhados para atendimento.
              </p>
            </div>

            {/* Orders list */}
            <div className="space-y-3 mt-3">
              {recentOrders.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] text-center space-y-1">
                  <p className="text-xs font-bold text-[#3C1F15]">Nenhum pedido recente</p>
                  <p className="text-[11px] text-[#7A6357]">
                    Novos pedidos enviados pelos clientes através do cardápio público aparecerão aqui.
                  </p>
                </div>
              ) : (
                recentOrders.slice(0, 3).map((order, idx) => {
                  const statusInfo = (() => {
                    switch (order.status) {
                      case "generated":
                        return { label: "Solicitação gerada", bg: "bg-[#FBECE8] text-[#DF5F45]" };
                      case "contacted":
                        return { label: "Cliente contatado", bg: "bg-[#E6F0FA] text-[#1E70B8]" };
                      case "confirmed":
                        return { label: "Confirmado pela Deli", bg: "bg-[#E5F7EB] text-[#1FAA52]" };
                      case "preparing":
                        return { label: "Em preparação", bg: "bg-[#FFF4D9] text-[#B85D19]" };
                      case "completed":
                        return { label: "Concluído", bg: "bg-[#E5F7EB] text-[#1FAA52]" };
                      case "cancelled":
                        return { label: "Cancelado", bg: "bg-[#F5EBE6] text-[#7A6357]" };
                      default:
                        return { label: "Solicitação gerada", bg: "bg-[#FBECE8] text-[#DF5F45]" };
                    }
                  })();

                  const fulfillmentLabel =
                    order.fulfillment_type === "delivery"
                      ? "Entrega"
                      : order.fulfillment_type === "to_agree"
                      ? "A combinar"
                      : "Retirada Balcão";

                  const itemsDesc =
                    order.items && order.items.length > 0
                      ? `${order.items.length} ${order.items.length === 1 ? "item" : "itens"}: ${order.items
                          .map((i) => i.product_name_snapshot)
                          .slice(0, 3)
                          .join(", ")}`
                      : fulfillmentLabel;

                  const rawPhone = (order.customer_phone || "").replace(/\D/g, "");
                  const isValidPhone = rawPhone.length >= 10;
                  const waUrl = isValidPhone
                    ? `https://wa.me/${rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`}`
                    : null;

                  return (
                    <div
                      key={order.id || idx}
                      className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#DF5F45]">
                            {order.public_code?.startsWith("#")
                              ? order.public_code
                              : `#${order.public_code || "DL-0000"}`}
                          </span>
                          <span className="text-xs font-bold text-[#3C1F15]">
                            {order.customer_name}
                          </span>
                        </div>
                        <span className="text-xs font-black text-[#3C1F15]">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#7A6357]">
                        <span className="truncate max-w-[200px]">{itemsDesc}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${statusInfo.bg}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href="/delisalgados/admin/pedidos"
                          className="flex-1 py-1.5 rounded-xl bg-[#FDEAE4] text-[#DF5F45] text-center text-[10px] font-bold hover:bg-[#FADBD0] transition flex items-center justify-center gap-1"
                        >
                          <FileText size={12} />
                          <span>Detalhes pedido</span>
                        </Link>
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 rounded-xl bg-[#1FAA52] text-white text-center text-[10px] font-bold hover:bg-[#198B43] transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <MessageCircle size={12} />
                            <span>Atender WhatsApp</span>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="flex-1 py-1.5 rounded-xl bg-[#F5ECE0] text-[#9E8679] text-center text-[10px] font-bold cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <span>Sem WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F4E8DB] mt-3">
            <Link
              href="/delisalgados/admin/pedidos"
              className="text-xs font-bold text-[#DF5F45] hover:underline flex items-center justify-between"
            >
              <span>Ver todos os Pedidos</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

