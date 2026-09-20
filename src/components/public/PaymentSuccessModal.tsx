"use client";

import React from "react";
import Link from "next/link";
import { Check, Heart, X } from "lucide-react";

interface PaymentSuccessModalProps {
  firstName: string;
  onClose: () => void;
}

export function PaymentSuccessModal({ firstName, onClose }: PaymentSuccessModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2A160F]/55 backdrop-blur-[3px] p-3 sm:p-5 lg:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deli-payment-success-title"
    >
      <div className="relative w-full max-w-[390px] sm:max-w-[430px] lg:max-w-[470px] max-h-[94dvh] overflow-y-auto rounded-[30px] sm:rounded-[34px] bg-[#FFFDF6] border border-[#F0D5BE] shadow-2xl">
        <div className="relative h-20 sm:h-24 overflow-hidden rounded-t-[30px] sm:rounded-t-[34px] bg-[#F05A3E]">
          <div className="absolute -bottom-8 left-[-5%] w-[110%] h-16 sm:h-20 rounded-[50%] bg-[#FFFDF6]" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar mensagem"
            className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-[#FFF7EA] text-[#3C1F15] flex items-center justify-center shadow-sm hover:scale-105 transition"
          >
            <X size={22} strokeWidth={2.6} />
          </button>
        </div>

        <div className="px-5 sm:px-7 lg:px-8 pb-6 sm:pb-7 -mt-2 text-center">
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#56B957] flex items-center justify-center text-white shadow-lg border-[7px] border-[#FFFDF6]">
            <Check size={42} strokeWidth={3.4} />
            <span className="absolute -left-9 top-2 text-[#F05A3E] rotate-[-12deg]">
              <Heart size={24} strokeWidth={2.8} />
            </span>
            <span className="absolute -right-10 top-8 text-[#F05A3E] rotate-[12deg]">
              <Heart size={28} strokeWidth={2.8} />
            </span>
          </div>

          <h2
            id="deli-payment-success-title"
            className="font-display text-[34px] leading-[0.98] sm:text-[42px] lg:text-[46px] font-black text-[#3C1F15] mt-2"
          >
            Obrigado,
            <br />
            {firstName}!
          </h2>

          <p className="font-display text-[18px] sm:text-[20px] font-black leading-snug text-[#3C1F15] mt-4 px-1">
            Foi uma DELI poder te atender,
            <br />
            vê se volta logo heim?
          </p>

          <div className="mt-5 sm:mt-6">
            <img
              src="/logo-official-raw.png"
              alt="Deli Salgados"
              className="mx-auto block w-auto h-auto max-h-[170px] sm:max-h-[195px] max-w-[78%]"
              draggable={false}
            />
          </div>

          <div className="mt-4 rounded-full bg-[#FFF0DE] px-4 py-2 text-[11px] sm:text-xs font-bold text-[#5E3626]">
            Pagamento final confirmado com sucesso.
          </div>

          <div className="mt-5 space-y-2.5">
            <Link
              href="/"
              onClick={onClose}
              className="w-full min-h-12 rounded-2xl bg-[#F05A3E] hover:bg-[#DE4E34] text-white font-display font-black text-sm sm:text-base flex items-center justify-center transition shadow-md"
            >
              VOLTAR AO CARDÁPIO
            </Link>

            <Link
              href="/meus-pedidos"
              onClick={onClose}
              className="w-full min-h-12 rounded-2xl border-2 border-[#5A2E20] bg-transparent text-[#3C1F15] font-display font-black text-sm flex items-center justify-center hover:bg-[#FFF5EA] transition"
            >
              VER MEUS PEDIDOS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
