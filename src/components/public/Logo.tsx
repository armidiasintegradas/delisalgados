import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "splash";
  showText?: boolean;
  textColor?: "white" | "brown" | "coral";
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showText = true,
  textColor = "brown",
  className = "",
}) => {
  const sizeMap = {
    sm: { icon: 34, text: "text-base" },
    md: { icon: 48, text: "text-xl" },
    lg: { icon: 72, text: "text-2xl" },
    splash: { icon: 110, text: "text-3xl" },
  };

  const { icon, text } = sizeMap[size];

  const textColorClass = {
    white: "text-white",
    brown: "text-[#3C1F15]",
    coral: "text-[#E05A36]",
  }[textColor];

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="relative flex items-center justify-center drop-shadow-md"
        style={{ width: icon, height: icon }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Chef character circle badge */}
          <circle cx="50" cy="50" r="46" fill="#FDF7F0" stroke="#E05A36" strokeWidth="2.5" />
          
          {/* Heart / Hair wings backdrop */}
          <path
            d="M 24,62 C 16,50 20,38 34,42 C 42,44 48,50 50,56 C 52,50 58,44 66,42 C 80,38 84,50 76,62 C 68,74 54,82 50,82 C 46,82 32,74 24,62 Z"
            fill="#D34B28"
          />

          {/* Face */}
          <ellipse cx="50" cy="53" rx="16" ry="14" fill="#FCE9D8" stroke="#3C1F15" strokeWidth="1.8" />

          {/* Cheeks */}
          <circle cx="41" cy="56" r="3" fill="#F8A79B" opacity="0.6" />
          <circle cx="59" cy="56" r="3" fill="#F8A79B" opacity="0.6" />

          {/* Eyes */}
          <ellipse cx="43" cy="52" rx="1.8" ry="2.2" fill="#3C1F15" />
          <ellipse cx="57" cy="52" rx="1.8" ry="2.2" fill="#3C1F15" />

          {/* Smile */}
          <path d="M 47,58 Q 50,61 53,58" stroke="#3C1F15" strokeWidth="1.5" strokeLinecap="round" />

          {/* Hair bangs */}
          <path
            d="M 36,46 Q 44,40 50,45 Q 56,40 64,46 Q 58,42 50,43 Q 42,42 36,46 Z"
            fill="#3C1F15"
          />

          {/* Chef Hat (Toque) */}
          <path
            d="M 34,38 C 28,34 26,22 36,18 C 40,12 50,11 54,16 C 60,11 70,14 70,22 C 76,26 72,35 66,38 Z"
            fill="#FFFFFF"
            stroke="#3C1F15"
            strokeWidth="2"
          />
          {/* Hat band */}
          <rect
            x="34"
            y="35"
            width="32"
            height="6"
            rx="2"
            fill="#E05A36"
            stroke="#3C1F15"
            strokeWidth="1.5"
          />

          {/* Apron ribbon / bow at neck */}
          <path d="M 44,67 L 50,71 L 56,67 L 54,75 L 46,75 Z" fill="#FFFFFF" stroke="#3C1F15" strokeWidth="1.2" />
        </svg>
      </div>

      {showText && (
        <div className="text-center mt-1.5 leading-tight">
          <span
            className={`font-serif italic font-bold tracking-tight block ${text} ${textColorClass}`}
            style={{ fontFamily: "'Brush Script MT', 'Dancing Script', 'Playfair Display', Georgia, cursive, serif" }}
          >
            Deli
          </span>
          <span
            className={`font-sans tracking-widest text-[9px] uppercase font-bold block -mt-1 opacity-90 ${textColorClass}`}
          >
            Salgados
          </span>
        </div>
      )}
    </div>
  );
};
