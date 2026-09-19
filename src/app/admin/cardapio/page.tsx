"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Megaphone,
  Search,
  DollarSign,
  Zap,
  Check,
  Save,
  Eye,
  MessageCircle,
  Instagram,
  ShoppingBag,
  Clock,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Settings } from "@/types";

export default function AdminCatalogSettingsPage() {
  const [bannerActive, setBannerActive] = useState(true);
  const [bannerText, setBannerText] = useState("Encomendas para o fim de semana até sexta-feira às 18h.");
  const [bannerStart, setBannerStart] = useState("20/09/2026 - 08:00");
  const [bannerEnd, setBannerEnd] = useState("25/09/2026 - 18:00");

  const [showSearch, setShowSearch] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [fastLoading, setFastLoading] = useState(true);

  const [actionsActive, setActionsActive] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("+55 (81) 98765-4321");
  const [instagramUrl, setInstagramUrl] = useState("https://www.instagram.com/deli.salgados");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.settings) {
          const s = data.settings;
          if (s.banner_text) setBannerText(s.banner_text);
          if (typeof s.catalog_show_search === "boolean") setShowSearch(s.catalog_show_search);
          if (typeof s.catalog_show_prices === "boolean") setShowPrices(s.catalog_show_prices);
          if (s.contact_whatsapp) setWhatsappNumber(s.contact_whatsapp);
          if (s.contact_instagram) setInstagramUrl(s.contact_instagram);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banner_text: bannerText,
          catalog_show_search: showSearch,
          catalog_show_prices: showPrices,
          contact_whatsapp: whatsappNumber,
          contact_instagram: instagramUrl,
        }),
      });
      if (res.ok) {
        setFeedback("Configurações do cardápio salvas com sucesso!");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#3C1F15]">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2E7D47] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C7367]">
            PAINEL ADMINISTRATIVO &gt; TELA 14
          </div>
          <h1 className="text-2xl font-serif italic font-black text-[#3C1F15] tracking-tight mt-0.5">
            Apresentação do Cardápio Público
          </h1>
          <p className="text-xs text-[#7A6357] mt-1 max-w-xl leading-relaxed">
            Controle a visibilidade de recursos, avisos em destaque e canais de contato exibidos aos clientes no cardápio web.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] transition shadow-2xs"
          >
            <Eye size={13} />
            <span>Pré-Visualizar</span>
          </a>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A93B1F] hover:bg-[#942B14] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <Save size={13} className="text-white" />
            <span>{saving ? "Salvando..." : "Salvar Configurações"}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Config Cards */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Aviso Fixado no Topo */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FAF3E8] text-[#DF5F45] flex items-center justify-center text-xs">
                  📢
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                    Aviso Fixado no Topo
                  </h2>
                  <span className="text-[10px] text-[#9E8679]">
                    Banner urgente de informação para clientes na abertura do cardápio
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBannerActive(!bannerActive)}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                  bannerActive ? "bg-[#E5F7EB] text-[#1FAA52]" : "bg-[#F3EDE6] text-[#8C7367]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${bannerActive ? "bg-[#1FAA52]" : "bg-[#8C7367]"}`} />
                <span>{bannerActive ? "ATIVO" : "INATIVO"}</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357]">
                  TEXTO DE COMUNICAÇÃO EM DESTAQUE
                </label>
                <span className="text-[10px] text-[#9E8679]">
                  {bannerText.length}/120 caracteres
                </span>
              </div>
              <input
                type="text"
                value={bannerText}
                maxLength={120}
                onChange={(e) => setBannerText(e.target.value)}
                className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                  📅 INÍCIO DA EXIBIÇÃO
                </label>
                <input
                  type="text"
                  value={bannerStart}
                  onChange={(e) => setBannerStart(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-1.5 text-xs text-[#3C1F15] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                  ⏰ TÉRMINO AUTOMÁTICO
                </label>
                <input
                  type="text"
                  value={bannerEnd}
                  onChange={(e) => setBannerEnd(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-1.5 text-xs text-[#3C1F15] focus:outline-none"
                />
              </div>
            </div>

            {/* Orange Banner Preview */}
            <div className="p-3 rounded-2xl bg-[#E05A36] text-white flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold truncate pr-2">
                <span>📢</span>
                <span className="truncate">{bannerText}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider shrink-0">
                PRÉVIA NO CARDÁPIO
              </span>
            </div>
          </div>

          {/* Card 2: Controles de Exibição Pública */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
            <div className="pb-2 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FAF3E8] text-[#DF5F45] flex items-center justify-center text-xs">
                  ⚙
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                    Controles de Exibição Pública
                  </h2>
                  <span className="text-[10px] text-[#9E8679]">
                    Personalize elementos operacionais que os clientes veem na navegação
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 divide-y divide-[#F6ECE2]">
              {/* Item 1 */}
              <div className="flex items-center justify-between pt-2 first:pt-0">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#FFF8EE] text-[#DF5F45] flex items-center justify-center text-xs mt-0.5 shrink-0">
                    🔍
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#3C1F15] block">
                      Exibir barra de pesquisa de salgados
                    </span>
                    <span className="text-[11px] text-[#7A6357]">
                      Permite busca rápida de coxinhas, empadas e quiches por digitação direta.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSearch(!showSearch)}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition duration-200 ease-in-out shrink-0 ${
                    showSearch ? "bg-[#DF5F45]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition duration-200 ease-in-out ${
                      showSearch ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#FFF8EE] text-[#DF5F45] flex items-center justify-center text-xs mt-0.5 shrink-0">
                    🏷
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#3C1F15] block">
                      Exibir preços dos produtos publicamente
                    </span>
                    <span className="text-[11px] text-[#7A6357]">
                      Mostra valores de cento e dúzia nos cards (Frito / Congelado). Quando desligado, exibe botão "Consultar Valores".
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrices(!showPrices)}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition duration-200 ease-in-out shrink-0 ${
                    showPrices ? "bg-[#DF5F45]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition duration-200 ease-in-out ${
                      showPrices ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#FFF8EE] text-[#DF5F45] flex items-center justify-center text-xs mt-0.5 shrink-0">
                    ⚡
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[#3C1F15] block">
                      Carregar primeiro fotos em baixa resolução (alta velocidade de carregamento)
                    </span>
                    <span className="text-[11px] text-[#7A6357]">
                      Mantém excelente velocidade mesmo no 4G dos clientes, garantindo que o catálogo nunca trave.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFastLoading(!fastLoading)}
                  className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition duration-200 ease-in-out shrink-0 ${
                    fastLoading ? "bg-[#DF5F45]" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition duration-200 ease-in-out ${
                      fastLoading ? "translate-x-4.5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Grupo de Ações Especiais e Redes Sociais */}
          <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FAF3E8] text-[#1FAA52] flex items-center justify-center text-xs">
                  💬
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                    Grupo de Ações Especiais e Redes Sociais
                  </h2>
                  <span className="text-[10px] text-[#9E8679]">
                    Conexão direta com canais de atendimento para pedidos de eventos
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionsActive(!actionsActive)}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                  actionsActive ? "bg-[#E5F7EB] text-[#1FAA52]" : "bg-[#F3EDE6] text-[#8C7367]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${actionsActive ? "bg-[#1FAA52]" : "bg-[#8C7367]"}`} />
                <span>{actionsActive ? "ATIVO" : "INATIVO"}</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#FFFBF7] border border-[#F4E8DB]">
              <div className="flex items-start gap-2 text-xs">
                <span className="text-base text-[#DF5F45] leading-none shrink-0">📢</span>
                <div>
                  <span className="font-bold text-[#3C1F15] block">
                    Bloco com Dúvidas em "Precisa de um cardápio especial?"
                  </span>
                  <span className="text-[11px] text-[#7A6357]">
                    Exibe call-out para orçamentos, coffee-breaks empresariais e grandes festas familiares.
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                  💬 WHATSAPP PARA BOTÃO PÚBLICO ("FALE NO WHATSAPP")
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none"
                />
                <span className="text-[10px] text-[#9E8679] mt-0.5 block">
                  Disparos automáticos com resumo dos pedidos iniciados no cardápio.
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7A6357] block mb-1">
                  📸 INSTAGRAM DA DELI (BOTÃO PÚBLICO "SIGA NO INSTAGRAM")
                </label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl px-3 py-2 text-xs font-bold text-[#3C1F15] focus:outline-none"
                />
                <span className="text-[10px] text-[#9E8679] mt-0.5 block">
                  Link direto no rodapé e no cabeçalho do cardápio para prova social.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Mobile Simulator & Integrations */}
        <div className="lg:col-span-4 space-y-4">
          {/* Mobile Simulator Card */}
          <div className="bg-white p-4 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#F4E8DB]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#3C1F15]">
                <span>📱</span>
                <span>Amostra da Visão Pública</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FCECE8] text-[#DF5F45] text-[9px] font-bold uppercase tracking-wider">
                MOBILE PREVIEW
              </span>
            </div>

            {/* Mobile Screen Mockup Frame */}
            <div className="border-2 border-[#EBDCCF] rounded-2xl p-2.5 bg-[#FFFDF9] space-y-2 text-xs shadow-inner">
              {/* Notice Banner */}
              {bannerActive && (
                <div className="bg-[#E05A36] text-white text-[9px] font-bold px-2 py-1 rounded-lg text-center leading-tight">
                  {bannerText}
                </div>
              )}

              {/* Brand Header */}
              <div className="flex items-center justify-between px-1 py-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#E05A36] text-white flex items-center justify-center text-[10px]">
                    👨‍🍳
                  </div>
                  <span className="font-serif italic font-bold text-xs text-[#3C1F15]">
                    Deli Salgados
                  </span>
                </div>
                <ShoppingBag size={14} className="text-[#3C1F15]" />
              </div>

              {/* Search Bar */}
              {showSearch && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFF8EE] border border-[#E8D9CB] text-[10px] text-[#8C7367]">
                  <Search size={11} />
                  <span>Buscar salgados da Deli...</span>
                </div>
              )}

              {/* Product Preview Card */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-[#F0E2D2]">
                <div className="w-12 h-12 rounded-lg bg-[#FAF3E8] relative overflow-hidden shrink-0">
                  <Image
                    src="/products/coxinha.jpg"
                    alt="Coxinha"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-[#3C1F15] truncate">
                    Cento de Coxinha...
                  </div>
                  <div className="text-[9px] text-[#7A6357] truncate">
                    Frango cremoso c/ catupiry
                  </div>
                  {showPrices && (
                    <div className="text-[10px] font-black text-[#DF5F45]">
                      R$ 140,00 <span className="text-[8px] font-normal text-[#8C7367]">(cento)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Menu Block */}
              {actionsActive && (
                <div className="p-2 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] space-y-1 text-center">
                  <div className="text-[10px] font-bold text-[#3C1F15]">
                    Precisa de um cardápio especial?
                  </div>
                  <p className="text-[8px] text-[#7A6357] leading-tight">
                    Faça seu projeto personalizado conosco para festas e eventos corporativos.
                  </p>
                  <button
                    type="button"
                    className="w-full py-1 rounded-lg bg-[#2E7D47] text-white text-[9px] font-bold flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <MessageCircle size={10} />
                    <span>Fale no WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    className="w-full py-1 rounded-lg bg-white border border-[#EBDCCF] text-[#3C1F15] text-[9px] font-bold flex items-center justify-center gap-1"
                  >
                    <Instagram size={10} className="text-[#DF5F45]" />
                    <span>Siga no Instagram</span>
                  </button>
                </div>
              )}
            </div>

            <span className="text-[9px] text-[#9E8679] block text-center">
              Atualização instantânea conforme você edita os campos ao lado.
            </span>
          </div>

          {/* Integrations Status Card */}
          <div className="bg-white p-4 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3C1F15] block pb-1 border-b border-[#F4E8DB]">
              Status das Integrações
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#7A6357]">Meta WhatsApp Cloud API</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[9px] font-bold">
                  Conectado
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#7A6357]">Instagram Graph API</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[9px] font-bold">
                  Ativo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#7A6357]">CDN de Imagens do Menu</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[9px] font-bold">
                  Sincronizado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

