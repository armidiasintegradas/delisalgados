"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { useCart } from "@/lib/cartContext";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  showSearch = true,
}) => {
  const { totalUnits, items } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Use items.length or totalUnits
  const itemCount = items.length > 0 ? items.length : totalUnits;

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-[#F56649] via-[#F46447] to-[#EF6E54] text-white shadow-xs w-[390px]">
      <div className="w-[390px] px-4 pt-3 pb-4">


        {/* Top bar: Logo, Search, Cart, Profile */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs p-1">
              <Logo size="sm" showText={false} />
            </div>
          </Link>

          <div className="flex items-center gap-2.5 shrink-0">
            {showSearch && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Buscar produtos"
                className="w-8 h-8 flex items-center justify-center text-white hover:opacity-80 transition"
              >
                {isSearchOpen ? <X size={20} /> : <Search size={20} />}
              </button>
            )}

            <Link
              href="/pedido"
              aria-label="Ver carrinho"
              className="relative w-8 h-8 flex items-center justify-center text-white hover:opacity-80 transition"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#3C1F15] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold shadow-xs">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            <Link
              href="/perfil"
              aria-label="Perfil do cliente"
              className="w-8 h-8 flex items-center justify-center text-white hover:opacity-80 transition"
            >
              <User size={20} />
            </Link>
          </div>
        </div>


        {/* Center: Large Cardápio Title */}
        <div className="text-center pt-2 pb-1">
          <h1
            className="font-display text-[34px] font-bold text-white tracking-normal leading-none"
            style={{
              textShadow: "0 3px 6px rgba(74, 48, 34, 0.4), 0 1px 2px rgba(74, 48, 34, 0.6)",
            }}
          >
            Cardápio
          </h1>
        </div>


        {/* Expandable Search Input */}
        {showSearch && isSearchOpen && (
          <div className="mt-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar coxinhas, salgados, empadas..."
                autoFocus
                className="w-full bg-white text-[#3C1F15] placeholder:text-stone-400 text-sm rounded-full pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#F8A79B] shadow-inner"
              />
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

