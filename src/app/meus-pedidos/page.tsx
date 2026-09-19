"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, ClipboardList, Clock, CheckCircle2 } from "lucide-react";
import { BottomNav } from "@/components/public/BottomNav";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/formatters";

export default function MeusPedidosPage() {
  const [code, setCode] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setNotFound(false);
    setSearchedOrder(null);

    try {
      const cleanCode = code.trim().toUpperCase();
      const res = await fetch(`/api/orders/${cleanCode}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setSearchedOrder(data.order);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    generated: "Solicitação gerada",
    contacted: "Cliente contatado",
    confirmed: "Confirmado pela Deli",
    preparing: "Em preparação",
    completed: "Concluído",
    cancelled: "Cancelado",
  };

  return (
    <div className="w-full max-w-[440px] lg:max-w-none mx-auto min-h-screen bg-[#FFFDF9] shadow-2xl lg:shadow-none flex flex-col pb-24 lg:pb-16 relative">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-b from-[#E25C37] via-[#DF532E] to-[#D5451F] text-white shadow-md">
        <div className="w-full max-w-[1000px] mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
            >
              <ArrowLeft size={18} />
            </Link>
            <img
              src="/deli-logo-cream-official.png"
              alt="Deli Salgados"
              className="h-9 w-auto object-contain select-none"
            />
            <div>
              <h1 className="text-base lg:text-lg font-bold leading-tight">Consultar Pedido</h1>
              <span className="text-[10px] text-[#FCE9D8] tracking-wide block">
                Acompanhe o status pelo código DL-XXXX
              </span>
            </div>
          </div>

          <Link
            href="/"
            className="hidden lg:inline-flex px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition"
          >
            Voltar ao Cardápio
          </Link>
        </div>
      </header>

      <main className="w-full max-w-[440px] lg:max-w-[720px] mx-auto p-4 lg:p-8 space-y-4 flex-1">
        {/* Search input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex: DL-0001"
            className="flex-1 bg-white border border-[#EBDCCF] rounded-2xl px-4 py-3 text-sm uppercase text-[#3C1F15] focus:outline-none focus:ring-2 focus:ring-[#E05A36]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-[#3C1F15] text-white font-bold text-xs shadow hover:bg-[#27120A] transition shrink-0"
          >
            {loading ? "..." : "Buscar"}
          </button>
        </form>

        {notFound && (
          <div className="p-4 bg-white rounded-2xl border border-[#F0DCBE] text-center">
            <p className="text-xs text-[#7A6357]">
              Nenhum pedido encontrado com o código informado.
            </p>
          </div>
        )}

        {searchedOrder && (
          <div className="bg-white p-5 rounded-3xl border border-[#EBDCCF] shadow-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#F4E8DB] pb-3">
              <div>
                <span className="text-xs text-[#8C7367]">Código:</span>
                <div className="text-lg font-black text-[#E05A36]">
                  {searchedOrder.public_code}
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF4E8] text-[#8C5237]">
                {statusLabels[searchedOrder.status] || searchedOrder.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#614439]">
              <div><strong>Cliente:</strong> {searchedOrder.customer_name}</div>
              <div><strong>Data desejada:</strong> {searchedOrder.desired_date}</div>
              <div><strong>Total:</strong> {formatCurrency(searchedOrder.total)}</div>
            </div>

            <div className="border-t border-[#F4E8DB] pt-3">
              <span className="text-[11px] font-bold text-[#8C5237] uppercase block mb-1.5">
                Itens:
              </span>
              <div className="space-y-1">
                {(searchedOrder.items || []).map((item) => (
                  <div key={item.id} className="text-xs flex justify-between text-[#3C1F15]">
                    <span>
                      {item.quantity} {item.unit_label_snapshot} — {item.product_name_snapshot}
                    </span>
                    <span className="font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
