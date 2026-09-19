"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Check,
  Save,
  RotateCcw,
  Store,
  Phone,
  Instagram,
  MapPin,
  Shield,
  Lock,
  MessageCircle,
  Users,
  Plus,
  Edit2,
  Trash2,
  ExternalLink
} from "lucide-react";
import { Settings } from "@/types";

export default function AdminSettingsPage() {
  const [businessName, setBusinessName] = useState("Deli Salgados");
  const [whatsappNumber, setWhatsappNumber] = useState("(81) 98765-4321");
  const [instagramUrl, setInstagramUrl] = useState("https://www.instagram.com/deli.salgados");
  const [address, setAddress] = useState("Rua das Camélias 112 - Bairro Jardim, São Paulo - SP");

  const [pickupInfo, setPickupInfo] = useState("Retirada no balcão com agendamento prévio de horário.");
  const [deliveryInfo, setDeliveryInfo] = useState("Entregas realizadas por parceiro sob consulta de frete direto no WhatsApp.");

  const [clientInitialMsg, setClientInitialMsg] = useState("Olá, Deli Salgados! Gostaria de solicitar este pedido:\n[itens]\nModalidade: [retirada/retirada]");
  const [attendantConfirmMsg, setAttendantConfirmMsg] = useState("Olá! Recebemos seu pedido com muito carinho aqui na Deli. Nossa equipe já confirmou a disponibilidade para a data desejada. Segue a chave Pix para confirmação da reserva:");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.settings) {
          const s = data.settings;
          if (s.business_name) setBusinessName(s.business_name);
          if (s.contact_whatsapp) setWhatsappNumber(s.contact_whatsapp);
          if (s.contact_instagram) setInstagramUrl(s.contact_instagram);
          if (s.pickup_information) setPickupInfo(s.pickup_information);
          if (s.delivery_information) setDeliveryInfo(s.delivery_information);
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
          business_name: businessName,
          contact_whatsapp: whatsappNumber,
          contact_instagram: instagramUrl,
          pickup_information: pickupInfo,
          delivery_information: deliveryInfo,
        }),
      });
      if (res.ok) {
        setFeedback("Configurações salvas com sucesso!");
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
            PAINEL ADMINISTRATIVO &gt; CONFIGURAÇÕES
          </div>
          <h1 className="text-2xl font-serif italic font-black text-[#3C1F15] tracking-tight mt-0.5">
            Configurações Gerais da Deli
          </h1>
          <p className="text-xs text-[#7A6357] mt-1 max-w-xl leading-relaxed">
            Parâmetros operacionais da cozinha, mensagens padrão e controle de acesso.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs font-bold text-[#7A6357] hover:bg-[#FAF3E8] transition shadow-2xs"
          >
            <RotateCcw size={13} />
            <span>Descartar</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A93B1F] hover:bg-[#942B14] text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
          >
            <Save size={13} className="text-white" />
            <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Empresa & Contato + Ativos Oficiais */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Card 1 (7 cols): Empresa & Contato Oficial */}
        <div className="lg:col-span-7 bg-white p-4 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#F4E8DB]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF3E8] text-[#DF5F45] flex items-center justify-center text-xs">
                🏪
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Empresa &amp; Contato Oficial
                </h2>
                <span className="text-[9px] text-[#9E8679]">IDENTIDADE PÚBLICA DO NEGÓCIO</span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[9px] font-bold">
              ✓ Ativo no Cardápio
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#7A6357] block mb-0.5">
                NOME COMERCIAL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                />
                <Store size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C7367]" />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#7A6357] block mb-0.5">
                WHATSAPP OFICIAL DE VENDAS
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#DF5F45]"
                />
                <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C7367]" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#7A6357] block mb-0.5">
                PERFIL OFICIAL NO INSTAGRAM
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#3C1F15] focus:outline-none"
                />
                <Instagram size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C7367]" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#7A6357] block mb-0.5">
                ENDEREÇO DA COZINHA / PONTO DE RETIRADA
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#FFFDF9] border border-[#E8D9CB] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#3C1F15] focus:outline-none"
                />
                <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C7367]" />
              </div>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#FFF8EE] border border-[#F0E2D2] flex items-center gap-2 text-[9px] text-[#7A6357]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1FAA52]" />
            <span>Exibido automaticamente no rodapé do cardápio e no link de compartilhamento.</span>
          </div>
        </div>

        {/* Card 2 (5 cols): Ativos Oficiais da Marca */}
        <div className="lg:col-span-5 bg-white p-4 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#F4E8DB]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF3E8] text-[#DF5F45] flex items-center justify-center text-xs">
                🛡
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Ativos Oficiais da Marca
                </h2>
                <span className="text-[9px] text-[#9E8679]">IDENTIDADE VISUAL E PROTEÇÃO</span>
              </div>
            </div>
            <Lock size={12} className="text-[#8C7367]" />
          </div>

          <div className="space-y-2">
            {/* Logo Row */}
            <div className="p-2.5 rounded-2xl bg-[#FFF8EE] border border-[#EBDCCF] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAF3E8] border border-[#EBDCCF] flex items-center justify-center text-base">
                  👨‍🍳
                </div>
                <div>
                  <span className="text-xs font-bold text-[#3C1F15] block">
                    Logomarca Oficial
                  </span>
                  <span className="text-[8px] text-[#9E8679]">
                    PNG TRANSPARENTE • 1024 × 1024 PX
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[8px] font-bold">
                  Principal no Menu / Header
                </span>
                <Lock size={11} className="text-[#1FAA52]" />
              </div>
            </div>

            {/* Pattern Row */}
            <div className="p-2.5 rounded-2xl bg-[#FFF8EE] border border-[#EBDCCF] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FAF3E8] border border-[#EBDCCF] flex items-center justify-center text-xs font-mono text-[#8C7367]">
                  :::
                </div>
                <div>
                  <span className="text-xs font-bold text-[#3C1F15] block">
                    Pattern Tonal de Fundo
                  </span>
                  <span className="text-[8px] text-[#9E8679]">
                    TEXTURA ARTESANAL • OPACIDADE 3%
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FCECE8] text-[#DF5F45] text-[8px] font-bold">
                Padrão
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-[#FFFBF7] border border-[#F4E8DB] text-[9px] text-[#7A6357] leading-tight">
            Arquivos mantidos sob licença de propriedade e fidelidade visual ao método impresso.
          </div>
        </div>
      </div>

      {/* Row 2: Modalidades de Atendimento + Mensagens Padrão */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Card 3 (6 cols): Modalidades de Atendimento */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF3E8] text-[#DF5F45] flex items-center justify-center text-xs">
                📦
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Modalidades de Atendimento
                </h2>
                <span className="text-[10px] text-[#9E8679]">POLÍTICA DE RETIRADA E ENTREGAS</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[10px] font-bold">
              2 Habilitadas
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#E8D9CB] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3C1F15] flex items-center gap-1.5">
                  <span>🏠</span>
                  <span>Retirada no Balcão</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[9px] font-bold">
                  Habilitado
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C7367] block">
                INSTRUÇÕES AOS CLIENTES NO CARDÁPIO
              </span>
              <input
                type="text"
                value={pickupInfo}
                onChange={(e) => setPickupInfo(e.target.value)}
                className="w-full bg-[#FFF8EE] border border-[#EBDCCF] rounded-xl px-3 py-1.5 text-xs text-[#3C1F15]"
              />
            </div>

            <div className="p-3 rounded-2xl bg-[#FFFDF9] border border-[#E8D9CB] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3C1F15] flex items-center gap-1.5">
                  <span>🛵</span>
                  <span>Expressa/Entrega a Fixo</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#E5F7EB] text-[#1FAA52] text-[9px] font-bold">
                  Habilitado
                </span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C7367] block">
                INFORMAÇÕES DE FRETE VIA WHATSAPP
              </span>
              <input
                type="text"
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                className="w-full bg-[#FFF8EE] border border-[#EBDCCF] rounded-xl px-3 py-1.5 text-xs text-[#3C1F15]"
              />
            </div>
          </div>

          <span className="text-[10px] text-[#9E8679] block">
            Taxas calculadas individualmente conforme localização do frete.
          </span>
        </div>

        {/* Card 4 (6 cols): Mensagens Padrão do WhatsApp */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF3E8] text-[#1FAA52] flex items-center justify-center text-xs">
                💬
              </span>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                  Mensagem Padrão do WhatsApp
                </h2>
                <span className="text-[10px] text-[#9E8679]">COMUNICAÇÃO HUMANIZADA</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#FAF3E8] text-[#8C7367] text-[10px] font-bold uppercase tracking-wider">
              DISPARO NATIVO
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#7A6357]">
                  TEXTO INICIAL DO CLIENTE (GERADO PELO CARDÁPIO)
                </span>
                <span className="text-[9px] text-[#9E8679]">
                  Variáveis: [itens], [total]
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs text-[#3C1F15] leading-relaxed">
                Olá, Deli Salgados! Gostaria de solicitar este pedido:<br />
                <span className="text-[#8C7367]">[itens]</span><br />
                Modalidade: [retirada/retirada]
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#7A6357]">
                  CONFIRMAÇÃO DO ATENDENTE (RESPOSTA PRONTA)
                </span>
                <span className="text-[9px] text-[#1FAA52] font-bold">
                  Pronta resposta
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FFF8EE] border border-[#EBDCCF] text-xs text-[#3C1F15] leading-relaxed">
                Olá! Recebemos seu pedido com muito carinho aqui na Deli. Nossa equipe já confirmou a disponibilidade para a data desejada. Segue a chave Pix para confirmação da reserva:
              </div>
            </div>
          </div>

          <span className="text-[10px] text-[#9E8679] block">
            As mensagens garantem agilidade no atendimento de festas de fim de semana.
          </span>
        </div>
      </div>

      {/* Row 3: Acessos & Equipe da Cozinha (12 cols) */}
      <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#F4E8DB]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#FAF3E8] text-[#DF5F45] flex items-center justify-center text-xs">
              👥
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
                Acessos &amp; Equipe da Cozinha
              </h2>
              <span className="text-[10px] text-[#9E8679]">
                OPERADORES AUTORIZADOS DO PAINEL DELI SALGADOS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#FAF3E8] text-[#8C7367] text-[10px] font-bold">
              SEGURANÇA INTERNA ATIVA
            </span>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#52291D] hover:bg-[#3D1E15] text-white text-xs font-bold transition shadow-xs"
            >
              <Plus size={13} className="text-[#F8A79B]" />
              <span>+ Convidar Usuário</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3C1F15]">
            <thead className="bg-[#FAF3E8] text-[#8C7367] uppercase font-bold text-[10px] tracking-wider border-b border-[#EEDFCE]">
              <tr>
                <th className="py-2.5 px-4">USUÁRIO / COLABORADOR</th>
                <th className="py-2.5 px-4">NÍVEL DE ACESSO</th>
                <th className="py-2.5 px-4">PERMISSÕES PRINCIPAIS</th>
                <th className="py-2.5 px-4">ÚLTIMO ACESSO</th>
                <th className="py-2.5 px-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F6ECE2]">
              {/* User 1 */}
              <tr className="hover:bg-[#FFFDF9]">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#DF5F45] text-white flex items-center justify-center font-bold text-xs">
                      DG
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#3C1F15]">Deli Gestão</div>
                      <div className="text-[10px] text-[#9E8679]">operacao@delisalgados.com.br</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FCECE8] text-[#DF5F45] text-[10px] font-bold uppercase tracking-wider">
                    ADMINISTRADOR GERAL
                  </span>
                </td>
                <td className="py-3 px-4 text-[11px] text-[#7A6357]">
                  Acesso Total: Cardápio, Equipe, Configurações e Finanças
                </td>
                <td className="py-3 px-4">
                  <span className="text-[11px] text-[#1FAA52] font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1FAA52]" />
                    <span>Conectado agora</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-[#FAF3E8] text-[#8C7367] text-[10px] font-bold">
                    Você
                  </span>
                </td>
              </tr>

              {/* User 2 */}
              <tr className="hover:bg-[#FFFDF9]">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#EBDCCF] text-[#7A6357] flex items-center justify-center font-bold text-xs">
                      AB
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#3C1F15]">Atendente Balcão</div>
                      <div className="text-[10px] text-[#9E8679]">balcao@delisalgados.com.br</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FFF8EE] border border-[#EBDCCF] text-[#7A6357] text-[10px] font-bold uppercase tracking-wider">
                    OPERADOR
                  </span>
                </td>
                <td className="py-3 px-4 text-[11px] text-[#7A6357]">
                  Produtos, Preços, Pedidos e Mensagens
                </td>
                <td className="py-3 px-4 text-[11px] text-[#9E8679]">
                  Hoje às 11:42
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" className="p-1 text-[#8C7367] hover:text-[#3C1F15]">
                      <Edit2 size={13} />
                    </button>
                    <button type="button" className="p-1 text-[#8C7367] hover:text-[#C04220]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info row */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F4E8DB] text-[10px] text-[#7A6357]">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-[#DF5F45]" />
            <span>Acesso seguro protegido por autenticação de dois fatores no WhatsApp dos administradores.</span>
          </div>
          <span className="font-bold text-[#8C7367]">2 DE 5 USUÁRIOS ATIVOS</span>
        </div>
      </div>
    </div>
  );
}

