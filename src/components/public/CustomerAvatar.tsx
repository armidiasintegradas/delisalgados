"use client";

import React, { useEffect, useState } from "react";
import { User } from "lucide-react";

export function CustomerAvatar({
  size = "md",
  className = "",
  showFallback = true,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showFallback?: boolean;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  const sizeClass =
    size === "sm"
      ? "w-8 h-8"
      : size === "lg"
        ? "w-12 h-12"
        : "w-9 h-9";

  async function loadAvatar() {
    try {
      const res = await fetch("/api/customer/profile", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setAuthenticated(Boolean(data?.authenticated));
      setAvatarUrl(data?.profile?.avatar_url || null);
    } catch {
      // Keep fallback icon.
    }
  }

  useEffect(() => {
    loadAvatar();

    const handleProfileUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ avatar_url?: string | null }>).detail;
      if (detail && "avatar_url" in detail) {
        setAuthenticated(true);
        setAvatarUrl(detail.avatar_url || null);
      } else {
        loadAvatar();
      }
    };

    window.addEventListener("deli-profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("deli-profile-updated", handleProfileUpdate);
  }, []);

  if (authenticated && avatarUrl) {
    return (
      <span
        className={`${sizeClass} rounded-full overflow-hidden border border-white/50 bg-white/15 flex items-center justify-center shrink-0 ${className}`}
      >
        <img
          src={avatarUrl}
          alt="Foto de perfil"
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  if (!showFallback) return null;

  return (
    <span
      className={`${sizeClass} rounded-full flex items-center justify-center shrink-0 ${className}`}
    >
      <User size={size === "sm" ? 18 : size === "lg" ? 22 : 20} />
    </span>
  );
}
