"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, ClipboardList, User } from "lucide-react";
import { CustomerAvatar } from "@/components/public/CustomerAvatar";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  // Stitch approval: Exactly CARDÁPIO, FESTA, PEDIDOS, PERFIL
  const navItems = [
    {
      label: "CARDÁPIO",
      href: "/",
      icon: BookOpen,
      active: pathname === "/" || pathname.startsWith("/pedido"),
    },
    {
      label: "FESTA",
      href: "/festa",
      icon: Calendar,
      active: pathname === "/festa",
    },
    {
      label: "PEDIDOS",
      href: "/meus-pedidos",
      icon: ClipboardList,
      active: pathname === "/meus-pedidos",
    },
    {
      label: "PERFIL",
      href: "/perfil",
      icon: User,
      active: pathname === "/perfil",
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 mx-auto max-w-[440px] w-full z-30 bg-[#FFFDF9] border-t border-[#EBDCCF] shadow-lg">
      <div className="w-full grid grid-cols-4 h-16">




        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-[#E05A36] font-extrabold"
                  : "text-[#8C7367] hover:text-[#3C1F15] font-semibold"
              }`}
            >
              {item.label === "PERFIL" ? (
                <CustomerAvatar size="sm" className={isActive ? "text-[#E05A36]" : "text-[#8C7367]"} />
              ) : (
                <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
              )}
              <span className="text-[10px] tracking-wider uppercase leading-none font-bold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

