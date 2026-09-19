"use client";

import React, { useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { Category } from "@/types";

export default function NewProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="py-12 text-center text-xs text-[#7A6357]">Carregando categorias...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5237] block">
          Novo Cadastro
        </span>
        <h1 className="text-2xl font-bold text-[#3C1F15] tracking-tight">
          Adicionar Novo Produto
        </h1>
      </div>

      <ProductForm categories={categories} isNew={true} />
    </div>
  );
}
