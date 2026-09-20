"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Product, PreparationType } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useCart } from "@/lib/cartContext";

interface ProductCardProps {
  product: Product;
  onOpenOptions: (product: Product) => void;
  showPrices?: boolean;
  isBestSeller?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenOptions,
  showPrices = true,
  isBestSeller = false,
}) => {
  const { addItem, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const isVariants = product.price_type === "variants";
  const activeVariants = (product.variants || []).filter((v) => v.is_active);

  // Price label
  let priceDisplay = "";
  if (showPrices) {
    if (isVariants && activeVariants.length > 0) {
      const minPrice = Math.min(...activeVariants.map((v) => v.price));
      priceDisplay = `A partir de ${formatCurrency(minPrice)}`;
    } else if (product.base_price !== null) {
      priceDisplay = `${formatCurrency(product.base_price)} / ${product.unit_label}`;
    }
  }

  // Canonical description strictly from product database
  const description = product.description || "";

  const preparationLabel: Record<PreparationType, string> = {
    fried: "FRITO",
    baked: "ASSADO",
    frozen: "CONGELADO",
    ready: "PRONTO",
    variants: "OPÇÕES DE PREPARO",
  };

  const preparationText =
    product.preparation_type === "variants"
      ? Array.from(
          new Set(
            activeVariants
              .map((variant) => variant.preparation_type)
              .filter(Boolean)
              .map((type) => preparationLabel[type as Exclude<PreparationType, "variants">])
          )
        ).join(" / ") || preparationLabel.variants
      : product.preparation_type
        ? preparationLabel[product.preparation_type]
        : "";

  const primaryImage =
    (product.images || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .find((image) => image.is_primary)?.image_url ||
    (product.images || [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url ||
    product.image_url;

  // Check if item is already in cart
  const cartItem = items.find((i) => i.productId === product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isVariants) {
      onOpenOptions(product);
      return;
    }

    addItem(product, product.minimum_quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <div
      onClick={() => onOpenOptions(product)}
      className="deli-surface rounded-[18px] p-4 border hover:border-[#E05A36]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
    >
      {primaryImage && (
        <div className="deli-field w-[84px] h-[84px] sm:w-[92px] sm:h-[92px] shrink-0 rounded-[14px] overflow-hidden border">
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {isBestSeller && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#3C1F15] text-white text-[9px] font-extrabold uppercase tracking-wide">
              Mais vendido
            </span>
          )}
          {product.is_promotion && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E05A36] text-white text-[9px] font-extrabold uppercase tracking-wide">
              Promoção
            </span>
          )}
        </div>

        <h3 className="text-[16px] font-bold text-[#3C1F15] tracking-tight group-hover:text-[#E05A36] transition-colors leading-snug">
          {product.name}
        </h3>

        {description && (
          <p className="text-[13px] text-[#7A6357] font-normal leading-relaxed mt-0.5 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {preparationText && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FDEAE4] text-[#C84B32] text-[10px] font-extrabold uppercase tracking-wide">
              {preparationText}
            </span>
          )}
          {showPrices && priceDisplay && (
            <span className="text-[15px] font-extrabold text-[#3C1F15] tracking-tight">
              {priceDisplay}
            </span>
          )}
        </div>
      </div>


      <div className="shrink-0 flex items-center">
        {isVariants ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenOptions(product);
            }}
            className="px-4 py-2 rounded-full bg-[#3C1F15] text-[#FFFDF9] text-[13px] font-bold hover:bg-[#27120A] shadow transition active:scale-95"
          >
            Opções
          </button>
        ) : (
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label={`Adicionar ${product.minimum_quantity} unidades`}
            className={`flex items-center justify-center px-4 py-2 rounded-full text-[13px] font-bold shadow transition active:scale-95 ${
              justAdded
                ? "bg-[#1FAA52] text-white"
                : "bg-[#3C1F15] text-[#FFFDF9] hover:bg-[#27120A]"
            }`}
          >
            {justAdded ? (
              <span className="flex items-center gap-1">
                <Check size={14} />
                <span>Adicionado</span>
              </span>
            ) : (
              <span>+ {product.minimum_quantity} un</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

