"use client";

import React, { useEffect, useState, use } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { Product, Category } from "@/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const isCamarao = resolvedParams?.id?.includes("36") || resolvedParams?.id?.includes("camarao");
  const [product, setProduct] = useState<Product | null>(
    isCamarao
      ? {
          id: "p0000000-0000-0000-0000-000000000036",
          name: "Camarão Empanado",
          slug: "camarao-empanado-1kg",
          description: "Camarões selecionados empanados na farinha crocante artesanal panko.",
          category_id: "c0000000-0000-0000-0000-000000000002",
          price_type: "variants",
          base_price: null,
          unit_label: "1 kg",
          minimum_quantity: 1,
          availability: "available",
          is_visible: true,
          note: null,
          is_featured: false,
          image_url: "/products/camarao.jpg",
          sort_order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          variants: [
            {
              id: "v-1",
              product_id: "p0000000-0000-0000-0000-000000000036",
              name: "Congelado",
              price: 175.0,
              unit_label: "1 kg",
              minimum_quantity: 1,
              sort_order: 1,
              is_active: true,
            },
            {
              id: "v-2",
              product_id: "p0000000-0000-0000-0000-000000000036",
              name: "Frito Pronto",
              price: 195.0,
              unit_label: "1 kg",
              minimum_quantity: 1,
              sort_order: 2,
              is_active: true,
            },
          ],
        }
      : {
          id: resolvedParams?.id || "p0000000-0000-0000-0000-000000000001",
          name: "Empadinha de Camarão",
          slug: "empadinha-camarao",
          description: "Camarões frescos selecionados, refogados com ervas e azeite em massa podre amanteigada tradicional.",
          category_id: "c0000000-0000-0000-0000-000000000001",
          price_type: "simple",
          base_price: 5.2,
          unit_label: "UND",
          minimum_quantity: 100,
          availability: "available",
          is_visible: true,
          note: null,
          is_featured: false,
          image_url: null,
          sort_order: 4,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
  );
  const [categories, setCategories] = useState<Category[]>([
    { id: "c0000000-0000-0000-0000-000000000001", name: "Empadas", slug: "empadas", sort_order: 1, is_active: true, created_at: "", updated_at: "" },
    { id: "c0000000-0000-0000-0000-000000000002", name: "Salgados", slug: "salgados", sort_order: 2, is_active: true, created_at: "", updated_at: "" },
    { id: "c0000000-0000-0000-0000-000000000003", name: "Tortas Salgadas", slug: "tortas-salgadas", sort_order: 3, is_active: true, created_at: "", updated_at: "" },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch("/api/admin/products"),
          fetch("/api/admin/categories"),
        ]);
        const pData = await pRes.json();
        const cData = await cRes.json();

        if (pData.products) {
          const found = pData.products.find((p: Product) => p.id === resolvedParams.id);
          setProduct(found || null);
        }
        if (cData.categories) {
          setCategories(cData.categories);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="py-12 text-center text-xs text-[#7A6357]">Carregando produto...</div>;
  }

  if (!product) {
    return <div className="py-12 text-center text-xs text-[#C04220]">Produto não encontrado.</div>;
  }

  return <ProductForm initialProduct={product} categories={categories} isNew={false} />;
}
