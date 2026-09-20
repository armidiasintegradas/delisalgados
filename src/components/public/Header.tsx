"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User, X, BookOpen, Calendar, ClipboardList } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { CustomerAvatar } from "@/components/public/CustomerAvatar";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showSearch?: boolean;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  showSearch = true,
  title = "Cardápio",
}) => {
  const pathname = usePathname();
  const { totalUnits, items } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Use items.length or totalUnits
  const itemCount = items.length > 0 ? items.length : totalUnits;

  const navLinks = [
    { label: "CARDÁPIO", href: "/" },
    { label: "FESTA", href: "/festa" },
    { label: "PEDIDOS", href: "/meus-pedidos" },
    { label: "PERFIL", href: "/perfil" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-[#F56649] via-[#F46447] to-[#EF6E54] text-white shadow-xs w-full">
      <div className="w-full max-w-[1280px] mx-auto px-3 py-2.5 sm:px-4 lg:px-8 lg:py-3.5">
        {/* Mobile View (< lg): logo, title and actions in one horizontal row */}
        <div className="lg:hidden grid grid-cols-[auto_1fr_auto] items-center gap-2">
          <Link href="/" className="flex items-center shrink-0 min-w-0">
            <img
              src="/deli-logo-cream-official.png"
              alt="Deli Salgados"
              className="h-[64px] sm:h-[72px] w-auto max-w-[82px] sm:max-w-[96px] object-contain shrink-0 select-none drop-shadow-xs"
            />
          </Link>

          <div className="min-w-0 px-1 text-center">
            <h1
              className="font-display text-[24px] sm:text-[28px] font-bold text-white tracking-normal leading-none whitespace-nowrap"
              style={{
                textShadow: "0 3px 6px rgba(74, 48, 34, 0.4), 0 1px 2px rgba(74, 48, 34, 0.6)",
              }}
            >
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {showSearch && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Buscar produtos"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95"
              >
                {isSearchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
            )}

            <Link
              href="/pedido"
              aria-label="Ver carrinho"
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95"
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#3C1F15] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold shadow-xs">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            <Link
              href="/perfil"
              aria-label="Perfil do cliente"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95"
            >
              <CustomerAvatar size="sm" className="text-white" />
            </Link>
          </div>
        </div>

        {/* Desktop View (>= lg) */}
        <div className="hidden lg:flex items-center justify-between gap-8">
          {/* Left: Official Deli Logo (>= 88px) */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/deli-logo-cream-official.png"
              alt="Deli Salgados"
              className="h-[92px] w-auto object-contain shrink-0 select-none drop-shadow-sm hover:opacity-95 transition"
            />
          </Link>

          {/* Center: Navigation Links */}
          <nav className="flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/" || pathname.startsWith("/pedido")
                  : pathname === link.href;

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider transition ${
                    isActive
                      ? "bg-[#3C1F15] text-white shadow-xs"
                      : "text-white/90 hover:text-white hover:bg-white/15"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search / Cart / Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {showSearch && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar no cardápio..."
                  className="w-56 xl:w-64 bg-white/95 text-[#3C1F15] placeholder:text-stone-400 text-xs rounded-xl pl-8 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-white shadow-xs transition"
                />
                <Search
                  size={15}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            <Link
              href="/pedido"
              aria-label="Ver carrinho"
              className="relative px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 flex items-center gap-2 text-white transition"
            >
              <ShoppingBag size={18} />
              <span className="text-xs font-bold">Pedido</span>
              {itemCount > 0 && (
                <span className="bg-[#3C1F15] text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              href="/perfil"
              aria-label="Perfil do cliente"
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition"
            >
              <CustomerAvatar size="sm" className="text-white" />
            </Link>
          </div>
        </div>

        {/* Mobile Expandable Search Input */}
        {showSearch && isSearchOpen && (
          <div className="lg:hidden mt-2 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
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

