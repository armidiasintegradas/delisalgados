"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, User, Phone, MapPin, LogOut, ShoppingBag, Save } from "lucide-react";
import { BottomNav } from "@/components/public/BottomNav";
import { createClient } from "@/lib/supabase/client";
import { CustomerProfile } from "@/types";

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    setLoading(true);
    try {
      const res = await fetch("/api/customer/profile", { cache: "no-store" });
      const data = await res.json();
      setAuthenticated(Boolean(data.authenticated));
      setProfile(data.profile || null);
      if (data.profile?.email) setEmail(data.profile.email);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function sendAccessLink(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSending(true);
    try {
      const client = createClient();
      if (!client) throw new Error("Autenticação indisponível.");
      const { error } = await client.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/perfil`,
        },
      });
      if (error) throw error;
      setMessage("Enviamos um link de acesso para o seu e-mail.");
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível enviar o link de acesso.");
    } finally {
      setSending(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao salvar perfil.");
      setProfile(data.profile);
      setMessage("Dados atualizados com sucesso.");
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível salvar seus dados.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    const client = createClient();
    await client?.auth.signOut();
    setAuthenticated(false);
    setProfile(null);
    setMessage("Você saiu da sua conta.");
  }

  return (
    <div className="w-full max-w-[440px] lg:max-w-none mx-auto min-h-screen bg-[#FFFDF9] shadow-2xl lg:shadow-none flex flex-col pb-24 lg:pb-16 relative">
      <header className="sticky top-0 z-20 bg-gradient-to-b from-[#E25C37] via-[#DF532E] to-[#D5451F] text-white shadow-md">
        <div className="w-full max-w-[900px] mx-auto px-4 lg:px-8 py-3.5 flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
            <ArrowLeft size={18} />
          </Link>
          <img src="/deli-logo-cream-official.png" alt="Deli Salgados" className="h-9 w-auto" />
          <div>
            <h1 className="text-base lg:text-lg font-bold">Minha conta</h1>
            <span className="text-[10px] text-[#FCE9D8]">Dados e histórico de pedidos</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[440px] lg:max-w-[680px] mx-auto p-4 lg:p-8 flex-1">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#7A6357]">Carregando...</div>
        ) : !authenticated ? (
          <form onSubmit={sendAccessLink} className="bg-white p-6 rounded-3xl border border-[#EBDCCF] shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FFF0E2] text-[#E05A36] flex items-center justify-center">
              <User size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#3C1F15]">Acesse sua conta Deli</h2>
              <p className="text-xs text-[#7A6357] mt-1 leading-relaxed">
                Use o mesmo e-mail informado nos seus pedidos. Você receberá um link seguro de acesso, sem precisar criar senha.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-[#3C1F15] block mb-1">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-9 pr-3 py-3 bg-[#FFFDF9] border border-[#E8D9CB] rounded-2xl text-sm text-[#3C1F15]"
                />
              </div>
            </div>

            {message && <div className="text-xs p-3 rounded-2xl bg-[#FFF4E8] text-[#7A4B36]">{message}</div>}

            <button disabled={sending} className="w-full py-3.5 rounded-2xl bg-[#3C1F15] text-white font-bold text-xs">
              {sending ? "Enviando..." : "ENVIAR LINK DE ACESSO"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-[#EBDCCF] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#3C1F15]">Seus dados</h2>
                  <p className="text-[11px] text-[#7A6357]">{profile?.email}</p>
                </div>
                <button onClick={signOut} className="p-2 rounded-xl border border-[#EBDCCF] text-[#7A6357]" aria-label="Sair">
                  <LogOut size={16} />
                </button>
              </div>

              {profile && (
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[#7A6357]">Nome completo</span>
                    <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="mt-1 w-full p-3 rounded-2xl border border-[#E8D9CB] text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[#7A6357]">WhatsApp</span>
                    <input value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} className="mt-1 w-full p-3 rounded-2xl border border-[#E8D9CB] text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[#7A6357]">Endereço completo</span>
                    <textarea rows={2} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="mt-1 w-full p-3 rounded-2xl border border-[#E8D9CB] text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase text-[#7A6357]">Ponto de referência</span>
                    <input value={profile.reference_point} onChange={(e) => setProfile({ ...profile, reference_point: e.target.value })} className="mt-1 w-full p-3 rounded-2xl border border-[#E8D9CB] text-sm" />
                  </label>

                  {message && <div className="text-xs p-3 rounded-2xl bg-[#FFF4E8] text-[#7A4B36]">{message}</div>}

                  <button onClick={saveProfile} disabled={saving} className="w-full py-3 rounded-2xl bg-[#E05A36] text-white font-bold text-xs flex items-center justify-center gap-2">
                    <Save size={15} /> {saving ? "Salvando..." : "SALVAR DADOS"}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/meus-pedidos" className="p-4 rounded-3xl bg-[#3C1F15] text-white text-center font-bold text-xs flex flex-col items-center gap-2">
                <ShoppingBag size={20} /> MEUS PEDIDOS
              </Link>
              <Link href="/" className="p-4 rounded-3xl bg-[#FFF4E8] border border-[#F0D5BE] text-[#3C1F15] text-center font-bold text-xs flex flex-col items-center gap-2">
                <ShoppingBag size={20} /> NOVO PEDIDO
              </Link>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
