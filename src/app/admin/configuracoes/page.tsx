"use client";

import React, { useState, useEffect } from "react";
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
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Settings } from "@/types";

export default function AdminSettingsPage() {
  const [businessName, setBusinessName] = useState("Deli Salgados");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("https://www.instagram.com/deli.salgados");
  const [address, setAddress] = useState("");
  const [pickupInfo, setPickupInfo] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [whatsappOpeningMsg, setWhatsappOpeningMsg] = useState("");
  const [whatsappClosingMsg, setWhatsappClosingMsg] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixReceiverName, setPixReceiverName] = useState("");
  const [pixReceiverCity, setPixReceiverCity] = useState("RECIFE");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            const s = data.settings;
            if (s.business_name) setBusinessName(s.business_name);
            if (s.whatsapp_number) setWhatsappNumber(s.whatsapp_number);
            if (s.instagram_url) setInstagramUrl(s.instagram_url);
            if (s.address) setAddress(s.address);
            if (s.pickup_information) setPickupInfo(s.pickup_information);
            if (s.delivery_information) setDeliveryInfo(s.delivery_information);
            if (s.whatsapp_opening_message) setWhatsappOpeningMsg(s.whatsapp_opening_message);
            if (s.whatsapp_closing_message) setWhatsappClosingMsg(s.whatsapp_closing_message);
            if (s.pix_key) setPixKey(s.pix_key);
            if (s.pix_receiver_name) setPixReceiverName(s.pix_receiver_name);
            if (s.pix_receiver_city) setPixReceiverCity(s.pix_receiver_city);
          }
        }
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          whatsapp_number: whatsappNumber.trim(),
          instagram_url: instagramUrl.trim(),
          address: address.trim(),
          pickup_information: pickupInfo.trim(),
          delivery_information: deliveryInfo.trim(),
          whatsapp_opening_message: whatsappOpeningMsg,
          whatsapp_closing_message: whatsappClosingMsg,
          pix_key: pixKey.trim(),
          pix_receiver_name: pixReceiverName.trim(),
          pix_receiver_city: pixReceiverCity.trim().toUpperCase(),
        }),
      });

      if (res.ok) {
        setFeedback("Configurações salvas com sucesso!");
        setTimeout(() => setFeedback(null), 3000);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Erro ao salvar configurações.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Falha na comunicação com o servidor.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-[#3C1F15]">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1FAA52] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check size={16} />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C7367]">
            PAINEL GESTÃO · CONFIGURAÇÕES OFICIAIS
          </div>
          <h1 className="text-2xl font-display font-black text-[#3C1F15] tracking-tight mt-0.5">
            Configurações da Deli
          </h1>
          <p className="text-xs text-[#7A6357]">
            Gerencie os canais de contato, mensagens padrão, informações de entrega e dados operacionais.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-[#DF5F45] hover:bg-[#C94E36] text-white text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          <Save size={14} />
          <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
        </button>
      </div>

      {/* WhatsApp Configuration Alert if empty */}
      {!whatsappNumber.trim() && (
        <div className="p-4 bg-[#FFF4E8] border border-[#FADCC7] rounded-3xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#DF5F45] text-white flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={16} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-black text-xs uppercase tracking-wide text-[#DF5F45]">
              WhatsApp da Deli ainda não configurado
            </h3>
            <p className="text-xs text-[#7A6357] leading-relaxed">
              Por motivos de segurança e integridade, os botões públicos de envio e contato por WhatsApp permanecerão temporariamente desativados até que o número oficial seja inserido e salvo abaixo.
            </p>
          </div>
        </div>
      )}

      {/* Row 1: Dados Gerais & Redes Oficiais */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Card 1: Informações do Negócio (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F4E8DB]">
            <Store size={16} className="text-[#DF5F45]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
              Identificação &amp; Canais de Contato
            </h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
                Nome do Negócio
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl px-3 py-2 text-xs text-[#3C1F15] font-semibold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367]">
                  WhatsApp Oficial para Pedidos (com DDI 55)
                </label>
                <span className="text-[10px] text-[#DF5F45] font-bold">
                  {whatsappNumber.trim() ? "Ativo" : "Não configurado"}
                </span>
              </div>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Ex: 5581999999999"
                className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl px-3 py-2 text-xs text-[#3C1F15] font-semibold focus:outline-none"
              />
              <span className="text-[10px] text-[#9E8679] block">
                Somente números com código do país (55) e DDD. Este número receberá as mensagens dos clientes.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
                Perfil Oficial do Instagram
              </label>
              <input
                type="text"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://www.instagram.com/deli.salgados"
                className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl px-3 py-2 text-xs text-[#3C1F15] font-semibold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
                Endereço Físico (se aplicável)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Deixe em branco se for somente sob encomenda/retirada sob agendamento"
                className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl px-3 py-2 text-xs text-[#3C1F15] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Modalidades de Atendimento (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#F4E8DB]">
            <span className="text-base">📦</span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
              Modalidades de Atendimento
            </h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
                Instruções de Retirada no Balcão
              </label>
              <textarea
                rows={2}
                value={pickupInfo}
                onChange={(e) => setPickupInfo(e.target.value)}
                placeholder="Ex: Retirada sob agendamento prévio de horário."
                className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl p-2.5 text-xs text-[#3C1F15] focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
                Informações de Entrega
              </label>
              <textarea
                rows={2}
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                placeholder="Ex: Entrega sob consulta de taxa e rotas disponíveis para seu bairro."
                className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl p-2.5 text-xs text-[#3C1F15] focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Mensagens Padrão do WhatsApp */}
      <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#F4E8DB]">
          <MessageCircle size={16} className="text-[#1FAA52]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
            Mensagens Padrão do Cardápio
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
              Mensagem de Abertura (enviada pelo cliente)
            </label>
            <textarea
              rows={3}
              value={whatsappOpeningMsg}
              onChange={(e) => setWhatsappOpeningMsg(e.target.value)}
              placeholder="Olá, Deli Salgados! Gostaria de enviar uma solicitação de pedido pelo cardápio digital:"
              className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl p-2.5 text-xs text-[#3C1F15] focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
              Mensagem de Fechamento (rodapé da solicitação)
            </label>
            <textarea
              rows={3}
              value={whatsappClosingMsg}
              onChange={(e) => setWhatsappClosingMsg(e.target.value)}
              placeholder="Aguardo confirmação da disponibilidade e do valor final. Obrigado!"
              className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl p-2.5 text-xs text-[#3C1F15] focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* Pix configuration */}
      <div className="bg-white p-5 rounded-3xl border border-[#F0E2D2] shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#F4E8DB]">
          <span className="text-base">💳</span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#3C1F15]">
            Pagamento Pix
          </h2>
        </div>

        <div className="p-3 rounded-2xl bg-[#FFF4E8] border border-[#F0D5BE] text-[11px] text-[#7A4B36] leading-relaxed">
          A entrada de 50% é obrigatória. O cliente também pode optar por quitar 100% no ato. O QR Code e o Pix Copia e Cola usam os dados abaixo.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1 lg:col-span-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
              Chave Pix
            </label>
            <input
              type="text"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF/CNPJ, e-mail, telefone ou chave aleatória"
              className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl px-3 py-2 text-xs text-[#3C1F15] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
              Nome do recebedor
            </label>
            <input
              type="text"
              value={pixReceiverName}
              onChange={(e) => setPixReceiverName(e.target.value)}
              placeholder="DELI SALGADOS"
              maxLength={25}
              className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl px-3 py-2 text-xs text-[#3C1F15] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#8C7367] block">
              Cidade do recebedor
            </label>
            <input
              type="text"
              value={pixReceiverCity}
              onChange={(e) => setPixReceiverCity(e.target.value)}
              placeholder="RECIFE"
              maxLength={15}
              className="w-full bg-[#FFFBF7] border border-[#EBDCCF] focus:border-[#DF5F45] rounded-xl px-3 py-2 text-xs text-[#3C1F15] focus:outline-none uppercase"
            />
          </div>
        </div>

        {!pixKey.trim() && (
          <div className="text-[11px] text-[#B85D19] font-semibold">
            Pix ainda não configurado. O checkout continuará registrando o pedido, mas o QR Code ficará indisponível até salvar uma chave Pix.
          </div>
        )}
      </div>

      {/* Security info card */}
      <div className="p-4 bg-white rounded-3xl border border-[#F0E2D2] flex items-center justify-between text-xs text-[#7A6357]">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#1FAA52]" />
          <span>Ambiente administrativo autenticado via Supabase Auth SSR.</span>
        </div>
        <span className="font-bold text-[#3C1F15]">Deli Salgados Gestão</span>
      </div>
    </div>
  );
}
