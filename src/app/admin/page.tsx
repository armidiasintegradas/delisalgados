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
    availableProducts: 41,
    unavailableProducts: 2,
    hiddenProducts: 0,
    todayOrders: 6,
    totalOrders: 42,
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
        setMetrics((prev) => ({
          ...prev,
          availableProducts: dashData.metrics.availableProducts || 41,
          unavailableProducts: dashData.metrics.unavailableProducts || 2,
          hiddenProducts: dashData.metrics.hiddenProducts || 0,
          todayOrders: dashData.metrics.todayOrders || 6,
          totalOrders: dashData.metrics.totalOrders || 42,
        }));
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
            href="/admin/produtos/novo"
            className="px-3 py-1.5 rounded-xl bg-[#3C1F15] text-white hover:bg-[#27120A] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {/* Greeting Title */}
      <div>
        <h1 className="text-2xl font-serif italic font-black text-[#3C1F15] tracking-tight">
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
            {metrics.availableProducts || 41}
          </div>
          <div className="text-[10px] text-[#2E7D47] font-medium bg-[#E3F4E9] px-2 py-0.5 rounded-md">
            Pronta-entrega: 16 itens | Sob enc.: 25
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
            02
          </div>
          <div className="text-[10px] text-[#C04220] font-medium bg-[#FCE8E4] px-2 py-0.5 rounded-md">
            1 bolinho pausado | 1 empada esgotada
          </div>
        </div>

        {/* Card 3: Produtos com Variação */}
        <div className="bg-[#FFFBF2] p-3.5 rounded-2xl border border-[#F8E7C5] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B8860B]">
              Produtos c/ Variação
            </span>
            <div className="w-5 h-5 rounded-full bg-[#FDF0D5] flex items-center justify-center text-[#B8860B]">
              <Layers size={13} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#3C1F15] my-1">
            03
          </div>
          <div className="text-[10px] text-[#8C6D1F] font-medium bg-[#FAF2D8] px-2 py-0.5 rounded-md">
            Camarão / Tortas / Empadas especiais
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
            <div className="text-2xl font-black">6 <span className="text-xs font-semibold opacity-90">pedidos novos</span></div>
          </div>
          <div className="text-[10px] font-bold text-white/95 bg-black/15 px-2 py-0.5 rounded-md">
            TOTAL DO DIA: R$ 1.850,00
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
            <p className="text-xs text-[#7A6357] font-serif italic">
              &ldquo;Recomendação para o fim de semana: encomendas até sexta-feira às 18h&rdquo;
            </p>
          </div>
        </div>
        <Link
          href="/admin/cardapio"
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
                  Controle rápido de 6 itens mais demandados. Alterações refletem instantaneamente no cardápio público.
                </p>
              </div>
              <span className="px-2 py-1 rounded-full bg-[#FFF4E8] text-[#DF5F45] text-[10px] font-bold shrink-0">
                Edição Rápida
              </span>
            </div>

            {/* Product items list */}
            <div className="divide-y divide-[#F7EFE6] mt-1">
              {[
                {
                  id: "1",
                  name: "Coxinha",
                  subtitle: "Salgados de 100 un. e opções frito/cong.",
                  category: "Salgados",
                  img: "/products/coxinha.jpg",
                  status: "available",
                },
                {
                  id: "2",
                  name: "Risoles de Carne",
                  subtitle: "100 un. Carne moída temperadinha",
                  category: "Salgados",
                  img: "/products/risoles.jpg",
                  status: "available",
                },
                {
                  id: "3",
                  name: "Bolinho de Queijo",
                  subtitle: "100 un. Queijo cremoso crocante",
                  category: "Salgados",
                  img: "/products/bolinho-queijo.jpg",
                  status: "available",
                },
                {
                  id: "4",
                  name: "Mini Empada de Frango",
                  subtitle: "100 un. Massa podre que derrete",
                  category: "Empadas",
                  img: "/products/empada-frango.jpg",
                  status: "unavailable",
                },
                {
                  id: "5",
                  name: "Torta Salgada de Frango c/ Catupiry",
                  subtitle: "500g e 1,5kg porções especiais",
                  category: "Tortas Salgadas",
                  img: "/products/torta-frango.jpg",
                  status: "consult",
                },
                {
                  id: "6",
                  name: "Camarão Empanado",
                  subtitle: "1 kg selecionado na farinha panko",
                  category: "Porções Especiais",
                  img: "/products/camarao.jpg",
                  status: "available",
                },
              ].map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FFF8EE] border border-[#F0E2D2] overflow-hidden shrink-0 relative">
                      <Image
                        src={item.img}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#3C1F15] truncate">
                          {item.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#FFF4E8] text-[#8C5237] text-[9px] font-semibold">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9E8679] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleAvailabilityChange(item.id, "available")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                        item.status === "available"
                          ? "bg-[#1FAA52] text-white shadow-2xs"
                          : "bg-[#F5F2EB] text-[#7A6357] hover:bg-[#EBDCCF]"
                      }`}
                    >
                      Disponível
                    </button>
                    <button
                      onClick={() => handleAvailabilityChange(item.id, "unavailable")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                        item.status === "unavailable"
                          ? "bg-[#C04220] text-white shadow-2xs"
                          : "bg-[#F5F2EB] text-[#7A6357] hover:bg-[#EBDCCF]"
                      }`}
                    >
                      Esgotado
                    </button>
                    <button
                      onClick={() => handleAvailabilityChange(item.id, "available")}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                        item.status === "consult"
                          ? "bg-[#4A3228] text-white shadow-2xs"
                          : "bg-[#F5F2EB] text-[#7A6357] hover:bg-[#EBDCCF]"
                      }`}
                    >
                      Sob Consulta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F4E8DB] mt-3">
            <Link
              href="/admin/produtos"
              className="text-xs font-bold text-[#DF5F45] hover:underline flex items-center gap-1"
            >
              <span>Ver todos os 41 produtos do cardápio</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Right Column: Últimos Pedidos WhatsApp (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-[#F0E2D2] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="text-[#1FAA52] text-sm">📋</span>
                <h2 className="text-sm font-bold text-[#3C1F15]">
                  Últimos Pedidos WhatsApp
                </h2>
              </div>
              <p className="text-[11px] text-[#7A6357] mt-0.5">
                Novos pedidos enviados pelos clientes através do cardápio público.
              </p>
            </div>

            {/* Orders list */}
            <div className="space-y-3 mt-3">
              {/* Order 1 */}
              <div className="p-3.5 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#DF5F45]">
                      #DL-0042
                    </span>
                    <span className="text-xs font-bold text-[#3C1F15]">
                      Maria Fernandes
                    </span>
                  </div>
                  <span className="text-xs font-black text-[#3C1F15]">
                    R$ 545,00
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6357]">
                  3 itens com camarão, bolinho e coxinha
                </p>
                <div className="text-[10px] text-[#9E8679]">
                  Entrega agendada: 20/09 às 16h
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/admin/pedidos"
                    className="flex-1 py-1.5 rounded-xl bg-[#FDEAE4] text-[#DF5F45] text-center text-[10px] font-bold hover:bg-[#FADBD0] transition flex items-center justify-center gap-1"
                  >
                    <FileText size={12} />
                    <span>Detalhes pedido</span>
                  </Link>
                  <a
                    href="https://wa.me/5511997454531"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 rounded-xl bg-[#1FAA52] text-white text-center text-[10px] font-bold hover:bg-[#198B43] transition flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <MessageCircle size={12} />
                    <span>Atender WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Order 2 */}
              <div className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#DF5F45]">
                      #DL-0041
                    </span>
                    <span className="text-xs font-bold text-[#3C1F15]">
                      Carlos Henrique
                    </span>
                  </div>
                  <div className="text-[10px] text-[#7A6357] mt-0.5">
                    2 itens • Retirada Balcão
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-[#3C1F15]">R$ 220,00</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[9px] font-bold">
                    Pronto p/ Entrega
                  </span>
                </div>
              </div>

              {/* Order 3 */}
              <div className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#DF5F45]">
                      #DL-0040
                    </span>
                    <span className="text-xs font-bold text-[#3C1F15]">
                      Julia Albuquerque
                    </span>
                  </div>
                  <div className="text-[10px] text-[#7A6357] mt-0.5">
                    1 item (Camarão 1 kg) • Entrega
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-[#3C1F15]">R$ 195,00</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#FFF4E8] text-[#DF5F45] text-[9px] font-bold">
                    Em Preparação
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F4E8DB] mt-3">
            <Link
              href="/admin/pedidos"
              className="text-xs font-bold text-[#DF5F45] hover:underline flex items-center justify-between"
            >
              <span>Ver todos os Pedidos</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Operational Notice Banner */}
      <div className="bg-[#FFF4E8] rounded-2xl p-3.5 border border-[#FADCC7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#DF5F45] text-white flex items-center justify-center shrink-0">
            <Bell size={14} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#3C1F15] block">
              Atenção Operacional
            </span>
            <p className="text-xs text-[#7A6357]">
              Expediente de hoje: 18 encomendas de salgados para retirar / 11 entregas agendadas até as 17:30.
            </p>
          </div>
        </div>
        <button
          onClick={() => {}}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#EBDCCF] text-xs font-bold text-[#3C1F15] hover:bg-[#FAF3E8] transition shrink-0 shadow-2xs"
        >
          Regras de Encomenda do Dia
        </button>
      </div>
    </div>
  );
}

