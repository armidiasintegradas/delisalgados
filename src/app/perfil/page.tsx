"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Phone, Instagram, MapPin } from "lucide-react";
import { BottomNav } from "@/components/public/BottomNav";
import { Logo } from "@/components/public/Logo";
import { Settings } from "@/types";

export default function PerfilPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col pb-24 max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-b from-[#E25C37] via-[#DF532E] to-[#D5451F] text-white px-4 py-3.5 shadow-md flex items-center gap-2.5">
        <Link
          href="/"
          className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-base font-bold leading-tight">Perfil & Informações</h1>
          <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
            Deli Salgados
          </span>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <div className="bg-white p-6 rounded-3xl border border-[#EBDCCF] shadow-xs text-center space-y-3">
          <Logo size="md" showText={true} />
          <p className="text-xs text-[#7A6357] leading-relaxed max-w-xs mx-auto">
            {settings?.business_name || "Deli Salgados"} — tradição e sabor artesanal para eventos, comemorações e momentos especiais.
          </p>
        </div>

        {/* Contact info */}
        <div className="bg-white p-4 rounded-3xl border border-[#EBDCCF] shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-[#3C1F15] uppercase text-[11px] tracking-wider">
            Canais de Atendimento
          </h3>
          <div className="flex items-center gap-2.5 text-[#614439]">
            <Phone size={16} className="text-[#E05A36]" />
            <span>WhatsApp: {settings?.whatsapp_number || "Configurar no Admin"}</span>
          </div>
          {settings?.instagram_url && (
            <div className="flex items-center gap-2.5 text-[#614439]">
              <Instagram size={16} className="text-[#E1306C]" />
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#3C1F15]"
              >
                @deli.salgados
              </a>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-[#614439]">
            <MapPin size={16} className="text-[#E05A36]" />
            <span>{settings?.address || "Recife, PE"}</span>
          </div>
        </div>

        {/* Admin portal shortcut */}
        <div className="pt-4">
          <Link
            href="/admin"
            className="w-full p-4 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-white flex items-center justify-between shadow-md transition"
          >
            <div className="flex items-center gap-2.5">
              <Shield size={18} className="text-[#F8A79B]" />
              <div className="text-left">
                <div className="text-xs font-bold">Painel Administrativo</div>
                <div className="text-[10px] text-[#E8D9CB]">
                  Gestão de catálogo, preços, pedidos e estoque
                </div>
              </div>
            </div>
            <span className="text-xs text-[#F8A79B] font-bold">Acessar &gt;</span>
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
