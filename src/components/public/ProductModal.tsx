"use client";

import React, { useState, useEffect } from "react";
import { X, Minus, Plus, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { Product, ProductVariant, PreparationType } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useCart } from "@/lib/cartContext";
import { MIN_FLAVOR_QUANTITY, quantityStep } from "@/lib/orderRules";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(MIN_FLAVOR_QUANTITY);
  const [note, setNote] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isVariants = product?.price_type === "variants";
  const activeVariants = (product?.variants || []).filter((v) => v.is_active);

  const preparationLabel: Record<Exclude<PreparationType, "variants">, string> = {
    fried: "FRITO",
    baked: "ASSADO",
    frozen: "CONGELADO",
    ready: "PRONTO",
  };

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      if (isVariants && activeVariants.length > 0) {
        setSelectedVariant(activeVariants[0]);
        setQuantity(activeVariants[0].minimum_quantity);
      } else {
        setSelectedVariant(null);
        setQuantity(product.minimum_quantity);
      }
      setNote("");
      setActiveImageIndex(0);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const minQty = selectedVariant
    ? selectedVariant.minimum_quantity
    : product.minimum_quantity;
  const unitPrice = selectedVariant
    ? selectedVariant.price
    : (product.base_price || 0);
  const unitLabel = selectedVariant
    ? selectedVariant.unit_label
    : product.unit_label;
  const step = quantityStep(minQty, unitLabel);

  const galleryImages = [
    ...(product.images || [])
      .filter((image) => Boolean(image.image_url))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => image.image_url),
  ];

  if (galleryImages.length === 0 && product.image_url) {
    galleryImages.push(product.image_url);
  } else if (
    product.image_url &&
    !galleryImages.includes(product.image_url)
  ) {
    galleryImages.unshift(product.image_url);
  }

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0] || null;

  const subtotal = Number((unitPrice * quantity).toFixed(2));

  const handleIncrement = () => {
    setQuantity((prev) => prev + step);
  };

  const handleDecrement = () => {
    setQuantity((prev) => {
      const next = prev - step;
      // Rule #3: Never permit lower than minimum quantity
      return next >= minQty ? next : minQty;
    });
  };

  const handleAdd = () => {
    addItem(product, quantity, selectedVariant || undefined, note.trim() || undefined);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50 backdrop-blur-xs p-0 lg:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="deli-surface-strong w-full max-w-[440px] lg:max-w-[560px] rounded-t-[32px] lg:rounded-[32px] shadow-2xl border-t lg:border flex flex-col overflow-hidden pb-5 max-h-[92vh] lg:max-h-[85vh] animate-in slide-in-from-bottom-6 lg:zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle - Mobile only */}
        <div className="pt-3 pb-1.5 flex justify-center lg:hidden">
          <div className="w-12 h-1.5 bg-[#D6C4B4] rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[#EFE8DF] hover:bg-[#E2D8CD] flex items-center justify-center text-[#6B5347] transition shrink-0 absolute top-4 right-4 z-10"
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="px-5 pt-1 pb-3 pr-14">
          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-[#FFE8E0] text-[#E05A36] mb-1">
            {`${product.category?.name || "Cardápio"} • ${unitLabel}`}
          </span>
          <h2 className="font-display text-2xl font-bold text-[#3C1F15] leading-tight">
            {product.name}
          </h2>
          {product.preparation_type && product.preparation_type !== "variants" && (
            <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-[#FDEAE4] text-[#C84B32] text-[10px] font-extrabold uppercase tracking-wide">
              {preparationLabel[product.preparation_type]}
            </span>
          )}
          {product.description && (
            <p className="text-xs text-[#7A6357] mt-1 leading-relaxed font-medium">
              {product.description}
            </p>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="px-5 py-1 overflow-y-auto space-y-3.5 flex-1">
          {activeImage && (
            <div className="space-y-2.5">
              <div className="relative w-full max-w-[320px] aspect-square mx-auto rounded-[22px] overflow-hidden border border-[#EAD8C7] deli-surface-soft">
                <img
                  src={activeImage}
                  alt={`${product.name} — foto ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((current) =>
                          current === 0 ? galleryImages.length - 1 : current - 1
                        )
                      }
                      aria-label="Foto anterior"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#FFFDF9]/90 backdrop-blur-sm border border-[#E8D9CB] text-[#3C1F15] flex items-center justify-center shadow"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImageIndex((current) =>
                          current === galleryImages.length - 1 ? 0 : current + 1
                        )
                      }
                      aria-label="Próxima foto"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#FFFDF9]/90 backdrop-blur-sm border border-[#E8D9CB] text-[#3C1F15] flex items-center justify-center shadow"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <span className="absolute right-2 bottom-2 rounded-full bg-[#3C1F15]/80 text-white px-2.5 py-1 text-[9px] font-black">
                      {activeImageIndex + 1}/{galleryImages.length}
                    </span>
                  </>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="flex justify-center gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`Ver foto ${index + 1}`}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                        index === activeImageIndex
                          ? "border-[#E05A36]"
                          : "border-[#E8D9CB] opacity-75"
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Variants selector */}
          {isVariants && activeVariants.length > 0 && (
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-2">
                Opções:
              </label>
              <div className="space-y-2">
                {activeVariants.map((v) => {
                  const isChecked = selectedVariant?.id === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        if (quantity < v.minimum_quantity) {
                          setQuantity(v.minimum_quantity);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? "border-2 border-[#FF7A59] deli-surface-soft shadow-xs"
                          : "border border-[#EFE5D5] deli-surface-soft hover:border-[#DFCBB5]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isChecked
                              ? "border-[#E05A36] bg-white"
                              : "border-[#A08878] bg-white"
                          }`}
                        >
                          {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-[#E05A36]" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#3C1F15]">
                            {v.name}
                          </div>
                          {v.preparation_type && (
                            <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#C84B32]">
                              {preparationLabel[v.preparation_type]}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-[#3C1F15]">
                        {formatCurrency(v.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity selector */}
          <div className="pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#3C1F15] block">
                  Quantidade:
                </span>
                <span className="text-xs text-[#7A6357]">
                  {product.slug === "camarao-empanado-1kg" ? "1 pacote = 1 kg" : `Mínimo de ${minQty} ${unitLabel}`}
                </span>
              </div>

              <div className="flex items-center gap-2 deli-surface-soft px-2.5 py-1.5 rounded-2xl border border-[#E8D9CB]">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= minQty}
                  aria-label="Diminuir quantidade"
                  className="w-7 h-7 rounded-lg bg-[#3C1F15] text-white flex items-center justify-center hover:bg-[#27120A] disabled:opacity-40 transition"
                >
                  <Minus size={13} />
                </button>
                <span className="w-6 text-center text-sm font-extrabold text-[#3C1F15]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  aria-label="Aumentar quantidade"
                  className="w-7 h-7 rounded-lg bg-[#3C1F15] text-white flex items-center justify-center hover:bg-[#27120A] transition"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#EAD8C7] my-0.5" />

            {/* Customer Note */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-[#3C1F15] block mb-1.5">
                Observações (opcional):
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Alguma observação para este item?"
                rows={2}
                className="w-full deli-surface-soft border border-[#EAD9C3] rounded-2xl p-2.5 text-xs text-[#3C1F15] placeholder:text-[#A89688] focus:outline-none focus:ring-2 focus:ring-[#E05A36] focus:border-transparent transition"
              />
            </div>
        </div>

        {/* Footer */}
        <div className="deli-surface-soft p-4 border-t mt-1">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#3C1F15]">
              Subtotal:
            </span>
            <span className="text-xl font-extrabold text-[#E05A36] whitespace-nowrap">
              {formatCurrency(subtotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-white font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98]"
          >
            <ShoppingBag size={18} />
            <span className="uppercase">Adicionar ao Pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
};
