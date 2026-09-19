"use client";

import React, { useState, useEffect } from "react";
import {
  GripVertical,
  Edit2,
  Eye,
  Check,
  Plus,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Category, Product } from "@/types";

interface CategoryWithMeta extends Category {
  productCount: number;
  productPreview: string;
}

const INITIAL_CATEGORIES: CategoryWithMeta[] = [
  {
    id: "c0000000-0000-0000-0000-000000000001",
    name: "Empadas",
    slug: "empadas",
    sort_order: 1,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 7,
    productPreview: "Palmito, Frango com Catupiry, Carne de Sol Crem...",
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    name: "Trouxinhas",
    slug: "trouxinhas",
    sort_order: 2,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 6,
    productPreview: "Brie com Damasco, Carne Seca, Queijo Minas...",
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    name: "Tortas Salgadas",
    slug: "tortas-salgadas",
    sort_order: 3,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 3,
    productPreview: "Frango Cremoso com Milho, Bacalhau, Lombin...",
  },
  {
    id: "c0000000-0000-0000-0000-000000000004",
    name: "Massa Folhada",
    slug: "massa-folhada",
    sort_order: 4,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 3,
    productPreview: "Folhado de Ameixa, Ameixa com Bacon, Maç...",
  },
  {
    id: "c0000000-0000-0000-0000-000000000005",
    name: "Canapés",
    slug: "canapes",
    sort_order: 5,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 5,
    productPreview: "Salmão Gravlax, Gorgonzola com Geleia de Pi...",
  },
  {
    id: "c0000000-0000-0000-0000-000000000006",
    name: "Quiches",
    slug: "quiches",
    sort_order: 6,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 10,
    productPreview: "Lorraine Tradicional, Alho-poró, Cogumelos P...",
  },
  {
    id: "c0000000-0000-0000-0000-000000000007",
    name: "Vol-au-vent",
    slug: "vol-au-vent",
    sort_order: 7,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 2,
    productPreview: "Cream Cheese Peito Peru, Camarão ao Molho B...",
  },
  {
    id: "c0000000-0000-0000-0000-000000000008",
    name: "Salgados",
    slug: "salgados",
    sort_order: 8,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 8,
    productPreview: "Coxinha de Frango com Catupiry, Queijo com...",
  },
  {
    id: "c0000000-0000-0000-0000-000000000009",
    name: "Diversos",
    slug: "diversos",
    sort_order: 9,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 1,
    productPreview: "Cestinha Crocante com Queijo Brie",
  },
  {
    id: "c0000000-0000-0000-0000-000000000010",
    name: "Bolinhos",
    slug: "bolinhos",
    sort_order: 10,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 4,
    productPreview: "Bolinho de Bacalhau da Casa, Bolinho de Quei...",
  },
  {
    id: "c0000000-0000-0000-0000-000000000011",
    name: "Mini Sanduíches",
    slug: "mini-sanduiches",
    sort_order: 11,
    is_active: true,
    created_at: "",
    updated_at: "",
    productCount: 2,
    productPreview: "Mini Brioche com Lagarto Fatiado, Pão Austr...",
  },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithMeta[]>(INITIAL_CATEGORIES);
  const [selectedCat, setSelectedCat] = useState<CategoryWithMeta>(INITIAL_CATEGORIES[0]);
  const [editName, setEditName] = useState("Empadas");
  const [editOrder, setEditOrder] = useState("1");
  const [editIsActive, setEditIsActive] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/catalog"),
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();

        if (catData.categories && catData.categories.length > 0) {
          const prods: Product[] = prodData.products || [];
          const enriched = catData.categories.map((c: Category) => {
            const catProds = prods.filter((p) => p.category_id === c.id);
            const preview =
              catProds.length > 0
                ? catProds
                    .slice(0, 3)
                    .map((p) => p.name)
                    .join(", ") + (catProds.length > 3 ? "..." : "")
                : "Sem itens cadastrados";

            const fallback = INITIAL_CATEGORIES.find((ic) => ic.slug === c.slug);
            return {
              ...c,
              productCount: catProds.length || fallback?.productCount || 0,
              productPreview: fallback?.productPreview || preview,
            };
          });

          enriched.sort(
            (a: CategoryWithMeta, b: CategoryWithMeta) =>
              (a.sort_order || 0) - (b.sort_order || 0)
          );
          setCategories(enriched);
          setSelectedCat(enriched[0]);
          setEditName(enriched[0].name);
          setEditOrder(String(enriched[0].sort_order || 1));
          setEditIsActive(enriched[0].is_active);
        }
      } catch (e) {
        console.error("Categories load error:", e);
      }
    }
    loadData();
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectCategory = (cat: CategoryWithMeta) => {
    setSelectedCat(cat);
    setEditName(cat.name);
    setEditOrder(String(cat.sort_order || 1));
    setEditIsActive(cat.is_active);
  };

  const handleToggleActive = async (id: string, current: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !current }),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c))
        );
        if (selectedCat.id === id) {
          setEditIsActive(!current);
        }
        notify("Status da categoria alterado com sucesso.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCategory = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCat.id,
          name: editName.trim(),
          sort_order: Number(editOrder) || selectedCat.sort_order,
          is_active: editIsActive,
        }),
      });
      if (res.ok) {
        notify("Categoria atualizada com sucesso!");
        setCategories((prev) =>
          prev.map((c) =>
            c.id === selectedCat.id
              ? {
                  ...c,
                  name: editName.trim(),
                  sort_order: Number(editOrder) || c.sort_order,
                  is_active: editIsActive,
                }
              : c
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const totalCataloged = categories.reduce((acc, c) => acc + c.productCount, 0) || 46;

  return (
    <div className="space-y-4 font-sans text-[#3C1F15]">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2E7D47] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C7367]">
            CATEGORIAS &amp; APRESENTAÇÃO &gt; PÚBLICO
          </div>
          <h1 className="text-2xl font-serif italic font-black text-[#3C1F15] tracking-tight mt-0.5">
            Categorias do Cardápio
          </h1>
          <p className="text-xs text-[#7A6357] mt-1 max-w-xl leading-relaxed">
            Organize a ordem de exibição das seções no cardápio público e controle quais estão ativas para os pedidos dos clientes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5F7EB] border border-[#BCE7C9] text-xs font-bold text-[#1FAA52] shadow-2xs">
            <CheckCircle2 size={14} className="text-[#1FAA52]" />
            <span>Sincronizado com Loja Online</span>
          </div>

          <button
            onClick={() => notify("Criar nova categoria")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#52291D] hover:bg-[#3D1E15] text-white text-xs font-bold transition shadow-xs"
          >
            <Plus size={15} className="text-[#F8A79B]" />
            <span>+ Nova Categoria</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Categories List */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white rounded-3xl border border-[#F0E2D2] shadow-2xs overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-5 py-3 bg-[#FAF3E8] border-b border-[#EEDFCE] text-[10px] font-bold uppercase tracking-wider text-[#8C7367]">
              <div className="col-span-1 text-center">POS.</div>
              <div className="col-span-7 pl-3">NOME &amp; VOLUME</div>
              <div className="col-span-2 text-center">EXIBIÇÃO</div>
              <div className="col-span-2 text-right pr-2">AÇÕES</div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#F6ECE2]">
              {categories.map((cat, idx) => {
                const isSelected = selectedCat?.id === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className={`grid grid-cols-12 items-center px-5 py-3.5 cursor-pointer transition ${
                      isSelected ? "bg-[#FFF8EE]" : "hover:bg-[#FFFCF8]"
                    }`}
                  >
                    {/* Drag Handle & Position Number */}
                    <div className="col-span-1 flex items-center justify-center gap-1">
                      <GripVertical size={13} className="text-[#C8B8AC] hover:text-[#7A6357]" />
                      <div className="w-6 h-6 rounded-full bg-[#FAF3E8] border border-[#EBDCCF] text-[11px] font-bold text-[#7A6357] flex items-center justify-center">
                        {idx + 1}
                      </div>
                    </div>

                    {/* Name & Preview */}
                    <div className="col-span-7 pl-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#3C1F15] hover:text-[#DF5F45] transition">
                          {cat.name}
                        </span>
                        <span className="px-2 py-0.2 rounded-full bg-[#FCECE8] text-[#C04220] text-[10px] font-bold">
                          {cat.productCount} produtos
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9E8679] truncate max-w-md mt-0.5">
                        {cat.productPreview}
                      </p>
                    </div>

                    {/* Exibição Switch */}
                    <div className="col-span-2 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => handleToggleActive(cat.id, cat.is_active, e)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          cat.is_active
                            ? "bg-[#E5F7EB] text-[#1FAA52]"
                            : "bg-[#F3EDE6] text-[#8C7367]"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cat.is_active ? "bg-[#1FAA52]" : "bg-[#8C7367]"
                          }`}
                        />
                        <span>{cat.is_active ? "Ativa" : "Inativa"}</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1.5 pr-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCategory(cat);
                        }}
                        className="p-1.5 rounded-lg text-[#8C7367] hover:text-[#3C1F15] hover:bg-[#FAF3E8] transition"
                        title="Editar Categoria"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open("/", "_blank");
                        }}
                        className="p-1.5 rounded-lg text-[#8C7367] hover:text-[#3C1F15] hover:bg-[#FAF3E8] transition"
                        title="Visualizar no Cardápio"
                      >
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom List Info Banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF8EE] border border-[#F0E2D2] text-[11px] text-[#7A6357]">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[#FAF3E8] text-[#8C7367] flex items-center justify-center font-bold text-[10px] border border-[#EBDCCF]">
                i
              </span>
              <span>
                Arraste qualquer item pelo ícone para reorganizar a ordem de navegação do cliente.
              </span>
            </div>
            <div className="font-bold text-[#3C1F15]">
              Total: {totalCataloged} salgados catalogados
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Quick Edit Drawer & Organizational Tips */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Edit Card */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FCECE8] text-[#DF5F45] flex items-center justify-center text-xs">
                  ✎
                </span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Edição Rápida da Categoria
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[10px] font-bold">
                Modo Edição
              </span>
            </div>

            {/* Category Name Input */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                Nome no Site/Cardápio
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45] pr-8"
                />
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-2.5 text-[#8C7367] pointer-events-none"
                />
              </div>
            </div>

            {/* Order & Active Count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  value={editOrder}
                  onChange={(e) => setEditOrder(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                  Produtos Ativos
                </label>
                <div className="px-3 py-2 rounded-xl bg-[#FFF8EE] border border-[#E8D9CB] text-xs font-bold text-[#3C1F15] flex items-center justify-between">
                  <span>{selectedCat?.productCount || 0}</span>
                  <span className="text-[10px] font-normal text-[#8C7367]">salgados ativos</span>
                </div>
              </div>
            </div>

            {/* Exibir no Cardápio Box */}
            <div className="p-3 rounded-2xl bg-[#FFF8EE] border border-[#F0E2D2] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#3C1F15] block">
                  Exibir no Cardápio Online
                </span>
                <span className="text-[10px] text-[#9E8679]">Visível para encomendas</span>
              </div>
              <button
                type="button"
                onClick={() => setEditIsActive(!editIsActive)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ease-in-out ${
                  editIsActive ? "bg-[#2E7D47]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ease-in-out ${
                    editIsActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Warning / Remanescentes Callout */}
            <div className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] flex items-start gap-2 text-[10px] text-[#7A6357] leading-relaxed">
              <span className="text-base text-[#DF5F45] leading-none shrink-0">⌂</span>
              <p>
                <span className="font-bold text-[#3C1F15]">Produtos remanescentes:</span> uma
                categoria apagada com itens ativos no banco de dados moverá automaticamente os itens
                para qualquer outra categoria sem perda de fotos ou precificação por cento.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditName(selectedCat.name);
                  setEditOrder(String(selectedCat.sort_order || 1));
                  setEditIsActive(selectedCat.is_active);
                }}
                className="py-2.5 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] transition text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveCategory}
                className="py-2.5 rounded-xl bg-[#A93B1F] hover:bg-[#942B14] text-white text-xs font-bold transition text-center shadow-xs disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : "Salvar Categoria"}
              </button>
            </div>
          </div>

          {/* Operational Tip Card */}
          <div className="bg-[#FFF8EE] p-4 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C5237]">
              <Lightbulb size={14} className="text-[#DF5F45]" />
              <span>Dica Operacional de Organização</span>
            </div>
            <p className="text-[11px] text-[#7A6357] leading-relaxed">
              As 3 primeiras categorias (Empadas, Trouxinhas e Tortas) concentram 68% dos pedidos de
              fim de semana. Mantenha-as no topo para acelerar o tempo de finalização dos
              colaboradores/clientes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
