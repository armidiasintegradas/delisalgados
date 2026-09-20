"use client";

import React, { useEffect, useState } from "react";
import { CustomerProfile } from "@/types";
import { getFirstName } from "@/lib/formatters";

function recifeGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Recife",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function CustomerGreeting({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [greeting, setGreeting] = useState("Olá");

  useEffect(() => {
    setGreeting(recifeGreeting());

    fetch("/api/customer/profile", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        setAuthenticated(Boolean(data?.authenticated));
        setProfile(data?.profile || null);
      })
      .catch(() => {});
  }, []);

  if (!authenticated || !profile?.full_name) return null;

  const firstName = getFirstName(profile.full_name);

  return (
    <div
      className={
        compact
          ? `deli-surface-soft rounded-2xl border px-4 py-3 ${className}`
          : `deli-surface rounded-3xl border px-5 py-4 lg:px-6 lg:py-5 ${className}`
      }
    >
      <div
        className={
          compact
            ? "font-display text-xl font-black text-[#3C1F15] leading-tight"
            : "font-display text-2xl lg:text-3xl font-black text-[#3C1F15] leading-tight"
        }
      >
        {greeting}, {firstName}!
      </div>
      <p className="text-[11px] lg:text-xs text-[#7A6357] mt-1">
        Que bom ter você por aqui de novo. Fique à vontade, a casa é sua.
      </p>
    </div>
  );
}
