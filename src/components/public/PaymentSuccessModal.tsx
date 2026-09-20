"use client";

import React from "react";
import { Check, Heart, X, ArrowRight } from "lucide-react";

interface PaymentSuccessModalProps {
  firstName: string;
  onClose: (destination?: "/" | "/meus-pedidos") => void;
}

export function PaymentSuccessModal({ firstName, onClose }: PaymentSuccessModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2A160F]/55 backdrop-blur-[4px] p-2.5 sm:p-4 lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deli-payment-success-title"
    >
      <div className="relative w-full max-w-[390px] sm:max-w-[430px] md:max-w-[460px] lg:max-w-[500px] max-h-[96dvh] overflow-y-auto rounded-[30px] sm:rounded-[34px] bg-[#FFFDF6] border border-[#F0D5BE] shadow-2xl">
        {/* Faixa coral superior com a mesma curva do layout aprovado */}
        <div className="relative h-[84px] sm:h-[94px] overflow-hidden rounded-t-[30px] sm:rounded-t-[34px] bg-[#F05A3E]">
          <div className="absolute -bottom-8 sm:-bottom-9 left-[-4%] w-[108%] h-[62px] sm:h-[72px] rounded-[50%] bg-[#FFFDF6]" />
          <button
            type="button"
            onClick={() => onClose()}
            aria-label="Fechar mensagem"
            className="absolute top-3 right-3 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#FFF8EA] text-[#3C1F15] flex items-center justify-center shadow-sm active:scale-95 transition"
          >
            <X size={22} strokeWidth={2.6} />
          </button>
        </div>

        <div className="px-5 sm:px-7 lg:px-8 pb-6 sm:pb-7 -mt-1 text-center">
          {/* Selo de confirmação */}
          <div className="relative mx-auto w-[86px] h-[86px] sm:w-[96px] sm:h-[96px] rounded-full bg-[#55B957] flex items-center justify-center text-white shadow-lg border-[7px] border-[#FFFDF6]">
            <Check size={44} strokeWidth={3.4} />
            <span className="absolute -left-10 top-4 text-[#F05A3E] -rotate-12">
              <Heart size={26} strokeWidth={2.8} />
            </span>
            <span className="absolute -right-10 top-7 text-[#F05A3E] rotate-12">
              <Heart size={29} strokeWidth={2.8} />
            </span>
          </div>

          {/* Título */}
          <h2
            id="deli-payment-success-title"
            className="font-display text-[38px] leading-[0.98] sm:text-[44px] md:text-[48px] font-black text-[#3C1F15] mt-2"
          >
            Obrigado,
            <br />
            {firstName}!
          </h2>

          <p className="font-display text-[18px] sm:text-[20px] md:text-[21px] font-black leading-[1.18] text-[#3C1F15] mt-4 px-1">
            foi uma DELI poder te atender,
            <br />
            vê se volta logo heim?
          </p>

          {/* Marca oficial original, com transparência preservada */}
          <div className="mt-5 sm:mt-6 flex justify-center">
            <img
              src="/deli-logo-coral-official.png"
              alt="Deli Salgados"
              className="block w-auto h-auto max-h-[220px] sm:max-h-[245px] md:max-h-[265px] max-w-[74%] sm:max-w-[72%] object-contain"
              draggable={false}
            />
          </div>

          {/* Assinatura */}
          <div className="mt-4 mx-auto max-w-[88%] rounded-full bg-[#FFF0DE] px-4 py-2.5 text-[11px] sm:text-xs font-bold text-[#5E3626] flex items-center justify-center gap-2">
            <span>Sabor que torna tudo mais especial.</span>
            <Heart size={19} className="text-[#F05A3E] shrink-0" strokeWidth={2.8} />
          </div>

          {/* Ações exatamente na ordem do layout aprovado */}
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => onClose("/")}
              className="w-full min-h-[54px] sm:min-h-[58px] rounded-[24px] bg-[#F05A3E] hover:bg-[#DE4E34] text-white font-display font-black text-[17px] sm:text-[19px] flex items-center justify-center gap-2 transition shadow-[0_8px_18px_rgba(240,90,62,0.22)] active:scale-[0.99]"
            >
              VOLTAR AO CARDÁPIO
              <ArrowRight size={22} strokeWidth={2.3} />
            </button>

            <button
              type="button"
              onClick={() => onClose("/meus-pedidos")}
              className="w-full min-h-[50px] sm:min-h-[54px] rounded-[22px] border-[2.5px] border-[#5A2E20] bg-transparent text-[#3C1F15] font-display font-black text-[15px] sm:text-[17px] flex items-center justify-center hover:bg-[#FFF5EA] transition active:scale-[0.99]"
            >
              VER MEUS PEDIDOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
