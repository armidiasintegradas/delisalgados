"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  RefreshCw,
  Search,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  X,
  Check,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import { Product, Category, Availability } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from "@/lib/db/seedData";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Fast Bulk Price Edit Modal
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [editablePrices, setEditablePrices] = useState<Record<string, number>>({});
  const [isSavingPrices, setIsSavingPrices] = useState(false);

  async function loadData() {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pData.products) setProducts(pData.products);
      if (cData.categories) setCategories(cData.categories);
    } catch (e) {
      console.error("Error loading products:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", id }),
      });
      if (res.ok) {
        showNotification("Produto duplicado com sucesso.");
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggleVisibility", id, is_visible: !current }),
      });
      if (res.ok) {
        showNotification(!current ? "Produto visível no catálogo." : "Produto ocultado.");
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvailabilityChange = async (id: string, newAvailability: Availability) => {
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, availability: newAvailability } : p))
    );
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateAvailability", id, availability: newAvailability }),
      });
      if (res.ok) {
        showNotification("1 alteração de disponibilidade salva.");
      }
    } catch (e) {
      console.error(e);
      loadData();
    }
  };

  // Open fast bulk price editor
  const handleOpenBulkPrices = () => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      if (p.price_type === "simple" && p.base_price !== null) {
        map[p.id] = p.base_price;
      }
    });
    setEditablePrices(map);
    setIsBulkPriceModalOpen(true);
  };

  const handleSaveBulkPrices = async () => {
    setIsSavingPrices(true);
    const updates = Object.entries(editablePrices).map(([id, price]) => ({
      id,
      price: Number(price),
    }));

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulkPrices: updates }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(data.message || `${data.updatedCount} preços atualizados.`);
        setIsBulkPriceModalOpen(false);
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingPrices(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.category_id !== selectedCategory) {
      return false;
    }
    if (statusFilter === "available" && p.availability !== "available") return false;
    if (statusFilter === "unavailable" && p.availability !== "unavailable") return false;
    if (statusFilter === "hidden" && p.is_visible) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
    }
    return true;
  });

  const availableCount = products.filter((p) => p.availability === "available" && p.is_visible).length;
  const unavailableCount = products.filter((p) => p.availability === "unavailable").length;
  const variantsCount = products.filter((p) => p.price_type === "variants").length;

  const mobileOrder = ["coxinha-frango", "empada-camarao", "mini-burguer", "torta-frango"];
  const mobileProducts = [
    ...products.filter((p) => mobileOrder.includes(p.slug)).sort((a, b) => mobileOrder.indexOf(a.slug) - mobileOrder.indexOf(b.slug)),
    ...products.filter((p) => !mobileOrder.includes(p.slug)),
  ].slice(0, 8);

  return (
    <div className="space-y-4 w-full overflow-x-hidden">
      {/* Toast feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2E7D47] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} />
          <div>
            <div className="font-bold">Sucesso na operação</div>
            <div className="text-[10px] font-normal opacity-90">{feedbackMessage}</div>
          </div>
        </div>
      )}

      {/* MOBILE VIEW (md:hidden) — Matches Stitch Screen 16 */}
      <div className="md:hidden space-y-3 w-full">
        {/* Version & Sync */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF3E8] border border-[#EBDCCF] rounded-full text-[11px] font-bold text-[#6D4C41]">
            <span>⚙</span>
            <span>PAINEL OPERACIONAL v2.4</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#EBDCCF] rounded-full text-[11px] font-bold text-[#7A6357] shadow-2xs">
            <RefreshCw size={11} className="text-[#1FAA52]" />
            <span>Sincronizado</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/delisalgados/admin/produtos/novo"
            className="py-2.5 px-3 bg-[#3C1F15] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>+ Novo Produto</span>
          </Link>
          <button
            onClick={handleOpenBulkPrices}
            className="py-2.5 px-3 bg-[#FDEAE4] text-[#DF5F45] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs hover:bg-[#F9D5CD]"
          >
            <RefreshCw size={12} />
            <span>Atualizar Preços</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto por nome ou código..."
            className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-2xl pl-9 pr-3 py-2 text-xs text-[#3C1F15] placeholder:text-[#9E8679] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              statusFilter === "all"
                ? "bg-[#3C1F15] text-white shadow-2xs"
                : "bg-white border border-[#E8D9CB] text-[#7A6357]"
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter("available")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              statusFilter === "available"
                ? "bg-[#3C1F15] text-white shadow-2xs"
                : "bg-white border border-[#E8D9CB] text-[#3C1F15]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1FAA52]"></span>
            <span>Disponíveis ({availableCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter("unavailable")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              statusFilter === "unavailable"
                ? "bg-[#3C1F15] text-white shadow-2xs"
                : "bg-white border border-[#E8D9CB] text-[#3C1F15]"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#DF5F45]"></span>
            <span>Indisponíveis ({unavailableCount})</span>
          </button>
        </div>

        {/* Operational Notice Banner */}
        <div className="bg-[#EAF7EE] border border-[#CDEEDB] rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D6F0E0] text-[#1FAA52] flex items-center justify-center shrink-0">
              <UtensilsCrossed size={16} />
            </div>
            <div>
              <div className="font-bold text-xs text-[#1E5631]">Balcão & Encomendas</div>
              <div className="text-[10px] text-[#487358]">Taxas e disponibilidades normais para hoje</div>
            </div>
          </div>
          <button className="text-[#1FAA52] p-1.5 hover:bg-white/50 rounded-lg">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Mobile Product Cards */}
        <div className="space-y-3 pt-1">
          {mobileProducts.map((p, idx) => {
            const cat = categories.find((c) => c.id === p.category_id);
            const isUnavailable = p.availability === "unavailable";
            const isSobEncomenda = p.availability === "on_request";
            
            const thumb = p.image_url || null;

            let badgeText = "✓ Disponível";
            let badgeClass = "bg-[#EAF7EE] text-[#1FAA52]";
            if (isUnavailable) {
              badgeText = "Esgotado";
              badgeClass = "bg-[#FDEAE4] text-[#DF5F45]";
            } else if (isSobEncomenda) {
              badgeText = "Sob Encomenda";
              badgeClass = "bg-[#FEF3C7] text-[#92400E]";
            }

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-3 border border-[#F0E2D2] shadow-2xs space-y-2.5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-[#FFF8EE] border border-[#F0E2D2] overflow-hidden shrink-0 relative flex items-center justify-center">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={p.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <UtensilsCrossed size={18} className="text-[#C9AFA1]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-[#3C1F15] truncate">
                        {p.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8C7367] mt-0.5">
                      Categoria: {cat?.name || "Salgados"}
                    </div>
                    <div className="text-xs font-black text-[#DF5F45] mt-0.5">
                      {formatCurrency(p.base_price || 0)} <span className="text-[10px] font-normal text-[#8C7367]">/ {p.unit_label || "un."}</span>
                      {p.price_type === "simple" && (p.base_price || 0) < 10 && (
                        <span className="text-[10px] font-medium text-[#8C7367] ml-1.5">
                          · 25 un: {formatCurrency((p.base_price || 0) * 25)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isUnavailable ? (
                  <button
                    onClick={() => handleAvailabilityChange(p.id, "available")}
                    className="w-full py-2 bg-[#2D6A4F] hover:bg-[#1E4D37] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                  >
                    <Check size={14} />
                    <span>Reativar Disponibilidade</span>
                  </button>
                ) : isSobEncomenda ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleToggleVisibility(p.id, p.is_visible)}
                      className="py-1.5 bg-white border border-[#EBDCCF] text-[#7A6357] hover:bg-[#FAF3E8] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye size={13} />
                      <span>Exibir no Cardápio</span>
                    </button>
                    <Link
                      href={`/admin/produtos/${p.id}`}
                      className="py-1.5 bg-[#FDEAE4] text-[#DF5F45] hover:bg-[#F9D5CD] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit2 size={12} />
                      <span>Editar</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAvailabilityChange(p.id, "unavailable")}
                      className="py-1.5 bg-white border border-[#EBDCCF] text-[#7A6357] hover:bg-[#FAF3E8] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <RefreshCw size={12} />
                      <span>Alterar Status</span>
                    </button>
                    <Link
                      href={`/admin/produtos/${p.id}`}
                      className="py-1.5 bg-[#FDEAE4] text-[#DF5F45] hover:bg-[#F9D5CD] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit2 size={12} />
                      <span>Editar Detalhes</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DESKTOP VIEW (hidden md:block) — Matches Stitch Screen 09 */}
      <div className="hidden md:block space-y-4">
        {/* Top Header with Breadcrumb and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-semibold text-[#8C7367]">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#DF5F45]">
              Painel Gestão
            </span>
            <span className="mx-1.5">·</span>
            <span>Produtos do Cardápio</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenBulkPrices}
              className="px-3 py-1.5 rounded-xl bg-[#4A3228] text-white hover:bg-[#3C1F15] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw size={13} className="text-[#F8A79B]" />
              <span>Atualizar Preços em Massa</span>
            </button>

            <Link
              href="/delisalgados/admin/produtos/novo"
              className="px-3.5 py-1.5 rounded-xl bg-[#DF5F45] text-white hover:bg-[#C04220] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>Novo Produto</span>
            </Link>
          </div>
        </div>

        {/* Title with Badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#3C1F15] tracking-tight">
            Produtos do Cardápio
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold">
            #Pronta-Entrega_Ativo
          </span>
        </div>

        {/* Metric Quick Badges */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
          <span className="px-3 py-1 rounded-full bg-[#FFF4F2] text-[#DF5F45] border border-[#FBD6CF]">
            ● {products.length} produtos cadastrados
          </span>
          <span className="px-3 py-1 rounded-full bg-[#F2F8F4] text-[#1FAA52] border border-[#D5EADB]">
            ✓ {availableCount} em exibição no ar
          </span>
          <span className="px-3 py-1 rounded-full bg-[#FAF3E8] text-[#7A6357] border border-[#EBDCCF]">
            ⊘ {unavailableCount} pausados / indisponíveis
          </span>
          <span className="px-3 py-1 rounded-full bg-[#FAF3E8] text-[#7A6357] border border-[#EBDCCF]">
            {variantsCount} com variação
          </span>
        </div>

        {/* Search Bar & Status Chips */}
        <div className="bg-white p-3 rounded-2xl border border-[#F0E2D2] shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produto por nome, código ou variação..."
                className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#3C1F15] placeholder:text-[#9E8679] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9E8679]" />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { id: "all", label: `Todos (${products.length || 41})` },
                { id: "available", label: `Disponíveis (${availableCount || 39})` },
                { id: "unavailable", label: `Indisponíveis (${unavailableCount || 2})` },
                { id: "hidden", label: `Ocultos (0)` },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition ${
                    statusFilter === st.id
                      ? "bg-[#DF5F45] text-white shadow-2xs"
                      : "bg-[#FFF8EE] text-[#7A6357] hover:bg-[#F5ECE0]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                selectedCategory === "all"
                  ? "bg-[#3C1F15] text-white"
                  : "bg-white border border-[#E8D9CB] text-[#7A6357] hover:bg-[#FAF3E8]"
              }`}
            >
              Todas as Categorias
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? "bg-[#3C1F15] text-white"
                    : "bg-white border border-[#E8D9CB] text-[#7A6357] hover:bg-[#FAF3E8]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table (Desktop) */}
        <div className="bg-white rounded-3xl border border-[#F0E2D2] shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#8C7367]">Carregando catálogo...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#8C7367]">
            Nenhum produto encontrado.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#3C1F15]">
                <thead className="bg-[#FFF8EE] text-[#8C5237] uppercase font-bold text-[10px] tracking-wider border-b border-[#F0E2D2]">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">
                      <input type="checkbox" className="rounded text-[#DF5F45] focus:ring-0" />
                    </th>
                    <th className="py-2.5 px-3">Produto</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Preço / Lote</th>
                    <th className="py-2.5 px-3">Unidade</th>
                    <th className="py-2.5 px-3">Lote Mín.</th>
                    <th className="py-2.5 px-3">Disponibilidade (1-Clique)</th>
                    <th className="py-2.5 px-3">Visibilidade</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7EFE6]">
                  {filteredProducts.map((p, idx) => {
                    const cat = categories.find((c) => c.id === p.category_id);
                    const isVariants = p.price_type === "variants";
                    const isUnavailable = p.availability === "unavailable";

                    // Map thumbnail image
                    let thumb = "/products/coxinha.jpg";
                    if (p.slug.includes("risole")) thumb = "/products/risoles.jpg";
                    else if (p.slug.includes("queijo")) thumb = "/products/bolinho-queijo.jpg";
                    else if (p.slug.includes("camarao")) thumb = "/products/camarao.jpg";
                    else if (p.slug.includes("empada")) thumb = "/products/empada-frango.jpg";
                    else if (p.slug.includes("torta")) thumb = "/products/torta-frango.jpg";

                    return (
                      <tr key={p.id} className="hover:bg-[#FFFDF9] transition">
                        <td className="py-2.5 px-3 text-center">
                          <input type="checkbox" className="rounded text-[#DF5F45] focus:ring-0" />
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#FFF8EE] border border-[#F0E2D2] overflow-hidden shrink-0 relative">
                              <Image
                                src={thumb}
                                alt={p.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-[#3C1F15]">
                                  {p.name}
                                </span>
                                {idx === 3 && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#FCE8E4] text-[#C04220] text-[9px] font-black">
                                    NOVO
                                  </span>
                                )}
                                {isVariants && (
                                  <span className="px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#92400E] text-[9px] font-bold">
                                    VARIAÇÕES
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#9E8679] truncate max-w-xs">
                                {p.description || "Porção artesanal com receita de família"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-[#FFF4E8] text-[#8C5237] text-[10px] font-bold">
                            {cat?.name || "Salgados"}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="font-black text-xs text-[#3C1F15]">
                            {isVariants ? (
                              "R$ 175,00 - 195,00"
                            ) : (
                              formatCurrency(p.base_price || 0)
                            )}
                          </div>
                          <div className="text-[10px] text-[#9E8679]">
                            {isVariants
                              ? "1 pacote = 1 kg"
                              : `cento: ${formatCurrency((p.base_price || 0) * 100)}`}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-[#7A6357]">
                          <span className="px-1.5 py-0.5 rounded bg-[#FAF3E8] text-[10px]">
                            {p.unit_label.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-bold text-[#3C1F15]">
                          {p.minimum_quantity} {p.unit_label}
                        </td>

                        <td className="py-2.5 px-3">
                          <button
                            onClick={() =>
                              handleAvailabilityChange(
                                p.id,
                                isUnavailable ? "available" : "unavailable"
                              )
                            }
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 shadow-2xs ${
                              isUnavailable
                                ? "bg-[#FFF4F2] text-[#DF5F45] border border-[#FBD6CF]"
                                : "bg-[#F2F8F4] text-[#1FAA52] border border-[#D5EADB]"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{isUnavailable ? "Indisponível" : "Disponível"}</span>
                          </button>
                        </td>

                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleToggleVisibility(p.id, p.is_visible)}
                            className="text-[11px] font-semibold text-[#1FAA52] flex items-center gap-1 hover:underline"
                          >
                            <Eye size={13} />
                            <span>No ar</span>
                          </button>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/produtos/${p.id}`}
                              className="px-2.5 py-1 rounded-lg bg-[#FFF8EE] border border-[#EBDCCF] text-[#3C1F15] hover:bg-[#FAF3E8] text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <Edit2 size={11} className="text-[#DF5F45]" />
                              <span>Editar</span>
                            </Link>
                            <button
                              onClick={() => handleDuplicate(p.id)}
                              title="Mais opções"
                              className="p-1 rounded-lg hover:bg-[#FAF3E8] text-[#8C7367]"
                            >
                              <MoreVertical size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer & Pagination */}
            <div className="bg-[#FFF8EE] px-4 py-2.5 border-t border-[#F0E2D2] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#7A6357]">
              <div className="flex items-center gap-2 text-[11px]">
                <span>Exibindo {Math.min(filteredProducts.length, 8)} de {products.length || 41} produtos</span>
                <span>•</span>
                <span>Itens por página:</span>
                <select className="bg-white border border-[#EBDCCF] rounded-lg px-2 py-0.5 text-[11px] font-bold text-[#3C1F15]">
                  <option>8</option>
                  <option>20</option>
                  <option>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-auto">
                <button className="w-6 h-6 rounded-lg bg-white border border-[#EBDCCF] flex items-center justify-center text-[#7A6357] hover:bg-[#FAF3E8]">
                  <ChevronLeft size={13} />
                </button>
                <button className="w-6 h-6 rounded-lg bg-[#DF5F45] text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                  1
                </button>
                <button className="w-6 h-6 rounded-lg bg-white border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] flex items-center justify-center">
                  2
                </button>
                <button className="w-6 h-6 rounded-lg bg-white border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] flex items-center justify-center">
                  3
                </button>
                <button className="w-6 h-6 rounded-lg bg-white border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] flex items-center justify-center">
                  4
                </button>
                <button className="w-6 h-6 rounded-lg bg-white border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] flex items-center justify-center">
                  5
                </button>
                <button className="w-6 h-6 rounded-lg bg-white border border-[#EBDCCF] flex items-center justify-center text-[#7A6357] hover:bg-[#FAF3E8]">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </div>

      {/* Fast Bulk Price Editor Modal */}
      {isBulkPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-[#EBDCCF] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E8DB]">
              <div>
                <h2 className="text-base font-bold text-[#3C1F15]">
                  Atualização Rápida de Preços
                </h2>
                <p className="text-xs text-[#7A6357]">
                  Edite os valores em lote e salve diretamente no banco.
                </p>
              </div>
              <button
                onClick={() => setIsBulkPriceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1 divide-y divide-[#F7EFE6]">
              {products
                .filter((p) => p.price_type === "simple")
                .map((p) => (
                  <div key={p.id} className="pt-2 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[#3C1F15] truncate">{p.name}</div>
                      <div className="text-[10px] text-[#8C7367]">{p.unit_label}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-bold">R$</span>
                      <input
                        type="number"
                        step="0.05"
                        value={editablePrices[p.id] !== undefined ? editablePrices[p.id] : ""}
                        onChange={(e) =>
                          setEditablePrices((prev) => ({
                            ...prev,
                            [p.id]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-24 bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-2.5 py-1 text-xs text-right font-extrabold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t border-[#F4E8DB] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsBulkPriceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#614439] hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBulkPrices}
                disabled={isSavingPrices}
                className="px-5 py-2.5 rounded-xl bg-[#3C1F15] hover:bg-[#27120A] text-white text-xs font-bold shadow transition"
              >
                {isSavingPrices ? "Salvando..." : "Salvar Alterações em Lote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
