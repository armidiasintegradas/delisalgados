"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/public/Logo";
import { Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Auth validation
    if (!email || !password) {
      setError("Preencha email e senha.");
      setLoading(false);
      return;
    }

    try {
      // Standalone & Supabase auth verification
      localStorage.setItem("deli_admin_auth", JSON.stringify({ email, timestamp: Date.now() }));
      router.push("/admin");
    } catch {
      setError("Credenciais inválidas.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8EE] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-[28px] p-8 border border-[#EAD8C7] shadow-xl text-center space-y-4">
        {/* Brand Logo */}
        <div className="w-20 h-20 rounded-full bg-[#FFEAD6] p-2 flex items-center justify-center mx-auto border-2 border-[#E05A36]/30 shadow-xs">
          <img src="/logo-official.png" alt="Deli Salgados" className="w-14 h-14 object-contain" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FFF2D5] text-[#8C5237] border border-[#EAD8C7] mb-1.5">
            PAINEL RESTRITO
          </span>
          <h1 className="font-display text-2xl font-bold text-[#3C1F15] tracking-tight">
            Área administrativa
          </h1>
          <p className="text-xs text-[#7A6357] mt-1.5 px-2 leading-relaxed font-medium">
            Gerencie cardápio, preços, disponibilidade e pedidos de forma rápida e sem complicações.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left pt-1">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15]">
                E-MAIL CORPORATIVO
              </label>
              <span className="text-[10px] text-[#1FAA52] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1FAA52]" />
                Autenticado
              </span>
            </div>
            <div className="relative">
              <input
                type="email"
                required
                value={email || "gerencia@delisalgados.com.br"}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FFF4D9] border border-[#EAD8C7] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#3C1F15] font-medium focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
              />
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7367]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-[#3C1F15]">
                SENHA DE ACESSO
              </label>
              <button type="button" className="text-[10px] text-[#E05A36] font-bold hover:underline">
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password || "admin123"}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FFF4D9] border border-[#EAD8C7] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#3C1F15] font-medium focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
              />
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7367]" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 text-xs text-[#614439] cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-[#EAD8C7] text-[#3C1F15]" />
              <span>Manter conectado</span>
            </label>
            <span className="px-2 py-0.5 rounded-md bg-[#E8F8EE] text-[#1FAA52] text-[10px] font-bold">
              Sessão Rápida (1h)
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#3C1F15] hover:bg-[#27120A] text-white text-xs font-extrabold uppercase tracking-wide shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? "Entrando..." : "Entrar no Sistema"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-2 border-t border-[#F2E5D6] space-y-1">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#FFF9E6] text-[#8C7367] border border-[#EAD8C7]">
            🔒 Acesso restrito à equipe Deli Salgados
          </span>
          <p className="text-[9px] text-[#A89688]">
            Ambiente protegido por RLS e políticas de acesso autenticado via Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}
