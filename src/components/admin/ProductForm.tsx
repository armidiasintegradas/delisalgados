"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  Camera,
  Clock,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Edit2,
  Layers,
} from "lucide-react";
import { Product, Category, ProductVariant, PriceType, Availability, PreparationType } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface ProductFormProps {
  initialProduct?: Product | null;
  categories: Category[];
  isNew?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialProduct,
  categories,
  isNew = false,
}) => {
  const router = useRouter();

  const [name, setName] = useState(initialProduct?.name || "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id || categories.find((c) => c.slug === "empadas")?.id || categories[0]?.id || ""
  );
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [internalNotes, setInternalNotes] = useState(initialProduct?.note || "");
  const [imageUrl, setImageUrl] = useState(initialProduct?.image_url || "");
  const [preparationType, setPreparationType] = useState<PreparationType | "">(
    initialProduct?.preparation_type || ""
  );
  const [unitLabel, setUnitLabel] = useState(initialProduct?.unit_label || "UND");
  const [minimumQuantity, setMinimumQuantity] = useState(initialProduct?.minimum_quantity || 100);
  const [priceType, setPriceType] = useState<PriceType>(initialProduct?.price_type || "simple");
  const [basePrice, setBasePrice] = useState<number | string>(
    initialProduct?.base_price !== null && initialProduct?.base_price !== undefined
      ? initialProduct.base_price
      : 0
  );
  const [displayOrder, setDisplayOrder] = useState(initialProduct?.sort_order || 99);
  const [availability, setAvailability] = useState<Availability>(
    initialProduct?.availability || "available"
  );
  const [isVisible, setIsVisible] = useState(initialProduct?.is_visible ?? true);
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialProduct?.variants || []
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (isNew) {
      setSlug(newName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  };

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "00000000-0000-0000-0000-" + Date.now().toString().padStart(12, "0").slice(-12),
      product_id: initialProduct?.id || "",
      name: "Nova Opção",
      price: 0,
      unit_label: unitLabel,
      minimum_quantity: 1,
      sort_order: variants.length + 1,
      is_active: true,
      preparation_type: null,
    };
    setVariants([...variants, newVariant]);
  };

  const handleVariantChange = (idx: number, field: keyof ProductVariant, val: any) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: val };
    setVariants(updated);
  };

  const handleRemoveVariant = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleImageUpload = async (file?: File | null) => {
    if (!file) return;
    setErrorMessage(null);
    setIsUploadingImage(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("productId", initialProduct?.id || "novo");
      form.append("slug", slug || name || "produto");

      const res = await fetch("/api/admin/products/image", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Falha ao enviar imagem.");
      }

      setImageUrl(data.publicUrl);
      setSuccessMessage("Imagem enviada. Salve o produto para vincular a foto ao cadastro.");
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha ao enviar imagem.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage("O nome do produto é obrigatório.");
      return;
    }
    if (!preparationType) {
      setErrorMessage("Informe se o produto é frito, assado, congelado, pronto ou possui opções de preparo.");
      return;
    }

    setIsSaving(true);

    const payload = {
      name: name.trim(),
      category_id: categoryId,
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: description.trim() || null,
      note: internalNotes.trim() || null,
      unit_label: unitLabel.trim(),
      minimum_quantity: Number(minimumQuantity),
      price_type: priceType,
      base_price: priceType === "simple" ? Number(basePrice) : null,
      availability,
      is_visible: isVisible,
      preparation_type: preparationType,
      image_url: imageUrl.trim() || null,
      sort_order: Number(displayOrder),
      variants,
    };

    try {
      const url = "/api/admin/products";
      const method = isNew ? "POST" : "PUT";
      const body = isNew ? payload : { id: initialProduct?.id, ...payload };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Falha ao salvar produto.");
      }

      setSuccessMessage("Produto salvo com sucesso no banco de dados!");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const isVariantsMode = priceType === "variants";
  const numPrice = Number(basePrice) || 0;
  const numMin = Number(minimumQuantity) || 100;
  const centoTotal = numPrice * numMin;

  return (
    <div className="space-y-4 font-sans text-[#3C1F15]">
      {/* Top Notification Toast */}
      {successMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2E7D47] text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} />
          <div>
            <div className="font-bold">Salvo com sucesso</div>
            <div className="text-[10px] font-normal opacity-90">{successMessage}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Nav Breadcrumb & Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C7367]">
            Painel Gestão &gt; Produtos &gt; {name.toUpperCase()}
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <h1 className="text-2xl font-display font-black text-[#3C1F15] tracking-tight">
              {isVariantsMode ? "Editar Produto & Variantes" : name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>Publicado &amp; No ar</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#FAF3E8] text-[#8C7367] text-[10px] font-mono font-bold">
              ID: #ED-01-34
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/"
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#3C1F15] hover:bg-[#FAF3E8] transition flex items-center gap-1 shadow-2xs"
          >
            <span>Ver no Cardápio</span>
            <ExternalLink size={12} />
          </Link>
          <button
            onClick={() => {}}
            className="px-3 py-1.5 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#3C1F15] hover:bg-[#FAF3E8] transition flex items-center gap-1 shadow-2xs"
          >
            <Copy size={12} />
            <span>Duplicar</span>
          </button>
          {!isVariantsMode && (
            <button
              onClick={() => setIsVisible(!isVisible)}
              className="px-3 py-1.5 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] transition"
            >
              {isVisible ? "Ocultar" : "Mostrar"}
            </button>
          )}
          <button
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-[#DF5F45] text-white hover:bg-[#C04220] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Save size={13} />
            <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
          </button>
        </div>
      </div>

      {/* Screen 10: Simple Product Layout */}
      {!isVariantsMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Card 1: Informações Principais (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="text-sm">📌</span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Informações Principais
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FFF4E8] text-[#DF5F45] text-[9px] font-bold">
                OBRIGATÓRIO
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357]">
                  Nome do Produto
                </label>
                <span className="text-[10px] text-[#9E8679]">Exibição no cardápio</span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357]">
                  Categoria Canônica
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/delisalgados/admin/categorias")}
                  className="text-[10px] font-bold text-[#DF5F45] hover:underline"
                >
                  + Nova Categoria
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                Forma de Preparo / Entrega
              </label>
              <select
                value={preparationType}
                onChange={(e) => setPreparationType(e.target.value as PreparationType)}
                className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              >
                <option value="">Selecione...</option>
                <option value="fried">Frito</option>
                <option value="baked">Assado / Forno</option>
                <option value="frozen">Congelado</option>
                <option value="ready">Pronto / Montado</option>
                <option value="variants">Opções de preparo</option>
              </select>
              <span className="text-[10px] text-[#9E8679] mt-0.5 block">
                Esta informação aparece no cardápio e no modal do produto.
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357]">
                  Descrição para o Cardápio
                </label>
                <span className="text-[10px] text-[#9E8679]">{description.length}/200 caracteres</span>
              </div>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opcional — insira uma descrição convidativa do recheio artesanal..."
                className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl p-2.5 text-xs text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              />
              <span className="text-[10px] text-[#9E8679] mt-0.5 block">
                Aparece abaixo do título no modal de detalhes do produto no cardápio digital.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                Observações Internas (Cozinha &amp; Balcão)
              </label>
              <input
                type="text"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ex: Fornecedor de camarão fresco de Santos; massa leva banha e manteiga..."
                className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              />
              <span className="text-[10px] text-[#9E8679] mt-0.5 block">
                Visível exclusivamente para a equipe administrativa e comandos de produção.
              </span>
            </div>
          </div>

          {/* Card 2: Status Operacional (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="text-sm">🔄</span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Status Operacional
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAvailability("available")}
                className="text-[10px] text-[#9E8679] hover:underline"
              >
                Resetar
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357]">
                  Disponibilidade para Pronta-entrega
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#E5F7EB] text-[#1FAA52]">
                  1-CLIQUE
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAvailability("available")}
                  className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                    availability === "available"
                      ? "bg-[#2E7D47] text-white shadow-2xs"
                      : "bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8]"
                  }`}
                >
                  <span className="text-xs">✓</span>
                  <span>Disponível</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvailability("unavailable")}
                  className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                    availability === "unavailable"
                      ? "bg-[#C04220] text-white shadow-2xs"
                      : "bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8]"
                  }`}
                >
                  <span className="text-xs">⊘</span>
                  <span>Esgotado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvailability("available")}
                  className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                    availability === "on_request"
                      ? "bg-[#4A3228] text-white shadow-2xs"
                      : "bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8]"
                  }`}
                >
                  <span className="text-xs">⏱</span>
                  <span>Sob Consulta</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357]">
                  Visibilidade no Cardápio
                </span>
                <span className="text-[10px] text-[#9E8679]">Vitrine do Cliente</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsVisible(true)}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isVisible
                      ? "bg-[#2E7D47] text-white shadow-2xs"
                      : "bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8]"
                  }`}
                >
                  <Eye size={13} />
                  <span>Visível ao Público</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVisible(false)}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    !isVisible
                      ? "bg-[#3C1F15] text-white shadow-2xs"
                      : "bg-[#FFF8EE] text-[#7A6357] hover:bg-[#FAF3E8]"
                  }`}
                >
                  <EyeOff size={13} />
                  <span>Oculto</span>
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FFF8EE] border border-[#F0E2D2] text-[10px] text-[#7A6357] leading-relaxed">
              <span className="font-bold text-[#3C1F15]">Regra de Pronta-entrega e Vendas:</span> Produtos ocultos continuam salvos com todos os dados e aparecem no estoque interno, mas não aparecem nas buscas nem na página dos clientes.
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-[11px] font-bold text-[#3C1F15] block">
                  Ordem de Exibição
                </span>
                <span className="text-[10px] text-[#9E8679]">
                  Posição deste item no cardápio de &ldquo;Empadas&rdquo;
                </span>
              </div>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                className="w-14 bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-2 py-1 text-center text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              />
            </div>
          </div>

          {/* Card 3: Preço e Lote Mínimo (7 cols) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏷️</span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Preço e Lote Mínimo
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[9px] font-bold">
                ● Margem Contínua Calculada
              </span>
            </div>

            {/* Segmented Structure Tabs */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8679] block mb-1">
                Estrutura de Precificação
              </span>
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#FFF8EE] border border-[#F0E2D2]">
                <button
                  type="button"
                  onClick={() => setPriceType("simple")}
                  className="py-1.5 rounded-xl text-xs font-bold bg-white text-[#DF5F45] shadow-2xs transition flex items-center justify-center gap-1.5"
                >
                  <span>Preço Simples / Unidade</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriceType("variants")}
                  className="py-1.5 rounded-xl text-xs font-bold text-[#7A6357] hover:text-[#3C1F15] transition flex items-center justify-center gap-1.5"
                >
                  <Layers size={13} />
                  <span>Opções / Variantes (Cento / Frito / Congelado)</span>
                </button>
              </div>
            </div>

            {/* 3 Columns: Unit Price, Unit Base, Min Lot */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357] block">
                  Valor Unitário
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xs font-bold text-[#DF5F45]">R$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-transparent text-xl font-black text-[#DF5F45] focus:outline-none"
                  />
                </div>
                <span className="text-[9px] text-[#9E8679] block mt-0.5">
                  R$ 4,80 ant. (+8%)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357] block">
                  Unidade Base
                </span>
                <select
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  className="mt-1 w-full bg-transparent text-xs font-bold text-[#3C1F15] focus:outline-none"
                >
                  <option value="UND">UND (Unidade)</option>
                  <option value="100 un.">100 un. (Cento)</option>
                  <option value="kg">KG (Quilo)</option>
                  <option value="pct">PCT (Pacote)</option>
                </select>
                <span className="text-[9px] text-[#9E8679] block mt-1">
                  Padrão em pedidos festivos
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357] block">
                  Lote Mínimo
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setMinimumQuantity(Math.max(1, numMin - 10))}
                    className="w-6 h-6 rounded-lg bg-white border border-[#E8D9CB] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8]"
                  >
                    -
                  </button>
                  <span className="text-lg font-black text-[#3C1F15] flex-1 text-center">
                    {minimumQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMinimumQuantity(numMin + 10)}
                    className="w-6 h-6 rounded-lg bg-white border border-[#E8D9CB] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8]"
                  >
                    +
                  </button>
                </div>
                <span className="text-[9px] text-[#9E8679] block mt-1 text-center">
                  Mínimo para encomendas
                </span>
              </div>
            </div>

            {/* Cento calculation notice */}
            <div className="p-2.5 rounded-2xl bg-[#FAF3E8] border border-[#EBDCCF] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#DF5F45] text-white flex items-center justify-center text-[10px] font-bold">
                  $
                </span>
                <span className="text-[#3C1F15] font-semibold text-[11px]">
                  Cálculo de Cento Padrão: {formatCurrency(numPrice)} × {minimumQuantity} un. = <strong className="font-black text-[#DF5F45]">{formatCurrency(centoTotal)}</strong>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-[#7A6357] text-[9px] font-bold border border-[#EBDCCF]">
                Ativo no frontend web
              </span>
            </div>
          </div>

          {/* Card 4: Imagem do Produto (5 cols) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="text-sm">🖼️</span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Imagem do Produto
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF3E8] text-[#8C7367] text-[9px] font-mono font-bold">
                Foto 1:1 / WebP
              </span>
            </div>

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-[#F0E2D2] aspect-square max-w-[360px] mx-auto bg-[#FFF8EE]">
                <img
                  src={imageUrl}
                  alt={name || "Produto Deli"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E8D9CB] aspect-square max-w-[360px] mx-auto bg-[#FFF8EE] flex items-center justify-center text-center p-5">
                <div>
                  <Camera size={24} className="mx-auto text-[#C9AFA1] mb-2" />
                  <p className="text-xs font-bold text-[#7A6357]">Produto sem imagem cadastrada</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block">
                Imagem do produto
              </label>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#3C1F15] text-white text-xs font-bold cursor-pointer hover:bg-[#27120A] transition">
                <Camera size={14} />
                <span>{isUploadingImage ? "Enviando..." : "Enviar foto"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingImage}
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                  className="hidden"
                />
              </label>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8679] block mb-1">
                  URL pública
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://.../produto.webp"
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                />
              </div>
              <p className="text-[10px] text-[#9E8679]">
                JPG, PNG ou WebP, até 5 MB. O arquivo é salvo no Supabase Storage.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Screen 11: Product Variants Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (8 cols): Configurações Gerais + Opções de Venda + Regras */}
          <div className="lg:col-span-8 space-y-4">
            {/* Configurações Gerais */}
            <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#DF5F45] text-white flex items-center justify-center text-xs">
                    ⚙
                  </span>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                      Configurações Gerais
                    </h2>
                    <span className="text-[10px] text-[#9E8679]">Identificação central e taxonomia do item</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#9E8679]">SKU: EMP-CAM-001</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                    Nome do Produto
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                  />
                  <span className="text-[10px] text-[#9E8679] mt-0.5 block">
                    Nome descritivo para clientes no cardápio online
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                    Categoria
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                    Forma de Preparo / Entrega
                  </label>
                  <select
                    value={preparationType}
                    onChange={(e) => setPreparationType(e.target.value as PreparationType)}
                    className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                  >
                    <option value="">Selecione...</option>
                    <option value="fried">Frito</option>
                    <option value="baked">Assado / Forno</option>
                    <option value="frozen">Congelado</option>
                    <option value="ready">Pronto / Montado</option>
                    <option value="variants">Varia conforme a opção</option>
                  </select>
                  <span className="text-[10px] text-[#9E8679] mt-0.5 block">
                    Use “Varia conforme a opção” quando cada variante tiver um preparo diferente.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                    Unidade de Medida Base
                  </label>
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#FFF8EE] border border-[#E8D9CB] text-xs font-bold text-[#3C1F15]">
                    <span>1 kg (Padrão de Pesagem)</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FAF3E8] text-[#8C7367]">
                      REFERÊNCIA
                    </span>
                  </div>
                  <span className="text-[10px] text-[#9E8679] mt-0.5 block">
                    Usado para cálculo de rendimento nas porções
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                    Modo de Precificação
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#FFF8EE] border border-[#E8D9CB]">
                    <button
                      type="button"
                      onClick={() => setPriceType("simple")}
                      className="py-1 rounded-lg text-xs font-semibold text-[#7A6357]"
                    >
                      Preço Fixo Único
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceType("variants")}
                      className="py-1 rounded-lg text-xs font-bold bg-[#DF5F45] text-white shadow-2xs"
                    >
                      Opções / Variantes
                    </button>
                  </div>
                  <span className="text-[10px] text-[#9E8679] mt-0.5 block">
                    Permite definir múltiplos valores/formatos no mesmo item
                  </span>
                </div>
              </div>
            </div>

            {/* Opções / Variantes de Venda */}
            <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                    Opções / Variantes de Venda
                  </h2>
                  <span className="text-[10px] text-[#9E8679]">Modos de entrega, preparo e porções comercializadas</span>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-3 py-1.5 rounded-xl bg-[#3C1F15] text-white hover:bg-[#27120A] text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Adicionar Opção</span>
                </button>
              </div>

              {/* Variants list */}
              <div className="space-y-2.5">
                {variants.map((v, idx) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 font-mono">⋮⋮</span>
                      <div className="w-8 h-8 rounded-xl bg-[#FDEAE4] flex items-center justify-center text-[#DF5F45] font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#3C1F15]">
                            {v.name}
                          </span>
                          {v.preparation_type && (
                            <span className="px-1.5 py-0.5 rounded-full bg-[#FDEAE4] text-[#C84B32] text-[9px] font-bold uppercase">
                              {v.preparation_type === "fried"
                                ? "Frito"
                                : v.preparation_type === "baked"
                                  ? "Assado"
                                  : v.preparation_type === "frozen"
                                    ? "Congelado"
                                    : "Pronto"}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#9E8679]">
                          Unidade Base: {v.unit_label} • Mínimo: {v.minimum_quantity}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={v.preparation_type || ""}
                        onChange={(e) =>
                          handleVariantChange(
                            idx,
                            "preparation_type",
                            (e.target.value || null) as ProductVariant["preparation_type"]
                          )
                        }
                        className="bg-white border border-[#E8D9CB] rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#3C1F15]"
                      >
                        <option value="">Preparo...</option>
                        <option value="fried">Frito</option>
                        <option value="baked">Assado</option>
                        <option value="frozen">Congelado</option>
                        <option value="ready">Pronto</option>
                      </select>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-[#9E8679] block">
                          Preço de Venda
                        </span>
                        <span className="text-base font-black text-[#DF5F45]">
                          {formatCurrency(v.price)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[10px] font-bold">
                          ● Ativo
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newP = prompt("Novo preço da variante:", String(v.price));
                            if (newP) handleVariantChange(idx, "price", parseFloat(newP) || v.price);
                          }}
                          className="p-1 rounded-lg hover:bg-[#FAF3E8] text-[#7A6357]"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-1 rounded-lg hover:bg-red-50 text-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-[#FFF8EE] border border-[#F0E2D2] text-[10px] text-[#7A6357] leading-relaxed">
                <span className="font-bold text-[#3C1F15]">Preservação de Histórico Operacional de Pedidos:</span> Variantes antigas não são apagadas fisicamente do banco de dados para não comprometer os relatórios de faturamento e o histórico de clientes sem compras recentes.
              </div>
            </div>

            {/* Regras de Disponibilidade e Visibilidade */}
            <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3">
              <div className="pb-2 border-b border-[#F4E8DB]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Regras de Disponibilidade e Visibilidade
                </h2>
                <span className="text-[10px] text-[#9E8679]">Comportamento nos canais de atendimento e vendas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#3C1F15] block">
                      Visibilidade no Cardápio
                    </span>
                    <span className="text-[10px] text-[#9E8679]">
                      Disponível para clientes navegarem no cardápio digital
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-xs font-bold">
                    ✓
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#3C1F15] block">
                      Disponibilidade Operacional
                    </span>
                    <span className="text-[10px] text-[#9E8679]">
                      Permite pedidos imediatos no WhatsApp
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-xs font-bold">
                    ✓
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Foto + Mix de Vendas + Auditoria */}
          <div className="lg:col-span-4 space-y-4">
            {/* Foto Principal */}
            <div className="bg-white p-4 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#F4E8DB]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3C1F15]">
                  Fotografia Principal
                </span>
                <span className="text-[9px] text-[#DF5F45] font-bold">WebP HD 1:1</span>
              </div>
              {imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden aspect-square max-w-[360px] mx-auto bg-[#FFF8EE] border border-[#F0E2D2]">
                  <img
                    src={imageUrl}
                    alt={name || "Produto Deli"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#E8D9CB] aspect-square max-w-[360px] mx-auto bg-[#FFF8EE] flex items-center justify-center">
                  <div className="text-center">
                    <Camera size={22} className="mx-auto text-[#C9AFA1] mb-1" />
                    <span className="text-[10px] font-bold text-[#8C7367]">Sem foto cadastrada</span>
                  </div>
                </div>
              )}
              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#3C1F15] text-white text-xs font-bold cursor-pointer">
                <Camera size={13} />
                <span>{isUploadingImage ? "Enviando..." : "Enviar / trocar foto"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploadingImage}
                  onChange={(e) => handleImageUpload(e.target.files?.[0])}
                  className="hidden"
                />
              </label>
              <span className="text-[10px] text-[#9E8679] block text-center">
                JPG, PNG ou WebP, até 5 MB. Arquivo salvo no Supabase Storage.
              </span>
            </div>

            {/* Resumo das opções cadastradas */}
            <div className="bg-white p-4 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3C1F15] block pb-1 border-b border-[#F4E8DB]">
                Preparos cadastrados
              </span>
              <div className="flex flex-wrap gap-2">
                {variants.length === 0 ? (
                  <span className="text-[10px] text-[#9E8679]">Nenhuma variante cadastrada.</span>
                ) : (
                  variants.map((variant) => (
                    <span
                      key={variant.id}
                      className="px-2 py-1 rounded-full bg-[#FFF4E8] text-[#7A6357] text-[10px] font-bold"
                    >
                      {variant.name}
                      {variant.preparation_type
                        ? ` • ${variant.preparation_type === "fried"
                            ? "Frito"
                            : variant.preparation_type === "baked"
                              ? "Assado"
                              : variant.preparation_type === "frozen"
                                ? "Congelado"
                                : "Pronto"}`
                        : ""}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Auditoria de Carga */}
            <div className="bg-[#FFFBF7] p-4 rounded-3xl border border-[#F4E8DB] shadow-2xs space-y-2 text-xs text-[#7A6357]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3C1F15]">
                <Clock size={13} />
                <span>Auditoria de Carga</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div>
                  <strong className="text-[#3C1F15]">Última alteração:</strong> Hoje às 14:48 por Deli Gestão
                </div>
                <div>
                  <strong className="text-[#3C1F15]">Criação do Registro:</strong> 18/09/2026 em sincronização inicial
                </div>
              </div>
              <button
                type="button"
                onClick={() => {}}
                className="text-[10px] font-bold text-[#DF5F45] hover:underline pt-1 block"
              >
                Ver Histórico Completo de Alterações →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer bar */}
      <div className="bg-white rounded-2xl p-3 border border-[#F0E2D2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-[#7A6357]">
          <Clock size={14} className="text-[#9E8679]" />
          <span>
            <strong className="text-[#3C1F15]">Registro de Auditoria do Item:</strong> Última atualização hoje às 14:48 por Deli Gestão (Administrador).
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {}}
            className="text-xs font-bold text-[#C04220] hover:underline"
          >
            Excluir produto definitivamente (Ação irreversível)
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-[#DF5F45] text-white hover:bg-[#C04220] text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Save size={13} />
            <span>Salvar e Sincronizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
