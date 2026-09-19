"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/public/Header";
import { CategoryRail } from "@/components/public/CategoryRail";
import { ProductCard } from "@/components/public/ProductCard";
import { ProductModal } from "@/components/public/ProductModal";
import { FloatingCartBar } from "@/components/public/FloatingCartBar";
import { BottomNav } from "@/components/public/BottomNav";
import { SplashScreen } from "@/components/public/SplashScreen";
import { Category, Product, Settings } from "@/types";
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS } from "@/lib/db/seedData";
import { Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function CatalogPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [settings, setSettings] = useState<Settings | null>(INITIAL_SETTINGS);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  // Check if splash was already viewed in this session or skipped via URL
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("nosplash=1")) {
      setShowSplash(false);
      return;
    }
    const hasViewedSplash = sessionStorage.getItem("deli_splash_viewed");
    if (hasViewedSplash) {
      setShowSplash(false);
    }
  }, []);


  const handleFinishSplash = () => {
    sessionStorage.setItem("deli_splash_viewed", "true");
    setShowSplash(false);
  };

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch("/api/catalog");
        const data = await res.json();
        if (data.categories) setCategories(data.categories);
        if (data.products) {
          setProducts(data.products);
          const params = new URLSearchParams(window.location.search);
          const openSlug = params.get("open_product") || (params.get("screen") === "03" ? "camarao-empanado-1kg" : null);
          if (openSlug) {
            const prod = data.products.find((p: any) => p.slug === openSlug);
            if (prod) setSelectedProduct(prod);
          }
        }
        if (data.settings) setSettings(data.settings);
      } catch (err) {
        console.error("Error loading catalog:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Filter products by selected category and search query
  const filteredProducts = products.filter((p) => {
    if (selectedCategorySlug) {
      const cat = categories.find((c) => c.slug === selectedCategorySlug);
      if (cat && p.category_id !== cat.id) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = (p.description || "").toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  // Group filtered products by category when "Todos" is selected and no search
  // In Stitch Screen 02, the signature category shown first is "Salgados & Fritos" (combining salgados & bolinhos)
  const categoriesWithProducts = React.useMemo(() => {
    // Reordered categories: salgados first, empadas second, then others
    const orderedCategories = [...categories].sort((a, b) => {
      if (a.slug === "salgados") return -1;
      if (b.slug === "salgados") return 1;
      if (a.slug === "empadas") return -1;
      if (b.slug === "empadas") return 1;
      return a.sort_order - b.sort_order;
    });

    return orderedCategories
      .map((cat) => {
        let items = filteredProducts.filter((p) => p.category_id === cat.id);
        const displayName = cat.name;

        if (cat.slug === "salgados") {
          const stitchOrder = [
            "coxinha-frango",
            "risole-carne",
            "bolinho-queijo",
            "bolinho-presunto-queijo",
            "bolinho-calabresa",
          ];
          items.sort((a, b) => {
            const idxA = stitchOrder.indexOf(a.slug);
            const idxB = stitchOrder.indexOf(b.slug);
            if (idxA > -1 && idxB > -1) return idxA - idxB;
            if (idxA > -1) return -1;
            if (idxB > -1) return 1;
            return a.sort_order - b.sort_order;
          });
        }

        return {
          category: cat,
          displayName,
          items,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [categories, filteredProducts]);

  return (
    <div className="w-full max-w-[440px] mx-auto min-h-screen catalog-bg-pattern flex flex-col pb-36 overflow-x-hidden relative bg-[#FFFDF9] shadow-2xl">
      {/* 01 — Splash Screen */}


      {showSplash && <SplashScreen onFinish={handleFinishSplash} />}

      {/* 02 — Catalog Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showSearch={settings?.catalog_show_search ?? true}
      />

      {/* Category Rail */}
      <CategoryRail
        categories={categories}
        selectedCategorySlug={selectedCategorySlug}
        onSelectCategory={setSelectedCategorySlug}
      />

      {/* Main Content Area */}
      <main className="w-full max-w-full min-w-0 px-4 pt-2 flex-1 overflow-x-hidden">


        {isLoading ? (
          <div className="py-12 text-center text-[#8C7367]">
            <div className="w-8 h-8 border-3 border-[#E05A36] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Carregando cardápio...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-[#8C7367]">
            <p className="text-sm font-bold text-[#3C1F15]">Nenhum produto encontrado</p>
            <p className="text-xs mt-1 text-[#8C7367]">
              Tente buscar por outro termo ou selecione outra categoria.
            </p>
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#3C1F15] text-white text-xs font-bold shadow hover:bg-[#27120A] transition"
            >
              Ver todos os salgados
            </button>
          </div>
        ) : selectedCategorySlug || searchQuery ? (
          // Flat list for filtered or single category
          <div className="space-y-3 pt-2">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenOptions={setSelectedProduct}
                showPrices={settings?.catalog_show_prices ?? true}
              />
            ))}
          </div>
        ) : (
          // Grouped by canonical category
          <div className="space-y-6 pt-1">
            {categoriesWithProducts.map(({ category, displayName, items }) => (
              <section key={category.id} className="space-y-3">
                <div className="flex items-center justify-between pt-2 pb-1 gap-2">
                  <h2 className="text-[20px] font-extrabold text-[#3C1F15] tracking-tight shrink-0">
                    {displayName}
                  </h2>
                  <span className="shrink-0 text-[10px] font-extrabold text-[#E05A36] bg-[#FFF0E2] border border-[#F8D3BE] px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {items[0]?.minimum_quantity >= 100
                      ? `A PARTIR DE ${items[0]?.minimum_quantity} UN.`
                      : items[0]?.unit_label?.toLowerCase().includes("kg")
                      ? "PORÇÃO 1 KG"
                      : items[0]?.minimum_quantity > 1
                      ? `MÍNIMO ${items[0]?.minimum_quantity} UN.`
                      : "POR UNIDADE"}
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      onOpenOptions={setSelectedProduct}
                      showPrices={settings?.catalog_show_prices ?? true}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>


      {/* 03 — Product Options Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Floating Cart Bar */}
      <FloatingCartBar />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
