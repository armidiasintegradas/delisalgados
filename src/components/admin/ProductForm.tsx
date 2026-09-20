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
  UploadCloud,
} from "lucide-react";
import { Product, Category, ProductVariant, ProductImage, PriceType, Availability, PreparationType } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { MIN_FLAVOR_QUANTITY, MIN_ORDER_UNITS } from "@/lib/orderRules";

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
  const initialImages: ProductImage[] =
    initialProduct?.images && initialProduct.images.length > 0
      ? [...initialProduct.images].sort((a, b) => a.sort_order - b.sort_order)
      : initialProduct?.image_url
        ? [{
            id: `legacy-${initialProduct.id}`,
            product_id: initialProduct.id,
            image_url: initialProduct.image_url,
            sort_order: 1,
            is_primary: true,
          }]
        : [];
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [imageUrl, setImageUrl] = useState(initialImages[0]?.image_url || "");
  const [preparationType, setPreparationType] = useState<PreparationType | "">(
    initialProduct?.preparation_type || ""
  );
  const [unitLabel, setUnitLabel] = useState(initialProduct?.unit_label || "UND");
  const [minimumQuantity, setMinimumQuantity] = useState(initialProduct?.minimum_quantity || MIN_FLAVOR_QUANTITY);
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
  const [isDraggingImage, setIsDraggingImage] = useState(false);
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

  const validateImageFile = (file?: File | null) => {
    if (!file) return null;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMessage("Use uma imagem JPG, PNG ou WebP.");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("A imagem deve ter no máximo 5 MB.");
      return null;
    }
    return file;
  };

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingImage(false);

    if (isUploadingImage) return;
    const files = Array.from(event.dataTransfer.files || []).slice(0, 6 - images.length);
    if (files.length) handleImageFiles(files);
  };

  const handleImageDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploadingImage) setIsDraggingImage(true);
  };

  const handleImageDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const current = event.currentTarget;
    const next = event.relatedTarget as Node | null;
    if (!next || !current.contains(next)) {
      setIsDraggingImage(false);
    }
  };

  const handleImageUpload = async (file?: File | null): Promise<ProductImage | null> => {
    const validFile = validateImageFile(file);
    if (!validFile) return null;

    const form = new FormData();
    form.append("file", validFile);
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

    return {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`,
      product_id: initialProduct?.id || "",
      image_url: data.publicUrl,
      sort_order: images.length + 1,
      is_primary: images.length === 0,
    };
  };

  const handleImageFiles = async (files: File[]) => {
    const remaining = Math.max(0, 6 - images.length);
    const selected = files.slice(0, remaining);

    if (selected.length === 0) {
      setErrorMessage("Este produto já possui o limite de 6 imagens.");
      return;
    }

    setErrorMessage(null);
    setIsUploadingImage(true);

    try {
      const uploaded: ProductImage[] = [];

      for (const file of selected) {
        const image = await handleImageUpload(file);
        if (image) uploaded.push(image);
      }

      if (uploaded.length > 0) {
        setImages((current) => {
          const next = [...current, ...uploaded].slice(0, 6).map((image, index) => ({
            ...image,
            sort_order: index + 1,
            is_primary: index === 0,
          }));
          setImageUrl(next[0]?.image_url || "");
          return next;
        });

        setSuccessMessage(
          uploaded.length === 1
            ? "Imagem adicionada à galeria. Salve o produto."
            : `${uploaded.length} imagens adicionadas à galeria. Salve o produto.`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Falha ao enviar imagens.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const setPrimaryImage = (index: number) => {
    setImages((current) => {
      const selected = current[index];
      if (!selected) return current;
      const next = [
        selected,
        ...current.filter((_, currentIndex) => currentIndex !== index),
      ].map((image, imageIndex) => ({
        ...image,
        sort_order: imageIndex + 1,
        is_primary: imageIndex === 0,
      }));
      setImageUrl(next[0]?.image_url || "");
      return next;
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      const normalized = next.map((image, imageIndex) => ({
        ...image,
        sort_order: imageIndex + 1,
        is_primary: imageIndex === 0,
      }));
      setImageUrl(normalized[0]?.image_url || "");
      return normalized;
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    const image = images[index];
    if (!image) return;

    const confirmed = window.confirm(
      index === 0
        ? "Remover a imagem principal? A próxima imagem passará a ser a capa do produto."
        : "Remover esta imagem da galeria?"
    );
    if (!confirmed) return;

    setImages((current) => {
      const next = current
        .filter((_, currentIndex) => currentIndex !== index)
        .map((entry, imageIndex) => ({
          ...entry,
          sort_order: imageIndex + 1,
          is_primary: imageIndex === 0,
        }));
      setImageUrl(next[0]?.image_url || "");
      return next;
    });
    setSuccessMessage("Imagem removida da galeria. Salve o produto para confirmar.");
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
      image_url: images[0]?.image_url || null,
      sort_order: Number(displayOrder),
      variants,
      images,
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
  const numMin = Number(minimumQuantity) || MIN_FLAVOR_QUANTITY;
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
                REGRA ATIVA
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFF4E8] border border-[#F0D5BE] text-[11px] text-[#7A4B36] leading-relaxed">
              <strong className="text-[#3C1F15]">Regras comerciais:</strong> mínimo de {MIN_FLAVOR_QUANTITY} unidades por sabor e mínimo de {MIN_ORDER_UNITS} unidades no pedido para itens vendidos por unidade.
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
                <span className="text-[9px] text-[#9E8679] block mt-0.5">Preço unitário cadastrado</span>
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
                    onClick={() => setMinimumQuantity(Math.max(unitLabel === "UND" ? MIN_FLAVOR_QUANTITY : 1, numMin - (unitLabel === "UND" ? MIN_FLAVOR_QUANTITY : 1)))}
                    className="w-6 h-6 rounded-lg bg-white border border-[#E8D9CB] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8]"
                  >
                    -
                  </button>
                  <span className="text-lg font-black text-[#3C1F15] flex-1 text-center">
                    {minimumQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMinimumQuantity(numMin + (unitLabel === "UND" ? MIN_FLAVOR_QUANTITY : 1))}
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
                  Lote mínimo por sabor: {formatCurrency(numPrice)} × {minimumQuantity} un. = <strong className="font-black text-[#DF5F45]">{formatCurrency(centoTotal)}</strong>
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white text-[#7A6357] text-[9px] font-bold border border-[#EBDCCF]">
                Regra aplicada no cardápio
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

            <div
              onDrop={handleImageDrop}
              onDragOver={handleImageDragOver}
              onDragEnter={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              className={`relative rounded-2xl overflow-hidden border-2 border-dashed aspect-square max-w-[360px] mx-auto transition-all ${
                isDraggingImage
                  ? "border-[#E05A36] bg-[#FFF0E8] scale-[1.01] shadow-lg"
                  : "border-[#E8D9CB] bg-[#FFF8EE]"
              }`}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name || "Produto Deli"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center p-5">
                  <div>
                    <UploadCloud size={32} className="mx-auto text-[#C9AFA1] mb-2" />
                    <p className="text-xs font-black text-[#5E463B]">
                      Arraste imagens para cá
                    </p>
                    <p className="text-[10px] text-[#9E8679] mt-1">
                      ou use o botão Enviar foto
                    </p>
                  </div>
                </div>
              )}

              {imageUrl && !isDraggingImage && (
                <div className="absolute left-3 right-3 bottom-3 rounded-xl bg-[#3C1F15]/78 backdrop-blur-sm text-white px-3 py-2 text-[10px] font-bold text-center pointer-events-none">
                  Arraste mais imagens aqui
                </div>
              )}

              {isDraggingImage && (
                <div className="absolute inset-0 z-10 bg-[#FFF0E8]/92 backdrop-blur-sm flex items-center justify-center text-center p-5 pointer-events-none">
                  <div>
                    <UploadCloud size={38} className="mx-auto text-[#E05A36] mb-2" />
                    <p className="text-sm font-black text-[#3C1F15]">Solte as imagens aqui</p>
                    <p className="text-[10px] text-[#7A6357] mt-1">JPG, PNG ou WebP · até 5 MB</p>
                  </div>
                </div>
              )}

              {isUploadingImage && (
                <div className="absolute inset-0 z-20 bg-[#FFF8EE]/90 backdrop-blur-sm flex items-center justify-center text-xs font-black text-[#3C1F15]">
                  Enviando imagem...
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div
                    key={image.id || image.image_url}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                      index === 0 ? "border-[#E05A36]" : "border-[#E8D9CB]"
                    }`}
                  >
                    <img src={image.image_url} alt={`${name || "Produto"} ${index + 1}`} className="w-full h-full object-cover" />
                    {index === 0 && (
                      <span className="absolute top-1 left-1 rounded-full bg-[#E05A36] text-white px-1.5 py-0.5 text-[8px] font-black">
                        CAPA
                      </span>
                    )}
                    <div className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1">
                      {index > 0 && (
                        <button type="button" onClick={() => setPrimaryImage(index)} className="px-1.5 py-1 rounded-md bg-[#3C1F15]/85 text-white text-[8px] font-black">
                          CAPA
                        </button>
                      )}
                      <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="w-6 h-6 rounded-md bg-white/90 text-[#3C1F15] text-[10px] font-black disabled:opacity-30">←</button>
                      <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="w-6 h-6 rounded-md bg-white/90 text-[#3C1F15] text-[10px] font-black disabled:opacity-30">→</button>
                      <button type="button" onClick={() => handleRemoveGalleryImage(index)} className="w-6 h-6 rounded-md bg-[#C04220]/90 text-white flex items-center justify-center">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#7A6357] block">
                Galeria do produto · {images.length}/6
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#3C1F15] text-white text-xs font-bold cursor-pointer hover:bg-[#27120A] transition">
                  <Camera size={14} />
                  <span>{isUploadingImage ? "Enviando..." : images.length > 0 ? "Adicionar imagens" : "Enviar imagens"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={isUploadingImage || images.length >= 6}
                    onChange={(e) => {
                      handleImageFiles(Array.from(e.target.files || []));
                      e.currentTarget.value = "";
                    }}
                    className="hidden"
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(0)}
                    disabled={isUploadingImage}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#F0B9AD] bg-[#FFF4F2] text-[#C04220] text-xs font-bold hover:bg-[#FCE8E4] transition disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    <span>Remover capa</span>
                  </button>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#9E8679] block mb-1">
                  URL pública
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    const value = e.target.value;
                    setImageUrl(value);
                    setImages((current) => {
                      if (!value) {
                        const next = current.slice(1).map((image, index) => ({
                          ...image,
                          sort_order: index + 1,
                          is_primary: index === 0,
                        }));
                        setImageUrl(next[0]?.image_url || "");
                        return next;
                      }
                      if (current.length === 0) {
                        return [{
                          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `temp-${Date.now()}`,
                          product_id: initialProduct?.id || "",
                          image_url: value,
                          sort_order: 1,
                          is_primary: true,
                        }];
                      }
                      return current.map((image, index) =>
                        index === 0 ? { ...image, image_url: value, is_primary: true } : image
                      );
                    });
                  }}
                  placeholder="https://.../produto.webp"
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                />
              </div>
              <p className="text-[10px] text-[#9E8679]">
                Até 6 imagens por produto. JPG, PNG ou WebP, até 5 MB por imagem. A primeira imagem é a capa do cardápio.
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
              <div
                onDrop={handleImageDrop}
                onDragOver={handleImageDragOver}
                onDragEnter={handleImageDragOver}
                onDragLeave={handleImageDragLeave}
                className={`relative rounded-2xl overflow-hidden aspect-square max-w-[360px] mx-auto border-2 border-dashed transition-all ${
                  isDraggingImage
                    ? "border-[#E05A36] bg-[#FFF0E8] scale-[1.01] shadow-lg"
                    : "border-[#E8D9CB] bg-[#FFF8EE]"
                }`}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name || "Produto Deli"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                    <div>
                      <UploadCloud size={30} className="mx-auto text-[#C9AFA1] mb-2" />
                      <span className="text-[10px] font-black text-[#5E463B] block">
                        Arraste imagens para cá
                      </span>
                      <span className="text-[9px] text-[#9E8679] block mt-1">
                        ou use Enviar foto
                      </span>
                    </div>
                  </div>
                )}

                {imageUrl && !isDraggingImage && (
                  <div className="absolute left-2.5 right-2.5 bottom-2.5 rounded-lg bg-[#3C1F15]/78 backdrop-blur-sm text-white px-2.5 py-1.5 text-[9px] font-bold text-center pointer-events-none">
                    Arraste outra imagem para substituir
                  </div>
                )}

                {isDraggingImage && (
                  <div className="absolute inset-0 z-10 bg-[#FFF0E8]/92 backdrop-blur-sm flex items-center justify-center text-center p-4 pointer-events-none">
                    <div>
                      <UploadCloud size={34} className="mx-auto text-[#E05A36] mb-2" />
                      <p className="text-xs font-black text-[#3C1F15]">Solte as imagens aqui</p>
                    </div>
                  </div>
                )}

                {isUploadingImage && (
                  <div className="absolute inset-0 z-20 bg-[#FFF8EE]/90 backdrop-blur-sm flex items-center justify-center text-[10px] font-black text-[#3C1F15]">
                    Enviando imagem...
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, index) => (
                    <div
                      key={image.id || image.image_url}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                        index === 0 ? "border-[#E05A36]" : "border-[#E8D9CB]"
                      }`}
                    >
                      <img src={image.image_url} alt={`${name || "Produto"} ${index + 1}`} className="w-full h-full object-cover" />
                      {index === 0 && (
                        <span className="absolute top-1 left-1 rounded-full bg-[#E05A36] text-white px-1 py-0.5 text-[7px] font-black">
                          CAPA
                        </span>
                      )}
                      <div className="absolute inset-x-1 bottom-1 flex justify-center gap-1">
                        {index > 0 && (
                          <button type="button" onClick={() => setPrimaryImage(index)} className="px-1 py-1 rounded bg-[#3C1F15]/85 text-white text-[7px] font-black">CAPA</button>
                        )}
                        <button type="button" onClick={() => handleRemoveGalleryImage(index)} className="w-6 h-6 rounded bg-[#C04220]/90 text-white flex items-center justify-center">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#3C1F15] text-white text-xs font-bold cursor-pointer">
                  <Camera size={13} />
                  <span>{isUploadingImage ? "Enviando..." : images.length > 0 ? "Adicionar imagens" : "Enviar imagens"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={isUploadingImage || images.length >= 6}
                    onChange={(e) => {
                      handleImageFiles(Array.from(e.target.files || []));
                      e.currentTarget.value = "";
                    }}
                    className="hidden"
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryImage(0)}
                    disabled={isUploadingImage}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#F0B9AD] bg-[#FFF4F2] text-[#C04220] text-xs font-bold hover:bg-[#FCE8E4] transition disabled:opacity-60"
                  >
                    <Trash2 size={13} />
                    <span>Remover capa</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] text-[#9E8679] block text-center">
                Até 6 imagens. A primeira é a capa; as demais aparecem na galeria do cardápio.
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
