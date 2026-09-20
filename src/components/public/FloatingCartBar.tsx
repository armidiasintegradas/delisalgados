"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { formatCurrency } from "@/lib/formatters";
import { MIN_ORDER_UNITS, isUnitBasedMinimum } from "@/lib/orderRules";

export const FloatingCartBar: React.FC = () => {
  const { totalUnits, totalAmount, items } = useCart();

  if (totalUnits === 0 && items.length === 0) return null;

  const count = items.length > 0 ? items.length : totalUnits;
  const qualifyingUnitTotal = items
    .filter((item) => isUnitBasedMinimum(item.minimumQuantity, item.unitLabel))
    .reduce((sum, item) => sum + item.quantity, 0);
  const hasUnitBasedItems = qualifyingUnitTotal > 0;

  return (
    <div className="lg:hidden fixed bottom-[74px] inset-x-0 mx-auto max-w-[440px] w-full z-20 px-3.5 pointer-events-none">
      <div className="w-full pointer-events-auto">



        <Link
          href="/pedido"
          className="bg-[#3C1F15] text-[#FFF8F0] p-2 pl-3 pr-3.5 rounded-[18px] shadow-2xl flex items-center justify-between hover:bg-[#2A130B] transition-all transform active:scale-[0.99] border border-[#523023]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E85D3B] text-white flex items-center justify-center font-extrabold text-base shadow-xs shrink-0">
              {count}
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">
                Ver pedido
              </div>
              <div className="text-xs text-[#D5C3B4] font-medium leading-tight">
                {hasUnitBasedItems
                  ? `${qualifyingUnitTotal}/${MIN_ORDER_UNITS} un. mínimas no pedido`
                  : `${count} ${count === 1 ? "item selecionado" : "itens selecionados"}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[15px] font-extrabold text-white tracking-tight">
              {formatCurrency(totalAmount)}
            </span>
            <ChevronRight size={18} className="text-[#D5C3B4]" />
          </div>
        </Link>
      </div>
    </div>

  );
};

