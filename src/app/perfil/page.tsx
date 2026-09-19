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
    <div className="w-full max-w-[440px] lg:max-w-none mx-auto min-h-screen bg-[#FFFDF9] shadow-2xl lg:shadow-none flex flex-col pb-24 lg:pb-16 relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-b from-[#E25C37] via-[#DF532E] to-[#D5451F] text-white shadow-md">
        <div className="w-full max-w-[1000px] mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <img
              src="/deli-logo-cream-official.png"
              alt="Deli Salgados"
              className="h-9 w-auto object-contain select-none"
            />
            <div>
              <h1 className="text-base lg:text-lg font-bold leading-tight">Perfil & Informações</h1>
              <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
                Deli Salgados
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="hidden lg:inline-flex px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
          >
            Voltar ao Cardápio
          </Link>
        </div>
      </header>

      <main className="w-full max-w-[440px] lg:max-w-[640px] mx-auto p-4 lg:p-8 space-y-4 flex-1">
        {/* Brand Card with canonical official logo */}
        <div className="bg-white p-6 lg:p-8 rounded-3xl border border-[#EBDCCF] shadow-xs text-center space-y-3">
          <img
            src="/deli-logo-coral-official.png"
            alt="Deli Salgados"
            className="h-20 w-auto mx-auto object-contain drop-shadow-xs select-none"
          />
          <p className="text-xs lg:text-sm text-[#7A6357] leading-relaxed max-w-sm mx-auto font-medium">
            {settings?.business_name || "Deli Salgados"} — tradição e sabor artesanal para eventos, comemorações e momentos especiais.
          </p>
        </div>

        {/* Contact info & channels */}
        <div className="bg-white p-5 rounded-3xl border border-[#EBDCCF] shadow-xs space-y-3.5 text-xs">
          <h3 className="font-bold text-[#3C1F15] uppercase text-[11px] tracking-wider">
            Canais de Atendimento
          </h3>

          {/* WhatsApp Row */}
          <div className="flex items-center gap-2.5 text-[#614439] py-1">
            <Phone size={17} className="text-[#E05A36] shrink-0" />
            <span>
              WhatsApp:{" "}
              {settings?.whatsapp_number
                ? settings.whatsapp_number
                : "Contato temporariamente indisponível"}
            </span>
          </div>

          {/* Address Row (only shown if present) */}
          {settings?.address && (
            <div className="flex items-center gap-2.5 text-[#614439] py-1">
              <MapPin size={17} className="text-[#E05A36] shrink-0" />
              <span>{settings.address}</span>
            </div>
          )}

          {/* Instagram CTA Row: Section 9 & 15 */}
          {settings?.instagram_url && (
            <div className="pt-2 border-t border-[#F4E8DB]">
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF4E8] to-[#FFF0E2] border border-[#F8D3BE] hover:bg-[#FFE8D6] transition shadow-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#E05A36] text-white flex items-center justify-center shadow-xs">
                    <Instagram size={17} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-[#8C5237] uppercase font-bold tracking-wider">
                      Instagram Oficial
                    </div>
                    <div className="text-xs font-bold text-[#3C1F15]">
                      @deli.salgados
                    </div>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-[#E05A36] group-hover:text-[#C94724] tracking-wider">
                  SEGUIR @DELI.SALGADOS &gt;
                </span>
              </a>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
