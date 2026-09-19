import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "splash";
  variant?: "cream" | "coral" | "cream-alt" | "avatar";
  className?: string;
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  variant = "coral",
  className = "",
  alt = "Deli Salgados",
}) => {
  const sizeMap = {
    sm: "h-8 w-auto",
    md: "h-11 w-auto",
    lg: "h-16 w-auto",
    splash: "h-44 w-auto",
  };

  const assetMap = {
    coral: "/deli-logo-coral-official.png",
    cream: "/deli-logo-cream-official.png",
    "cream-alt": "/deli-logo-cream-alt-official.png",
    avatar: "/deli-avatar-official.png",
  };

  const src = assetMap[variant] || assetMap.coral;
  const dimensionClass = sizeMap[size] || sizeMap.md;

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none shrink-0 ${dimensionClass} ${className}`}
    />
  );
};

