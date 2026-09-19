"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, MessageCircle, CheckCircle2 } from "lucide-react";
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

  const whatsappMsg = "Olá, Deli Salgados! Gostaria de fazer um orçamento personalizado para um evento/festa:";
  const whatsappUrl = buildWhatsAppLink(settings?.whatsapp_number || "", whatsappMsg);

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
          <h1 className="text-base font-bold leading-tight">Festas & Eventos</h1>
          <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
            Encomendas especiais para celebrações
          </span>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Banner */}
        <div className="bg-gradient-to-br from-[#FFF4E8] to-[#FDE8D4] p-5 rounded-3xl border border-[#F0D5BE] shadow-xs text-center">
          <div className="w-12 h-12 rounded-full bg-[#E05A36] text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
            <Sparkles size={22} />
          </div>
          <h2 className="text-lg font-bold text-[#3C1F15]">
            Salgados Finos & Tradicionais
          </h2>
          <p className="text-xs text-[#7A6357] mt-1.5 leading-relaxed">
            Personalize quantidades, mescle sabores nobres como Camarão, Bacalhau e Queijo do Reino, ou solicite suporte para calcular o volume ideal para seus convidados.
          </p>
        </div>

        {/* Highlights */}
        <div className="bg-white p-5 rounded-3xl border border-[#EBDCCF] shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C5237]">
            Diferenciais Deli Salgados
          </h3>
          <ul className="space-y-2.5 text-xs text-[#614439]">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#1FAA52] shrink-0 mt-0.5" />
              <span>Receitas artesanais com ingredientes selecionados e massa finíssima.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#1FAA52] shrink-0 mt-0.5" />
              <span>Opção de entrega em bandejas organizadas ou congelados prontos para fritar.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-[#1FAA52] shrink-0 mt-0.5" />
              <span>Linha folhada e mini quiches ideais para coquetéis e recepções corporativas.</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="pt-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-sm font-extrabold shadow-lg flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
            >
              <MessageCircle size={18} className="fill-white stroke-none" />
              <span>Solicitar Orçamento no WhatsApp</span>
            </a>
          ) : (
            <Link
              href="/"
              className="w-full py-4 px-4 rounded-2xl bg-[#3C1F15] text-white text-sm font-extrabold text-center block shadow"
            >
              Ver Todos os Itens do Cardápio
            </Link>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
