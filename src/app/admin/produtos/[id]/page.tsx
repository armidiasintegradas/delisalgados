"use client";

import React, { useEffect, useState, use } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { Product, Category } from "@/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [pRes, cRes] = await Promise.all([
          fetch("/api/admin/products", { cache: "no-store" }),
          fetch("/api/admin/categories", { cache: "no-store" }),
        ]);

        if (!pRes.ok || !cRes.ok) {
          throw new Error("Não foi possível carregar os dados do produto.");
        }

        const pData = await pRes.json();
        const cData = await cRes.json();

        const found = (pData.products || []).find(
          (candidate: Product) => candidate.id === resolvedParams.id
        );

        setProduct(found || null);
        setCategories(cData.categories || []);

        if (!found) {
          setError("Produto não encontrado.");
        }
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar o produto.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="py-12 text-center text-xs text-[#7A6357]">Carregando produto...</div>;
  }

  if (error || !product) {
    return (
      <div className="py-12 text-center text-xs text-[#C04220]">
        {error || "Produto não encontrado."}
      </div>
    );
  }

  return <ProductForm initialProduct={product} categories={categories} isNew={false} />;
}
