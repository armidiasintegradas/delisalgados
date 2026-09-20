"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, User, LogOut, ShoppingBag, Save, Camera, Trash2, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { BottomNav } from "@/components/public/BottomNav";
import { CustomerGreeting } from "@/components/public/CustomerGreeting";
import { AvatarCropModal } from "@/components/public/AvatarCropModal";
import { createClient } from "@/lib/supabase/client";
import { CustomerProfile } from "@/types";

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

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

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setMessage("Informe um e-mail válido.");
      return;
    }
    if (!password) {
      setMessage("Informe sua senha.");
      return;
    }

    setSending(true);
    try {
      const client = createClient();
      if (!client) throw new Error("Autenticação indisponível.");

      const { error } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setMessage("E-mail ou senha inválidos. Se não lembrar a senha, use “Esqueci minha senha”.");
        return;
      }

      setPassword("");
      await loadProfile();
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível entrar na sua conta.");
    } finally {
      setSending(false);
    }
  }


  function chooseAvatar(file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Use uma imagem JPG, PNG ou WebP.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setMessage("A foto original deve ter no máximo 8 MB.");
      return;
    }

    setMessage(null);
    setPendingAvatarFile(file);
  }

  async function saveCroppedAvatar(blob: Blob) {
    if (!profile) return;

    const client = createClient();
    if (!client) {
      setMessage("Upload de foto indisponível.");
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const path = `${profile.id}/avatar.jpg`;

      // Remove legacy formats so only one canonical avatar remains.
      await client.storage
        .from("customer-avatars")
        .remove([
          `${profile.id}/avatar.png`,
          `${profile.id}/avatar.webp`,
          `${profile.id}/avatar.jpg`,
        ]);

      const { error: uploadError } = await client.storage
        .from("customer-avatars")
        .upload(path, blob, {
          cacheControl: "0",
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data } = client.storage.from("customer-avatars").getPublicUrl(path);
      const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

      const updatedProfile = { ...profile, avatar_url: avatarUrl };

      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || "Falha ao salvar a foto.");

      setProfile(saved.profile);
      setPendingAvatarFile(null);
      setMessage("Foto de perfil atualizada.");

      window.dispatchEvent(
        new CustomEvent("deli-profile-updated", {
          detail: { avatar_url: saved.profile?.avatar_url || avatarUrl },
        })
      );
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível enviar a foto.");
    } finally {
      setUploadingAvatar(false);
    }
  }


  async function removeAvatar() {
    if (!profile?.avatar_url) return;

    const client = createClient();
    if (!client) return;

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const extMatch = profile.avatar_url.match(/avatar\.(jpg|png|webp)/);
      if (extMatch) {
        await client.storage
          .from("customer-avatars")
          .remove([
            `${profile.id}/avatar.jpg`,
            `${profile.id}/avatar.png`,
            `${profile.id}/avatar.webp`,
          ]);
      }

      const updatedProfile = { ...profile, avatar_url: null };
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || "Falha ao remover foto.");

      setProfile(saved.profile);
      setMessage("Foto de perfil removida.");
      window.dispatchEvent(
        new CustomEvent("deli-profile-updated", {
          detail: { avatar_url: null },
        })
      );
    } catch (err: any) {
      setMessage(err?.message || "Não foi possível remover a foto.");
    } finally {
      setUploadingAvatar(false);
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
          <form onSubmit={signInWithPassword} className="deli-surface p-6 rounded-3xl border space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FFF0E2] text-[#E05A36] flex items-center justify-center">
              <User size={22} />
            </div>

            <div>
              <h2 className="text-xl font-black text-[#3C1F15]">Entrar na sua conta Deli</h2>
              <p className="text-xs text-[#7A6357] mt-1 leading-relaxed">
                Use o e-mail cadastrado no seu primeiro pedido e sua senha para acessar seu perfil e histórico.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-[#3C1F15] block mb-1">
                Login (e-mail)
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
                  className="w-full pl-9 pr-3 py-3 deli-field border rounded-2xl text-sm text-[#3C1F15] outline-none focus:ring-2 focus:ring-[#E05A36]/30"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-[#3C1F15] block mb-1">
                Senha
              </label>
              <div className="relative">
                <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full pl-9 pr-11 py-3 deli-field border rounded-2xl text-sm text-[#3C1F15] outline-none focus:ring-2 focus:ring-[#E05A36]/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E8679] hover:text-[#3C1F15]"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/auth/redefinir-senha"
                className="text-[11px] font-black text-[#E05A36] hover:text-[#C94724]"
              >
                ESQUECI MINHA SENHA
              </Link>
            </div>

            {message && (
              <div className="text-xs p-3 rounded-2xl bg-[#FFF4E8] text-[#7A4B36] border border-[#F0D5BE]">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3.5 rounded-2xl bg-[#3C1F15] text-white font-bold text-xs disabled:opacity-60"
            >
              {sending ? "ENTRANDO..." : "ENTRAR"}
            </button>

            <p className="text-[10px] text-center text-[#9E8679] leading-relaxed">
              Primeiro acesso sem senha? Use “Esqueci minha senha” para criar uma senha segura para sua conta.
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <CustomerGreeting />
            <div className="deli-surface p-5 rounded-3xl border space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#F0D5BE] bg-[#FFF0E2] flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={30} className="text-[#E05A36]" />
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-[#E05A36] text-white flex items-center justify-center border-2 border-white shadow cursor-pointer">
                      <Camera size={16} />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingAvatar}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) chooseAvatar(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-[#3C1F15]">Seu perfil Deli</h2>
                    <p className="text-[11px] text-[#7A6357] truncate">{profile?.email}</p>
                    <p className="text-[10px] text-[#9E8679] mt-1">
                      {uploadingAvatar ? "Atualizando foto..." : "Toque na câmera para escolher uma foto"}
                    </p>
                  </div>
                </div>

                <button onClick={signOut} className="p-2 rounded-xl border border-[#EBDCCF] text-[#7A6357] shrink-0" aria-label="Sair">
                  <LogOut size={16} />
                </button>
              </div>

              {profile?.avatar_url && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#C04220] disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Remover foto
                </button>
              )}

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
              <Link href="/" className="deli-surface-soft p-4 rounded-3xl border text-[#3C1F15] text-center font-bold text-xs flex flex-col items-center gap-2">
                <ShoppingBag size={20} /> NOVO PEDIDO
              </Link>
            </div>
          </div>
        )}
      </main>

      {pendingAvatarFile && (
        <AvatarCropModal
          file={pendingAvatarFile}
          saving={uploadingAvatar}
          onCancel={() => {
            if (!uploadingAvatar) setPendingAvatarFile(null);
          }}
          onConfirm={saveCroppedAvatar}
        />
      )}

      <BottomNav />
    </div>
  );
}
