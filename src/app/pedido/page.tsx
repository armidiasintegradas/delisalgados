"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { formatCurrency } from "@/lib/formatters";
import { MIN_ORDER_UNITS, isUnitBasedMinimum } from "@/lib/orderRules";

export default function CartPage() {
  const { items, updateQuantity, removeItem, totalAmount, clearCart, isInitialized } = useCart();
  const totalItemCount = items.length;
  const qualifyingUnitTotal = items
    .filter((item) => isUnitBasedMinimum(item.minimumQuantity, item.unitLabel))
    .reduce((sum, item) => sum + item.quantity, 0);
  const hasUnitBasedItems = items.some((item) =>
    isUnitBasedMinimum(item.minimumQuantity, item.unitLabel)
  );
  const meetsOrderMinimum = !hasUnitBasedItems || qualifyingUnitTotal >= MIN_ORDER_UNITS;

  return (
    <div className="min-h-screen bg-[#FFF0D1] catalog-bg-pattern flex flex-col w-full max-w-[440px] lg:max-w-none mx-auto shadow-2xl lg:shadow-none relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#DF5F45] text-white shadow-md">
        <div className="w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <img
              src="/deli-logo-cream-official.png"
              alt="Deli Salgados"
              className="h-9 w-auto object-contain select-none"
            />
            <div>
              <h1 className="text-base lg:text-lg font-bold leading-tight">Seu pedido</h1>
              <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
                {totalItemCount} {totalItemCount === 1 ? "item selecionado" : "itens selecionados"}
              </span>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-[#FCE9D8] hover:text-white underline cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[440px] lg:max-w-[1280px] mx-auto p-4 lg:p-8 flex-1 flex flex-col">
        {!isInitialized ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full lg:max-w-[720px] bg-[#FFFDF6] rounded-3xl border border-[#EAD8C7] p-8 text-center shadow-sm">
              <div className="w-8 h-8 border-3 border-[#DF5F45] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#7A6357] mt-3">Carregando seu pedido...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10 lg:py-16">
            <div className="w-full lg:max-w-[760px] bg-[#FFFDF6] lg:rounded-3xl lg:border lg:border-[#EAD8C7] lg:shadow-sm p-6 lg:p-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-[#FFF4E8] text-[#E05A36] flex items-center justify-center mb-4 shadow-inner">
              <ShoppingBag size={28} />
            </div>
            <h2 className="text-base lg:text-lg font-bold text-[#3C1F15]">Seu pedido está vazio</h2>
            <p className="text-xs lg:text-sm text-[#7A6357] mt-1 max-w-xs leading-relaxed">
              Explore o nosso cardápio e monte a sua encomenda!
            </p>
            <Link
              href="/"
              className="mt-6 px-6 py-3 rounded-2xl bg-[#3C1F15] text-white text-xs font-bold shadow-md hover:bg-[#27120A] transition"
            >
              Voltar ao Cardápio
            </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 lg:space-y-0 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start flex-1 flex flex-col justify-between">
            {/* Left: Items list */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FFFDF6] rounded-[18px] lg:rounded-2xl p-4 border border-[#EAD8C7] shadow-xs flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-sm lg:text-base font-bold text-[#3C1F15] leading-snug">
                          {item.productName}
                        </h3>
                        {item.variantName && (
                          <span className="px-2 py-0.5 bg-[#FFE8E0] text-[#E05A36] text-[9px] font-extrabold rounded-md uppercase">
                            {item.variantName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-[#7A6357] mt-0.5">
                        {formatCurrency(item.unitPrice)} / {item.unitLabel}
                      </div>
                      {item.note && (
                        <p className="text-[11px] text-[#8C7367] italic mt-1 bg-[#FFF9E6] p-1.5 rounded-lg border border-[#F0E2D4]">
                          Obs: {item.note}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[#B09988] hover:text-[#C04220] p-1 transition"
                      aria-label="Remover item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Quantity & Subtotal Row */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Controls */}
                    <div className="flex items-center gap-2 bg-[#FFF4D9] px-2.5 py-1 rounded-2xl border border-[#E8D9CB]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-[#3C1F15] text-white flex items-center justify-center hover:bg-[#27120A] transition"
                        aria-label="Diminuir"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-extrabold text-[#3C1F15]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-[#3C1F15] text-white flex items-center justify-center hover:bg-[#27120A] transition"
                        aria-label="Aumentar"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="text-right shrink-0 pr-1">
                      <span className="text-[10px] text-[#7A6357] block uppercase font-bold">
                        Subtotal
                      </span>
                      <span className="text-sm lg:text-base font-extrabold text-[#3C1F15] whitespace-nowrap">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Sticky Summary Card on Desktop */}
            <div className="bg-[#FFFDF6] rounded-[18px] lg:rounded-3xl p-5 border border-[#EAD8C7] shadow-xs space-y-4 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#3C1F15]">
                  Resumo do Pedido
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF2D5] text-[#3C1F15] text-[10px] font-bold border border-[#E8D9CB]">
                  {totalItemCount} {totalItemCount === 1 ? "item" : "itens"}
                </span>
              </div>
              <div className="pt-3 border-t border-[#F2E5D6] flex items-center justify-between">
                <span className="text-xs font-bold text-[#7A6357]">
                  Total estimado:
                </span>
                <span className="text-xl lg:text-2xl font-extrabold text-[#E05A36]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              {hasUnitBasedItems && (
                <div className={`p-3 rounded-2xl border text-[11px] font-semibold ${
                  meetsOrderMinimum
                    ? "bg-[#EAF7EE] border-[#CDEEDB] text-[#1E5631]"
                    : "bg-[#FFF4E8] border-[#F0D5BE] text-[#8C5237]"
                }`}>
                  Pedido por unidade: <strong>{qualifyingUnitTotal} un.</strong> de {MIN_ORDER_UNITS} un. mínimas.
                  {!meetsOrderMinimum && (
                    <span> Adicione mais {MIN_ORDER_UNITS - qualifyingUnitTotal} un.</span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                {meetsOrderMinimum ? (
                  <Link
                    href="/pedido/finalizar"
                    className="w-full py-3.5 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-white text-xs font-extrabold tracking-wide uppercase shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98]"
                  >
                    <span>Finalizar Pedido</span>
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-[#B9AAA2] text-white text-xs font-extrabold tracking-wide uppercase shadow flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <span>Mínimo de {MIN_ORDER_UNITS} unidades</span>
                    <ArrowRight size={16} />
                  </button>
                )}

                <Link
                  href="/"
                  className="w-full py-3 rounded-2xl bg-white hover:bg-[#FFF9E6] border border-[#EAD8C7] text-[#3C1F15] text-xs font-bold text-center block uppercase transition"
                >
                  + Adicionar mais itens
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
