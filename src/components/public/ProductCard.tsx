"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useCart } from "@/lib/cartContext";

interface ProductCardProps {
  product: Product;
  onOpenOptions: (product: Product) => void;
  showPrices?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenOptions,
  showPrices = true,
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
      className="bg-[#FFF9E6] rounded-[18px] p-4 shadow-[0_2px_6px_rgba(60,31,21,0.04)] border border-[#F0DEC0] hover:border-[#E05A36]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-[16px] font-bold text-[#3C1F15] tracking-tight group-hover:text-[#E05A36] transition-colors leading-snug">
          {product.name}
        </h3>

        {description && (
          <p className="text-[13px] text-[#7A6357] font-normal leading-relaxed mt-0.5 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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

