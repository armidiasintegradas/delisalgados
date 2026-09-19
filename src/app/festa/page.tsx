"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, MessageCircle, Instagram } from "lucide-react";
import { BottomNav } from "@/components/public/BottomNav";
import { Settings } from "@/types";
import { buildWhatsAppLink } from "@/lib/formatters";

export default function FestaPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      });
  }, []);

  const whatsappMsg =
    "Olá, Deli Salgados! Gostaria de fazer um orçamento personalizado para um evento/festa:";
  const whatsappUrl = settings?.whatsapp_number
    ? buildWhatsAppLink(settings.whatsapp_number, whatsappMsg)
    : "";

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
              <h1 className="text-base lg:text-lg font-bold leading-tight">Festas & Eventos</h1>
              <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
                Encomendas especiais para celebrações
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

      {/* Main Container */}
      <main className="w-full max-w-[440px] lg:max-w-[800px] mx-auto p-4 lg:p-8 space-y-5 flex-1 flex flex-col justify-center">
        {/* Safe Copy Content Box */}
        <div className="bg-gradient-to-br from-[#FFF4E8] to-[#FDE8D4] p-6 lg:p-10 rounded-3xl border border-[#F0D5BE] shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#E05A36] text-white flex items-center justify-center mx-auto shadow-sm">
            <Sparkles size={26} />
          </div>
          <h2 className="font-display text-xl lg:text-2xl font-extrabold text-[#3C1F15]">
            Festas & Eventos
          </h2>
          <p className="text-sm text-[#7A6357] leading-relaxed max-w-lg mx-auto">
            Precisa de um cardápio especial para sua festa, casamento, aniversário ou confraternização? Fale com a Deli para montar sua encomenda.
          </p>
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-sm font-extrabold uppercase tracking-wide shadow-lg flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
            >
              <MessageCircle size={20} className="fill-white stroke-none" />
              <span>Solicitar Orçamento no WhatsApp</span>
            </a>
          ) : (
            <div className="w-full p-4 rounded-2xl bg-[#FFF4E8] border border-[#E8D9CB] text-center text-[#7A6357] text-xs font-semibold">
              Contato temporariamente indisponível
            </div>
          )}

          {settings?.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-[#FFFDF9] text-xs font-extrabold uppercase tracking-wide shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] border border-[#EAD8C7]"
            >
              <Instagram size={17} className="text-[#E05A36]" />
              <span>Seguir no Instagram (@deli.salgados)</span>
            </a>
          )}

          <Link
            href="/"
            className="w-full py-3 rounded-2xl bg-white hover:bg-[#FFF9E6] border border-[#EAD8C7] text-[#3C1F15] text-xs font-bold uppercase tracking-wide text-center block transition"
          >
            Ver Cardápio Completo
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
