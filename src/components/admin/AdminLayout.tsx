"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  ShoppingBag,
  Sliders,
  Settings as SettingsIcon,
  Users,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [todayOrdersCount, setTodayOrdersCount] = useState<number>(0);

  const basePath = pathname.startsWith("/delisalgados/admin")
    ? "/delisalgados/admin"
    : "/admin";

  const isLoginPage =
    pathname === `${basePath}/login` ||
    pathname === "/admin/login" ||
    pathname === "/delisalgados/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    async function loadMetrics() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data.metrics && typeof data.metrics.todayOrders === "number") {
            setTodayOrdersCount(data.metrics.todayOrders);
          }
        }
      } catch {}
    }
    loadMetrics();
  }, [isLoginPage]);

  // Skip layout on login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  const navLinks = [
    { label: "Visão Geral", href: `${basePath}`, icon: LayoutDashboard },
    { label: "Produtos", href: `${basePath}/produtos`, icon: UtensilsCrossed },
    { label: "Categorias", href: `${basePath}/categorias`, icon: Layers },
    { label: "Pedidos", href: `${basePath}/pedidos`, icon: ShoppingBag },
    { label: "Clientes", href: `${basePath}/clientes`, icon: Users },
    { label: "Cardápio", href: `${basePath}/cardapio`, icon: Sliders },
    { label: "Configurações", href: `${basePath}/configuracoes`, icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch {}
    document.cookie = "deli_test_session=; path=/; max-age=0";
    router.push(`${basePath}/login`);
  };

  return (
    <div className="min-h-screen catalog-bg-pattern flex flex-col md:flex-row text-[#3C1F15] font-sans w-full overflow-x-hidden">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#DF5F45] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            <img src="/deli-logo-coral-official.png" alt="Deli Salgados" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-display font-black text-base text-white leading-none block">
              Deli Salgados
            </span>
            <span className="text-[10px] text-white/80 font-medium leading-tight block">
              Admin & Gestão
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-white hover:bg-white/10"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 deli-nav-surface border-r border-[#F0E2D2] p-4 flex flex-col justify-between transition-transform duration-200 md:translate-x-0 md:static shrink-0 ${
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "hidden md:flex"
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="flex items-center justify-between px-2 py-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-14 h-14 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-[#F0E2D2]">
                <img src="/deli-logo-coral-official.png" alt="Deli Salgados" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-display font-black text-base text-[#DF5F45] leading-none block">
                  Deli Salgados
                </span>
                <span className="text-[10px] text-[#7A6357] font-medium leading-tight block">
                  Cardápio Digital Oficial
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#FCECE4] text-[#DF5F45] text-[10px] font-bold">
              Admin
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === basePath
                  ? pathname === basePath
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-[#DF5F45] text-white shadow-xs"
                      : "text-[#7A6357] hover:bg-[#F5ECE0] hover:text-[#3C1F15]"
                  }`}
                >
                  <Icon size={17} className={isActive ? "text-white" : "text-[#9E8679]"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info / User card */}
        <div className="pt-4 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#8C7367] hover:bg-[#F5ECE0] transition"
          >
            <span className="text-[11px]">Ver Cardápio Público</span>
            <ExternalLink size={13} />
          </Link>

          <div
            onClick={handleLogout}
            className="deli-surface-soft cursor-pointer rounded-2xl p-2.5 border border-[#F0E2D2] flex items-center justify-between hover:bg-[#FAF3E8] transition shadow-2xs"
            title="Clique para sair"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FDEAE4] flex items-center justify-center text-xs font-black text-[#DF5F45]">
                D
              </div>
              <div className="leading-tight">
                <div className="text-xs font-bold text-[#3C1F15]">Deli Gestão</div>
                <div className="text-[10px] text-[#9E8679]">Administrador</div>
              </div>
            </div>
            <LogOut size={14} className="text-[#9E8679] hover:text-[#DF5F45] transition" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full overflow-x-hidden p-4 sm:p-5 md:p-6 pb-24 md:pb-6 max-w-7xl">
        {children}
      </main>

      {/* Mobile Bottom Admin Navigation */}
      <nav className="deli-nav-surface md:hidden fixed bottom-0 left-0 right-0 w-full border-t border-[#F0E2D2] px-4 py-2 flex items-center justify-around z-40 shadow-lg">
        <Link
          href={`${basePath}/produtos`}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-black ${
            pathname.startsWith(`${basePath}/produtos`) ? "text-[#DF5F45]" : "text-[#8C7367]"
          }`}
        >
          <UtensilsCrossed size={18} />
          <span>PRODUTOS</span>
        </Link>
        <Link
          href={`${basePath}/cardapio`}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-black ${
            pathname.startsWith(`${basePath}/cardapio`) ? "text-[#DF5F45]" : "text-[#8C7367]"
          }`}
        >
          <Layers size={18} />
          <span>ESTOQUE</span>
        </Link>
        <Link
          href={`${basePath}/pedidos`}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-black relative ${
            pathname.startsWith(`${basePath}/pedidos`) ? "text-[#DF5F45]" : "text-[#8C7367]"
          }`}
        >
          <div className="relative">
            <ShoppingBag size={18} />
            {todayOrdersCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 bg-[#DF5F45] text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                {todayOrdersCount}
              </span>
            )}
          </div>
          <span>PEDIDOS</span>
        </Link>
        <Link
          href={`${basePath}/configuracoes`}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-black ${
            pathname.startsWith(`${basePath}/configuracoes`) ? "text-[#DF5F45]" : "text-[#8C7367]"
          }`}
        >
          <SettingsIcon size={18} />
          <span>AJUSTES</span>
        </Link>
      </nav>
    </div>
  );
};
