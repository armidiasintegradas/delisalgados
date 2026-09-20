"use client";

import React, { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [showAndroidHelp, setShowAndroidHelp] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(Boolean(standalone));
    if (standalone) return;

    const ua = window.navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    const mobileViewport = window.matchMedia("(max-width: 1023px)").matches;

    setIsIOS(ios);
    setIsAndroid(android);

    if (!mobileViewport || (!ios && !android)) return;

    const dismissedAt = Number(localStorage.getItem("deli_pwa_dismissed_at") || 0);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const canShow = !dismissedAt || Date.now() - dismissedAt > sevenDays;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      if (canShow) {
        window.setTimeout(() => setShowBanner(true), 1800);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS has no beforeinstallprompt. Some Android browsers also omit it,
    // so still expose a manual home-screen guide on mobile.
    if ((ios || android) && canShow) {
      window.setTimeout(() => setShowBanner(true), 1800);
    }

    const handleInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Deli PWA service worker registration failed:", error);
      });
    }
  }, []);

  function dismiss() {
    setShowBanner(false);
    localStorage.setItem("deli_pwa_dismissed_at", String(Date.now()));
  }

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
      return;
    }

    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }

    if (isAndroid) {
      setShowAndroidHelp(true);
    }
  }

  if (isStandalone || !showBanner) return null;

  return (
    <>
      <div className="fixed left-3 right-3 bottom-20 lg:bottom-6 z-[60] mx-auto max-w-[440px] rounded-3xl border border-[#EAD8C7] bg-[#FFFDF9] shadow-2xl p-4">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar sugestão"
          className="absolute right-3 top-3 w-8 h-8 rounded-full bg-[#FFF0E2] text-[#7A6357] flex items-center justify-center"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-[#EAD8C7] bg-white shrink-0">
            <img src="/logo-square.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-[#3C1F15]">Deli Salgados no seu celular</div>
            <p className="text-[11px] leading-relaxed text-[#7A6357] mt-1">
              Adicione o cardápio à tela inicial e abra como um app, sem precisar procurar o link novamente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={install}
          className="mt-3 w-full py-3 rounded-2xl bg-[#E05A36] text-white text-xs font-black flex items-center justify-center gap-2"
        >
          {isIOS ? <Share2 size={16} /> : <Download size={16} />}
          {isIOS ? "COMO ADICIONAR À TELA INICIAL" : "INSTALAR DELI SALGADOS"}
        </button>
      </div>

      {showAndroidHelp && (
        <div className="fixed inset-0 z-[70] bg-black/45 p-4 flex items-end justify-center">
          <div className="w-full max-w-[440px] rounded-3xl bg-[#FFFDF9] border border-[#EAD8C7] p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-[#3C1F15]">Adicionar “Deli Salgados”</div>
                <p className="text-xs text-[#7A6357] mt-1">
                  No Android, use o menu do navegador caso a instalação automática não apareça.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidHelp(false)}
                className="w-9 h-9 rounded-full bg-[#FFF0E2] text-[#7A6357] flex items-center justify-center"
                aria-label="Fechar instruções"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#3C1F15]">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#3C1F15] text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                <div>Abra o menu <strong>⋮</strong> ou o menu principal do navegador.</div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#3C1F15] text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                <div>Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#3C1F15] text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                <div>Confirme o nome <strong>Deli Salgados</strong>.</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidHelp(false)}
              className="w-full py-3 rounded-2xl bg-[#3C1F15] text-white text-xs font-black"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}

      {showIOSHelp && (
        <div className="fixed inset-0 z-[70] bg-black/45 p-4 flex items-end justify-center">
          <div className="w-full max-w-[440px] rounded-3xl bg-[#FFFDF9] border border-[#EAD8C7] p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-[#3C1F15]">Adicionar “Deli Salgados”</div>
                <p className="text-xs text-[#7A6357] mt-1">No iPhone, faça isso pelo Safari:</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSHelp(false)}
                className="w-9 h-9 rounded-full bg-[#FFF0E2] text-[#7A6357] flex items-center justify-center"
                aria-label="Fechar instruções"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#3C1F15]">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#3C1F15] text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                <div>Toque em <strong>Compartilhar</strong> <Share2 size={15} className="inline -mt-0.5" />.</div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#3C1F15] text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                <div>Role a lista e escolha <strong>Adicionar à Tela de Início</strong>.</div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#3C1F15] text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                <div>Confirme o nome <strong>Deli Salgados</strong> e toque em <strong>Adicionar</strong>.</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSHelp(false)}
              className="w-full py-3 rounded-2xl bg-[#3C1F15] text-white text-xs font-black"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}
    </>
  );
}
