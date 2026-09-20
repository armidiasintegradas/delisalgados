"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/public/Header";
import { CategoryRail } from "@/components/public/CategoryRail";
import { ProductCard } from "@/components/public/ProductCard";
import { ProductModal } from "@/components/public/ProductModal";
import { FloatingCartBar } from "@/components/public/FloatingCartBar";
import { CustomerGreeting } from "@/components/public/CustomerGreeting";
import { BottomNav } from "@/components/public/BottomNav";
import { SplashScreen } from "@/components/public/SplashScreen";
import { Category, Product, Settings } from "@/types";
import { useCart } from "@/lib/cartContext";
import { formatCurrency } from "@/lib/formatters";
import { Instagram, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";

function getCategoryBadge(items: Product[]): string | null {
  if (!items || items.length === 0) return null;

  // Inspect all visible products in the category
  const rules = items.map(
    (p) => `${p.minimum_quantity}::${(p.unit_label || "").trim().toUpperCase()}`
  );

  const allSame = rules.every((r) => r === rules[0]);
  if (!allSame) return null;

  const first = items[0];
  if (first.minimum_quantity >= 25) {
    return `A PARTIR DE ${first.minimum_quantity} UN.`;
  }
  if (first.unit_label?.toLowerCase().includes("kg")) {
    return "PORÇÃO 1 KG";
  }
  if (first.minimum_quantity > 1) {
    return `MÍNIMO ${first.minimum_quantity} UN.`;
  }
  return "POR UNIDADE";
}


type CatalogSortMode = "alphabetical" | "best_sellers" | "promotions" | "price_asc" | "price_desc";

function getProductPrice(product: Product): number {
  if (product.price_type === "variants") {
    const prices = (product.variants || [])
      .filter((variant) => variant.is_active)
      .map((variant) => Number(variant.price))
      .filter((price) => Number.isFinite(price));

    return prices.length > 0 ? Math.min(...prices) : Number.POSITIVE_INFINITY;
  }

  return product.base_price !== null && product.base_price !== undefined
    ? Number(product.base_price)
    : Number.POSITIVE_INFINITY;
}

function sortProducts(items: Product[], mode: CatalogSortMode): Product[] {
  const next = [...items];

  if (mode === "promotions") {
    return next
      .filter((product) => product.is_promotion)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }));
  }

  if (mode === "best_sellers") {
    return next.sort((a, b) => {
      const salesDiff = Number(b.sales_count || 0) - Number(a.sales_count || 0);
      if (salesDiff !== 0) return salesDiff;
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
  }

  if (mode === "price_asc" || mode === "price_desc") {
    return next.sort((a, b) => {
      const diff = getProductPrice(a) - getProductPrice(b);
      if (diff !== 0) return mode === "price_asc" ? diff : -diff;
      return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    });
  }

  return next.sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
  );
}

function getBestSellerId(items: Product[]): string | null {
  const ranked = [...items].sort(
    (a, b) => Number(b.sales_count || 0) - Number(a.sales_count || 0)
  );
  return ranked[0] && Number(ranked[0].sales_count || 0) > 0 ? ranked[0].id : null;
}

export default function CatalogPage() {
  const [showSplash, setShowSplash] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sortMode, setSortMode] = useState<CatalogSortMode>("alphabetical");

  const { items: cartItems, totalAmount, removeItem } = useCart();

  // Check if splash should be shown (strictly mobile/tablet < 1024px)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. DESKTOP (>= 1024px): Splash completely omitted per Section 11
      if (window.innerWidth >= 1024) {
        setShowSplash(false);
        return;
      }

      // 2. Respect user accessibility settings (prefers-reduced-motion)
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setShowSplash(false);
        return;
      }

      if (window.location.search.includes("nosplash=1")) {
        setShowSplash(false);
        return;
      }
      if (window.location.search.includes("splash_lock=1")) {
        setShowSplash(true);
        return;
      }
      const hasViewedSplash = sessionStorage.getItem("deli_splash_viewed");
      setShowSplash(!hasViewedSplash);
    }
  }, []);

  const handleFinishSplash = () => {
    sessionStorage.setItem("deli_splash_viewed", "true");
    setShowSplash(false);
  };

  const loadCatalog = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/catalog");
      if (!res.ok) throw new Error("Falha ao carregar catálogo");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
      if (data.products) {
        setProducts(data.products);
        const params = new URLSearchParams(window.location.search);
        const openSlug =
          params.get("open_product") ||
          (params.get("screen") === "03" ? "camarao-empanado-1kg" : null);
        if (openSlug) {
          const prod = data.products.find((p: any) => p.slug === openSlug);
          if (prod) setSelectedProduct(prod);
        }
      }
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error("Error loading catalog:", err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Filter by category/search first, then apply the requested catalog organization.
  const baseFilteredProducts = products.filter((p) => {
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

  const filteredProducts = React.useMemo(
    () => sortProducts(baseFilteredProducts, sortMode),
    [baseFilteredProducts, sortMode]
  );

  const hasPromotions = products.some((product) => product.is_promotion);

  // Categories are alphabetical; products inside every section follow the selected sort mode.
  const categoriesWithProducts = React.useMemo(() => {
    const orderedCategories = [...categories].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" })
    );

    return orderedCategories
      .map((cat) => {
        const categoryItems = baseFilteredProducts.filter((p) => p.category_id === cat.id);
        return {
          category: cat,
          displayName: cat.name,
          items: sortProducts(categoryItems, sortMode),
          bestSellerId: getBestSellerId(categoryItems),
        };
      })
      .filter((group) => group.items.length > 0);
  }, [categories, baseFilteredProducts, sortMode]);

  const flatBestSellerId = getBestSellerId(baseFilteredProducts);

  return (
    <div className="w-full max-w-[440px] lg:max-w-none mx-auto min-h-screen catalog-bg-pattern flex flex-col pb-36 lg:pb-16 overflow-x-hidden relative bg-[#FFFDF9] shadow-2xl lg:shadow-none">
      {/* 01 — Splash Screen
          Keep an immediate mobile-only cover during the hydration decision so
          the catalog never flashes before the splash animation. */}
      {showSplash === null && (
        <div
          className="fixed inset-y-0 inset-x-0 mx-auto max-w-[440px] w-full z-50 lg:hidden flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: "#DF5F45",
            backgroundImage: "url('/deli-pattern-official.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "500px auto",
          }}
          aria-hidden="true"
        >
          <img
            src="/deli-logo-cream-official.png"
            alt=""
            className="w-[190px] h-auto object-contain select-none pointer-events-none drop-shadow-[0_8px_20px_rgba(60,31,21,0.25)]"
          />
        </div>
      )}
      {showSplash === true && <SplashScreen onFinish={handleFinishSplash} />}

      {/* Coordinated Sticky Public Header Stack */}
      <div className="sticky top-0 z-30 w-full shadow-xs">
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={settings?.catalog_show_search ?? true}
        />

        <CategoryRail
          categories={categories}
          selectedCategorySlug={selectedCategorySlug}
          onSelectCategory={setSelectedCategorySlug}
        />
      </div>

      {/* Main Workspace: Centered, max-w-[1280px] on desktop */}
      <div className="w-full max-w-[440px] lg:max-w-[1280px] mx-auto px-4 lg:px-8 pt-3 flex-1 flex flex-col lg:flex-row lg:items-start lg:gap-8 landscape-full-width">
        {/* Left: Main Content Area (~880px on desktop) */}
        <main className="w-full lg:flex-1 lg:max-w-[880px] min-w-0">
          <CustomerGreeting className="mb-4" />
          <div className="mb-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max py-1">
              {[
                { id: "alphabetical", label: "A–Z" },
                { id: "best_sellers", label: "Mais vendidos" },
                { id: "promotions", label: "Promoções" },
                { id: "price_asc", label: "Menor preço" },
                { id: "price_desc", label: "Maior preço" },
              ].map((option) => {
                const active = sortMode === option.id;
                const promoUnavailable = option.id === "promotions" && !hasPromotions;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSortMode(option.id as CatalogSortMode)}
                    className={`shrink-0 px-3.5 py-2 rounded-full border text-[11px] font-extrabold transition ${
                      active
                        ? "bg-[#3C1F15] border-[#3C1F15] text-white"
                        : "bg-white border-[#EAD8C7] text-[#614439] hover:border-[#E05A36]/50"
                    }`}
                    title={promoUnavailable ? "Nenhuma promoção ativa no momento" : undefined}
                  >
                    {option.label}
                    {option.id === "promotions" && !hasPromotions ? " · 0" : ""}
                  </button>
                );
              })}
            </div>
          </div>
          {isLoading ? (
            <div className="py-12 text-center text-[#8C7367]">
              <div className="w-8 h-8 border-3 border-[#E05A36] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-semibold">Carregando cardápio...</p>
            </div>
          ) : loadError ? (
            <div className="py-16 text-center text-[#8C7367]">
              <p className="text-sm font-bold text-[#3C1F15]">
                Não foi possível carregar o cardápio
              </p>
              <p className="text-xs mt-1 text-[#8C7367]">
                Ocorreu uma instabilidade temporária. Tente carregar novamente.
              </p>
              <button
                onClick={loadCatalog}
                className="mt-4 px-4 py-2 rounded-xl bg-[#3C1F15] text-white text-xs font-bold shadow hover:bg-[#27120A] transition"
              >
                Tentar novamente
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-[#8C7367]">
              <p className="text-sm font-bold text-[#3C1F15]">Nenhum produto encontrado</p>
              <p className="text-xs mt-1 text-[#8C7367]">
                {sortMode === "promotions"
                  ? "Não há promoções ativas no momento."
                  : "Tente buscar por outro termo ou selecione outra categoria."}
              </p>
              <button
                onClick={() => {
                  setSelectedCategorySlug(null);
                  setSearchQuery("");
                  setSortMode("alphabetical");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#3C1F15] text-white text-xs font-bold shadow hover:bg-[#27120A] transition"
              >
                Ver todos os salgados
              </button>
            </div>
          ) : selectedCategorySlug || searchQuery ? (
            // Flat list for filtered or single category
            <div className="grid grid-cols-1 lg:grid-cols-2 landscape-grid-2 gap-3.5 pt-2">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onOpenOptions={setSelectedProduct}
                  showPrices={settings?.catalog_show_prices ?? true}
                  isBestSeller={prod.id === flatBestSellerId}
                />
              ))}
            </div>
          ) : (
            // Grouped by canonical category
            <div className="space-y-6 pt-1">
              {categoriesWithProducts.map(({ category, displayName, items, bestSellerId }) => {
                const badge = getCategoryBadge(items);
                return (
                  <section key={category.id} className="space-y-3">
                    <div className="flex items-center justify-between pt-2 pb-1 gap-2">
                      <h2 className="text-[20px] lg:text-[22px] font-extrabold text-[#3C1F15] tracking-tight shrink-0">
                        {displayName}
                      </h2>
                      {badge && (
                        <span className="shrink-0 text-[10px] font-extrabold text-[#E05A36] bg-[#FFF0E2] border border-[#F8D3BE] px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {badge}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 landscape-grid-2 gap-3.5">
                      {items.map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          onOpenOptions={setSelectedProduct}
                          showPrices={settings?.catalog_show_prices ?? true}
                          isBestSeller={prod.id === bestSellerId}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* Section 9: Mobile Instagram Follow CTA */}
          {settings?.instagram_url && (
            <div className="lg:hidden mt-8 mb-4 p-5 rounded-3xl bg-gradient-to-br from-[#FFF4E8] to-[#FDE8D4] border border-[#F0D5BE] text-center space-y-2.5 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#E05A36] text-white flex items-center justify-center mx-auto shadow-xs">
                <Instagram size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#3C1F15]">Siga a Deli</h3>
                <p className="text-xs text-[#7A6357] max-w-xs mx-auto mt-0.5">
                  Acompanhe novidades e encomendas no Instagram.
                </p>
              </div>
              <div>
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E05A36] hover:bg-[#C94724] text-white text-xs font-extrabold tracking-wide shadow-xs transition active:scale-95"
                >
                  <Instagram size={15} />
                  <span>SEGUIR NO INSTAGRAM</span>
                </a>
              </div>
              <div className="text-[11px] font-bold text-[#8C5237]">@deli.salgados</div>
            </div>
          )}
        </main>

        {/* Section 5: Desktop Right Order Rail (~340px) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[340px] shrink-0 sticky top-36 space-y-4">
          {/* Order Summary Box */}
          <div className="bg-[#FFFDF6] border border-[#EAD8C7] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E2D4] pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#E05A36]" />
                <h2 className="text-base font-extrabold text-[#3C1F15]">Seu pedido</h2>
              </div>
              {cartItems.length > 0 && (
                <span className="bg-[#FFE8E0] text-[#E05A36] text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "itens"}
                </span>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="py-6 text-center text-[#8C7367] space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#FFF4E8] text-[#E05A36] flex items-center justify-center mx-auto shadow-inner">
                  <ShoppingBag size={20} />
                </div>
                <p className="text-xs font-semibold text-[#7A6357]">
                  Adicione itens do cardápio para começar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#FFF9E6] p-3 rounded-2xl border border-[#EFE5D5] flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#3C1F15] truncate">
                          {item.quantity}× {item.productName}
                        </div>
                        {item.variantName && (
                          <div className="text-[10px] font-bold text-[#E05A36] uppercase">
                            {item.variantName}
                          </div>
                        )}
                        <div className="text-[11px] font-extrabold text-[#7A6357] mt-0.5">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-stone-400 hover:text-[#C04220] p-1 transition"
                        aria-label="Remover item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#F0E2D4] pt-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#7A6357]">Total:</span>
                  <span className="text-lg font-extrabold text-[#E05A36]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <Link
                  href="/pedido"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-white font-extrabold text-xs tracking-wider uppercase shadow flex items-center justify-center gap-2 transition active:scale-[0.98]"
                >
                  <span>Ver Pedido</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </div>

          {/* Section 9: Desktop Instagram Follow Box */}
          {settings?.instagram_url && (
            <div className="bg-gradient-to-br from-[#FFF4E8] to-[#FDE8D4] border border-[#F0D5BE] rounded-3xl p-5 text-center space-y-2.5 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-[#E05A36] text-white flex items-center justify-center mx-auto shadow-xs">
                <Instagram size={18} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#3C1F15]">Siga a Deli</h3>
                <p className="text-[11px] text-[#7A6357] mt-0.5">
                  Acompanhe novidades e encomendas no Instagram.
                </p>
              </div>
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-[#E05A36] hover:bg-[#C94724] text-white text-xs font-extrabold tracking-wide shadow-xs transition"
              >
                <Instagram size={14} />
                <span>SEGUIR NO INSTAGRAM</span>
              </a>
              <div className="text-[10px] font-bold text-[#8C5237]">@deli.salgados</div>
            </div>
          )}
        </aside>
      </div>

      {/* 03 — Product Options Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Floating Cart Bar (Mobile only) */}
      <FloatingCartBar />

      {/* Bottom Navigation (Mobile only) */}
      <BottomNav />
    </div>
  );
}
