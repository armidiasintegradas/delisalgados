"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const [email, setEmail] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOrderFallback, setShowOrderFallback] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [fallbackPassword, setFallbackPassword] = useState("");
  const [fallbackPasswordConfirm, setFallbackPasswordConfirm] = useState("");
  const [creatingPassword, setCreatingPassword] = useState(false);

  useEffect(() => {
    const client = createClient();
    if (!client) {
      setCheckingSession(false);
      return;
    }

    client.auth.getUser()
      .then(({ data }) => {
        setAuthenticated(Boolean(data.user));
        if (data.user?.email) setEmail(data.user.email);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage("Informe um e-mail válido.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Não foi possível enviar o link de redefinição.");
      }

      setSuccess(true);
      setMessage(
        data.message ||
          "Enviamos um link para seu e-mail. Verifique também Spam, Lixo Eletrônico e Promoções."
      );
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível enviar o link de redefinição.");
    } finally {
      setSending(false);
    }
  }

  async function createPasswordFromOrder(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage("Informe o e-mail usado no pedido.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setMessage("Informe o WhatsApp usado no pedido.");
      return;
    }
    if (!/^DL-\d{4,}$/i.test(orderCode.trim())) {
      setMessage("Informe um código de pedido válido, como DL-0001.");
      return;
    }
    if (fallbackPassword.length < 8) {
      setMessage("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (fallbackPassword !== fallbackPasswordConfirm) {
      setMessage("As senhas não conferem.");
      return;
    }

    setCreatingPassword(true);
    try {
      const res = await fetch("/api/auth/customer-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          phone,
          orderCode: orderCode.trim().toUpperCase(),
          password: fallbackPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível criar sua senha.");

      setSuccess(true);
      setMessage(data.message || "Senha criada. Você já pode entrar na sua conta Deli.");
      setFallbackPassword("");
      setFallbackPasswordConfirm("");
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível criar sua senha.");
    } finally {
      setCreatingPassword(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSuccess(false);

    if (password.length < 8) {
      setMessage("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== passwordConfirm) {
      setMessage("As senhas não conferem.");
      return;
    }

    const client = createClient();
    if (!client) {
      setMessage("Redefinição de senha indisponível no momento.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;

      setPassword("");
      setPasswordConfirm("");
      setSuccess(true);
      setMessage("Senha atualizada com sucesso. Sua conta Deli está pronta para entrar com e-mail e senha.");
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível atualizar sua senha.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center p-4">
        <div className="text-xs font-bold text-[#7A6357]">Verificando acesso...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] catalog-bg-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-[430px] bg-white rounded-3xl border border-[#EBDCCF] shadow-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href="/perfil"
            className="w-9 h-9 rounded-full bg-[#FFF0E2] text-[#3C1F15] flex items-center justify-center"
            aria-label="Voltar para o perfil"
          >
            <ArrowLeft size={18} />
          </Link>
          <img src="/deli-logo-coral-official.png" alt="Deli Salgados" className="h-10 w-auto" />
        </div>

        <div>
          <h1 className="font-display text-2xl font-black text-[#3C1F15]">
            {authenticated ? "Crie sua nova senha" : "Esqueceu sua senha?"}
          </h1>
          <p className="text-xs text-[#7A6357] mt-1 leading-relaxed">
            {authenticated
              ? "Escolha uma senha segura para entrar na sua conta Deli."
              : "Informe o e-mail usado no cadastro. Vamos enviar um link seguro para você definir uma nova senha."}
          </p>
        </div>

        {authenticated ? (
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-[#3C1F15] block mb-1">
                Nova senha
              </label>
              <div className="relative">
                <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full pl-9 pr-11 py-3 bg-[#FFFDF9] border border-[#E8D9CB] rounded-2xl text-sm text-[#3C1F15] outline-none focus:ring-2 focus:ring-[#E05A36]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8679]"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-[#3C1F15] block mb-1">
                Confirmar nova senha
              </label>
              <div className="relative">
                <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="w-full pl-9 pr-3 py-3 bg-[#FFFDF9] border border-[#E8D9CB] rounded-2xl text-sm text-[#3C1F15] outline-none focus:ring-2 focus:ring-[#E05A36]/30"
                />
              </div>
            </div>

            {message && (
              <div className={`text-xs p-3 rounded-2xl border ${
                success
                  ? "bg-[#EAF7EE] text-[#1E5631] border-[#CDEEDB]"
                  : "bg-[#FFF4E8] text-[#7A4B36] border-[#F0D5BE]"
              }`}>
                {success && <CheckCircle2 size={15} className="inline mr-1.5 -mt-0.5" />}
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-[#E05A36] text-white text-xs font-black disabled:opacity-60"
            >
              {saving ? "SALVANDO..." : "SALVAR NOVA SENHA"}
            </button>

            {success && (
              <Link
                href="/perfil"
                className="block w-full py-3 rounded-2xl border border-[#E8D9CB] text-[#3C1F15] text-xs font-black text-center"
              >
                IR PARA MINHA CONTA
              </Link>
            )}
          </form>
        ) : (
          <form onSubmit={requestReset} className="space-y-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-[#3C1F15] block mb-1">
                E-mail da conta
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-9 pr-3 py-3 bg-[#FFFDF9] border border-[#E8D9CB] rounded-2xl text-sm text-[#3C1F15] outline-none focus:ring-2 focus:ring-[#E05A36]/30"
                />
              </div>
            </div>

            {message && (
              <div className={`text-xs p-3 rounded-2xl border ${
                success
                  ? "bg-[#EAF7EE] text-[#1E5631] border-[#CDEEDB]"
                  : "bg-[#FFF4E8] text-[#7A4B36] border-[#F0D5BE]"
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 rounded-2xl bg-[#3C1F15] text-white text-xs font-black disabled:opacity-60"
            >
              {sending ? "ENVIANDO..." : "ENVIAR LINK PARA REDEFINIR SENHA"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowOrderFallback((value) => !value);
                setMessage(null);
                setSuccess(false);
              }}
              className="w-full py-3 rounded-2xl border border-[#E8D9CB] text-[#3C1F15] text-[11px] font-black"
            >
              {showOrderFallback ? "OCULTAR OPÇÃO ALTERNATIVA" : "NÃO RECEBI O E-MAIL — CRIAR SENHA COM MEU PEDIDO"}
            </button>

            {showOrderFallback && (
              <form onSubmit={createPasswordFromOrder} className="deli-surface-soft border rounded-3xl p-4 space-y-3">
                <div>
                  <div className="text-xs font-black text-[#3C1F15]">Criar senha sem depender do e-mail</div>
                  <div className="text-[10px] text-[#7A6357] mt-1 leading-relaxed">
                    Confirme os dados de um pedido seu. Se os dados conferirem, você cria a senha na hora.
                  </div>
                </div>

                <div className="relative">
                  <ReceiptText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
                  <input
                    type="text"
                    required
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
                    placeholder="Código do pedido, ex: DL-0007"
                    className="w-full pl-9 pr-3 py-3 deli-field border rounded-2xl text-sm uppercase text-[#3C1F15]"
                  />
                </div>

                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="WhatsApp usado no pedido"
                    className="w-full pl-9 pr-3 py-3 deli-field border rounded-2xl text-sm text-[#3C1F15]"
                  />
                </div>

                <div className="relative">
                  <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={fallbackPassword}
                    onChange={(e) => setFallbackPassword(e.target.value)}
                    placeholder="Crie uma senha com 8+ caracteres"
                    className="w-full pl-9 pr-11 py-3 deli-field border rounded-2xl text-sm text-[#3C1F15]"
                  />
                </div>

                <div className="relative">
                  <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={fallbackPasswordConfirm}
                    onChange={(e) => setFallbackPasswordConfirm(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="w-full pl-9 pr-3 py-3 deli-field border rounded-2xl text-sm text-[#3C1F15]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingPassword}
                  className="w-full py-3.5 rounded-2xl bg-[#E05A36] text-white text-xs font-black disabled:opacity-60"
                >
                  {creatingPassword ? "CRIANDO SENHA..." : "CRIAR SENHA AGORA"}
                </button>
              </form>
            )}

            <Link
              href="/perfil"
              className="block text-center text-[11px] font-black text-[#E05A36]"
            >
              VOLTAR PARA O LOGIN
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
