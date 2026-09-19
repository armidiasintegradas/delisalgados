"use client";

import React, { useEffect, useState, useCallback } from "react";

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDuration = 1600,
}) => {
  const [phase, setPhase] = useState<"entrance" | "breathing" | "exiting" | "hidden">("entrance");

  const handleExit = useCallback(() => {
    setPhase("exiting");
    const hideTimer = setTimeout(() => {
      setPhase("hidden");
      if (onFinish) onFinish();
    }, 550);
    return () => clearTimeout(hideTimer);
  }, [onFinish]);

  useEffect(() => {
    // Check if locked for QA capture
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isLocked = params?.get("splash_lock") === "1" || params?.get("splash") === "1";
    if (isLocked) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = prefersReducedMotion ? 700 : minDuration;

    // Transition from entrance to breathing at 750ms
    const breatheTimer = setTimeout(() => {
      setPhase((prev) => (prev === "entrance" ? "breathing" : prev));
    }, 750);

    // Transition to exit
    const exitTimer = setTimeout(() => {
      handleExit();
    }, duration);

    return () => {
      clearTimeout(breatheTimer);
      clearTimeout(exitTimer);
    };
  }, [minDuration, handleExit]);

  if (phase === "hidden") return null;

  const isExiting = phase === "exiting";

  return (
    <div
      onClick={handleExit}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#DF5F45] select-none cursor-pointer overflow-hidden transition-opacity duration-550 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(circle at center, #E8644A 0%, #DF5F45 60%, #D04E35 100%)",
      }}
      aria-label="Deli Salgados - Tela inicial"
    >
      {/* Ambient Radial Soft Glow */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
          isExiting ? "opacity-0 scale-125" : "animate-splash-glow"
        }`}
        style={{
          width: "min(80vw, 80vh, 500px)",
          height: "min(80vw, 80vh, 500px)",
          background:
            "radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 45%, transparent 70%)",
        }}
      />

      {/* Main Logo Container - Fills 50% of the screen adaptively */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center transition-all duration-550 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform ${
          isExiting
            ? "opacity-0 -translate-y-6 scale-105"
            : phase === "entrance"
            ? "animate-splash-entrance"
            : "animate-splash-breathe"
        }`}
        style={{
          width: "min(50vw, 42vh, 340px)",
          minWidth: "195px",
        }}
      >
        <img
          src="/logo-official.png"
          alt="Deli Salgados"
          className="w-full h-auto drop-shadow-[0_12px_28px_rgba(60,31,21,0.28)] select-none pointer-events-none object-contain"
        />
      </div>

      {/* Subtle indicator hint to tap to skip */}
      <div
        className={`absolute bottom-8 text-[11px] font-medium tracking-wide text-white/70 uppercase transition-opacity duration-500 pointer-events-none ${
          isExiting ? "opacity-0" : "opacity-60"
        }`}
      >
        Toque para entrar
      </div>
    </div>
  );
};
