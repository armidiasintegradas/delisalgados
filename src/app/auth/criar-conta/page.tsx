"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, User } from "lucide-react";

export default function CriarContaPage() {
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSuccess(false);

    if (fullName.trim().length < 3) {
      setMessage("Informe seu nome completo.");
      return;
    }
    if (whatsapp.replace(/\D/g, "").length < 10) {
      setMessage("Informe um WhatsApp válido.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setMessage("Informe um e-mail válido.");
      return;
    }
    if (password.length < 8) {
      setMessage("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirm) {
      setMessage("As senhas não conferem.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/auth/customer-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível criar sua conta.");

      setSuccess(true);
      setMessage(data.message || "Conta criada com sucesso.");
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível criar sua conta.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen catalog-bg-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] deli-surface-strong rounded-3xl border shadow-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/perfil" className="w-9 h-9 rounded-full bg-[#FFF0E2] text-[#3C1F15] flex items-center justify-center" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>
          <img src="/deli-logo-coral-official.png" alt="Deli Salgados" className="h-10 w-auto" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-black text-[#3C1F15]">Criar conta Deli</h1>
          <p className="text-xs text-[#7A6357] mt-1 leading-relaxed">
            Crie seu acesso para acompanhar pedidos, salvar seus dados e agilizar as próximas compras.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="block">
            <span className="text-[10px] font-black uppercase text-[#7A6357]">Nome completo</span>
            <div className="relative mt-1">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="deli-field w-full pl-9 pr-3 py-3 rounded-2xl border text-sm" placeholder="Seu nome completo" />
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase text-[#7A6357]">WhatsApp</span>
            <div className="relative mt-1">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required inputMode="tel" className="deli-field w-full pl-9 pr-3 py-3 rounded-2xl border text-sm" placeholder="(81) 99999-9999" />
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase text-[#7A6357]">E-mail</span>
            <div className="relative mt-1">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" autoComplete="email" className="deli-field w-full pl-9 pr-3 py-3 rounded-2xl border text-sm" placeholder="seuemail@exemplo.com" />
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase text-[#7A6357]">Senha</span>
            <div className="relative mt-1">
              <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" className="deli-field w-full pl-9 pr-11 py-3 rounded-2xl border text-sm" placeholder="Mínimo de 8 caracteres" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8679]" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase text-[#7A6357]">Confirmar senha</span>
            <div className="relative mt-1">
              <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
              <input value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" className="deli-field w-full pl-9 pr-3 py-3 rounded-2xl border text-sm" placeholder="Digite novamente" />
            </div>
          </label>

          {message && (
            <div className={`text-xs p-3 rounded-2xl border ${success ? "bg-[#EAF7EE] text-[#1E5631] border-[#CDEEDB]" : "bg-[#FFF4E8] text-[#7A4B36] border-[#F0D5BE]"}`}>
              {success && <CheckCircle2 size={15} className="inline mr-1.5 -mt-0.5" />}
              {message}
            </div>
          )}

          <button type="submit" disabled={sending || success} className="w-full py-3.5 rounded-2xl bg-[#E05A36] text-white text-xs font-black disabled:opacity-60">
            {sending ? "CRIANDO CONTA..." : success ? "CONTA CRIADA" : "CRIAR MINHA CONTA"}
          </button>

          {success && (
            <div className="space-y-2">
              <p className="text-[10px] text-center text-[#7A6357] leading-relaxed">
                Se a confirmação por e-mail estiver habilitada, abra a mensagem recebida e toque no link antes de entrar.
              </p>
              <Link href="/perfil" className="block w-full py-3 rounded-2xl border border-[#E8D9CB] text-[#3C1F15] text-xs font-black text-center">
                IR PARA O LOGIN
              </Link>
            </div>
          )}
        </form>

        <div className="pt-1 text-center">
          <span className="text-[10px] text-[#8C7367]">Já possui conta? </span>
          <Link href="/perfil" className="text-[10px] font-black text-[#E05A36]">ENTRAR</Link>
        </div>
      </div>
    </div>
  );
}
