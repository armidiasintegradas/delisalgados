"use client";

import React, { useEffect, useState, useCallback } from "react";

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDuration = 1400,
}) => {
  const [phase, setPhase] = useState<"visible" | "exiting" | "hidden">("visible");

  const handleExit = useCallback(() => {
    setPhase("exiting");
    const hideTimer = setTimeout(() => {
      setPhase("hidden");
      if (onFinish) onFinish();
    }, 450);
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
    const duration = prefersReducedMotion ? 600 : minDuration;

    // Transition to exit
    const exitTimer = setTimeout(() => {
      handleExit();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [minDuration, handleExit]);

  if (phase === "hidden") return null;

  const isExiting = phase === "exiting";

  return (
    <div
      onClick={handleExit}
      className={`fixed inset-y-0 inset-x-0 mx-auto max-w-[440px] w-full z-50 flex items-center justify-center select-none cursor-pointer overflow-hidden transition-opacity duration-450 ease-out shadow-2xl ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        backgroundColor: "#DF5F45",
        backgroundImage: "url('/deli-pattern-official.png')",
        backgroundRepeat: "repeat",
        backgroundSize: "500px auto",
      }}
      aria-label="Deli Salgados - Tela inicial"
    >
      {/* Official Centered Transparent Brand Logo */}
      <div className="relative z-10 flex items-center justify-center animate-splash-entrance">
        <img
          src="/deli-logo-cream-official.png"
          alt="Deli Salgados"
          className="w-[190px] h-auto object-contain select-none pointer-events-none drop-shadow-[0_8px_20px_rgba(60,31,21,0.25)]"
        />
      </div>
    </div>
  );
};

