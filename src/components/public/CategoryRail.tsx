"use client";

import React from "react";
import { Category } from "@/types";

interface CategoryRailProps {
  categories: Category[];
  selectedCategorySlug: string | null;
  onSelectCategory: (slug: string | null) => void;
}

export const CategoryRail: React.FC<CategoryRailProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory,
}) => {
  // Use canonical database category names
  const getDisplayName = (_slug: string, name: string) => {
    return name;
  };

  // Reorder categories: salgados first, empadas second, preserving all canonical categories
  const orderedCategories = [...categories]
    .sort((a, b) => {
      if (a.slug === "salgados") return -1;
      if (b.slug === "salgados") return 1;
      if (a.slug === "empadas") return -1;
      if (b.slug === "empadas") return 1;
      return a.sort_order - b.sort_order;
    });

  return (
    <div className="sticky top-[110px] z-20 bg-[#FFF0D1]/95 backdrop-blur-md py-3 px-4 w-full overflow-hidden min-w-0">
      <div className="w-full flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">

        <button
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold tracking-tight transition-all active:scale-95 ${
            selectedCategorySlug === null
              ? "bg-[#3C1F15] text-white shadow-xs"
              : "bg-[#FFF2D5] text-[#3C1F15] hover:bg-[#FFEAC0] shadow-2xs"
          }`}
        >
          Todos
        </button>

        {orderedCategories.map((cat) => {
          const isSelected = selectedCategorySlug === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold tracking-tight transition-all active:scale-95 ${
                isSelected
                  ? "bg-[#3C1F15] text-white shadow-xs"
                  : "bg-[#FFF2D5] text-[#3C1F15] hover:bg-[#FFEAC0] shadow-2xs"
              }`}
            >
              {getDisplayName(cat.slug, cat.name)}
            </button>
          );
        })}
      </div>
    </div>
  );

};

