"use client";

import React, { useEffect, useState } from "react";
import { Logo } from "./Logo";

interface SplashScreenProps {
  onFinish?: () => void;
  minDuration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDuration = 1400,
}) => {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Check if locked for QA capture
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isLocked = params?.get("splash_lock") === "1" || params?.get("splash") === "1";
    if (isLocked) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = prefersReducedMotion ? 600 : minDuration;

    const timer = setTimeout(() => {
      setFading(true);
      const hideTimer = setTimeout(() => {
        setHidden(true);
        if (onFinish) onFinish();
      }, 400);
      return () => clearTimeout(hideTimer);
    }, duration);

    return () => clearTimeout(timer);
  }, [minDuration, onFinish]);

  if (hidden) return null;

  return (
    <div
      onClick={() => {
        setFading(true);
        setTimeout(() => {
          setHidden(true);
          if (onFinish) onFinish();
        }, 200);
      }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#DF5F45] transition-opacity duration-500 select-none cursor-pointer ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        backgroundImage: "url('/splash-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        <img
          src="/logo-official.png"
          alt="Deli Salgados"
          className="w-[145px] h-auto drop-shadow-md select-none pointer-events-none"
        />
      </div>
    </div>
  );
};
