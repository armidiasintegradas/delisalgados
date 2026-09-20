"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  CalendarDays,
  UserRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

type CustomerRow = {
  id: string;
  email: string;
  full_name: string;
  whatsapp: string;
  address: string;
  postal_code?: string | null;
  street?: string | null;
  address_number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  reference_point: string;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  orders_count: number;
  total_spent: number;
  last_order_at?: string | null;
  last_order_code?: string | null;
  last_order_status?: string | null;
  last_payment_status?: string | null;
};

const statusLabels: Record<string, string> = {
  generated: "Solicitação recebida",
  contacted: "Cliente contatado",
  confirmed: "Recebido pela Deli",
  preparing: "Em andamento",
  ready: "Pronto para retirada/entrega",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function loadCustomers() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/customers", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar os clientes.");
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Falha ao carregar clientes." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((customer) => {
      const haystack = [
        customer.full_name,
        customer.email,
        customer.whatsapp,
        customer.address,
        customer.postal_code,
        customer.street,
        customer.address_number,
        customer.neighborhood,
        customer.city,
        customer.state,
        customer.reference_point,
        customer.last_order_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [customers, query]);

  async function sendReset(customer: CustomerRow) {
    const confirmed = window.confirm(
      `Enviar um link para ${customer.email} criar uma nova senha?`
    );
    if (!confirmed) return;

    setResettingId(customer.id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao enviar link.");
      setMessage({ type: "success", text: data.message || "Link enviado com sucesso." });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Não foi possível enviar o link." });
    } finally {
      setResettingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase font-black tracking-wider text-[#DF5F45]">
            Banco de clientes
          </div>
          <h1 className="font-display text-2xl font-black text-[#3C1F15] mt-1">
            Clientes cadastrados
          </h1>
          <p className="text-xs text-[#7A6357] mt-1">
            Consulte cadastro, endereço, histórico resumido e envie link seguro para redefinição de senha.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCustomers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl deli-surface-soft border text-xs font-black text-[#3C1F15] disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          ATUALIZAR
        </button>
      </div>

      {message && (
        <div
          className={`rounded-2xl border p-3 text-xs font-semibold flex items-start gap-2 ${
            message.type === "success"
              ? "bg-[#EAF7EE] border-[#CDEEDB] text-[#1E5631]"
              : "bg-[#FFF0EE] border-[#F3C5BC] text-[#9D3825]"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="deli-surface rounded-3xl border p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E8679]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone, CEP, cidade ou pedido..."
            className="deli-field w-full border rounded-2xl pl-9 pr-3 py-3 text-xs text-[#3C1F15] outline-none focus:ring-2 focus:ring-[#DF5F45]/25"
          />
        </div>
        <div className="mt-2 text-[10px] font-bold text-[#8C7367]">
          {filtered.length} {filtered.length === 1 ? "cliente" : "clientes"}
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center text-xs font-bold text-[#7A6357]">
          <Loader2 size={18} className="animate-spin mr-2" />
          Carregando clientes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="deli-surface rounded-3xl border p-10 text-center">
          <UserRound size={30} className="mx-auto text-[#C9AFA1]" />
          <div className="mt-2 text-sm font-black text-[#3C1F15]">Nenhum cliente encontrado</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {filtered.map((customer) => (
            <article key={customer.id} className="deli-surface rounded-3xl border p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#FFF0E2] border border-[#F0D5BE] flex items-center justify-center shrink-0">
                  {customer.avatar_url ? (
                    <img src={customer.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserRound size={24} className="text-[#DF5F45]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-[#3C1F15] text-base truncate">{customer.full_name}</h2>
                  <div className="text-[11px] text-[#7A6357] flex items-center gap-1.5 mt-1 min-w-0">
                    <Mail size={12} className="shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="text-[11px] text-[#7A6357] flex items-center gap-1.5 mt-1">
                    <Phone size={12} className="shrink-0" />
                    <span>{customer.whatsapp}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="deli-surface-soft rounded-2xl border p-3">
                  <div className="text-[9px] uppercase font-black text-[#9E8679]">Pedidos</div>
                  <div className="text-lg font-black text-[#3C1F15]">{customer.orders_count}</div>
                </div>
                <div className="deli-surface-soft rounded-2xl border p-3">
                  <div className="text-[9px] uppercase font-black text-[#9E8679]">Total histórico</div>
                  <div className="text-lg font-black text-[#E05A36]">{formatCurrency(customer.total_spent)}</div>
                </div>
              </div>

              <div className="space-y-2 text-[11px] text-[#614439]">
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-[#E05A36] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-black text-[#3C1F15]">Endereço</div>
                    <div>{customer.address || "Não informado"}</div>
                    {customer.reference_point && (
                      <div className="text-[#8C7367] mt-0.5">Ref.: {customer.reference_point}</div>
                    )}
                  </div>
                </div>

                {customer.last_order_code && (
                  <div className="flex items-start gap-2">
                    <ShoppingBag size={13} className="text-[#E05A36] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-black text-[#3C1F15]">
                        Último pedido: {customer.last_order_code}
                      </div>
                      <div className="text-[#8C7367]">
                        {statusLabels[customer.last_order_status || ""] || customer.last_order_status || "—"}
                      </div>
                    </div>
                  </div>
                )}

                {customer.created_at && (
                  <div className="flex items-center gap-2 text-[#8C7367]">
                    <CalendarDays size={13} />
                    Cliente desde {new Date(customer.created_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => sendReset(customer)}
                disabled={resettingId === customer.id}
                className="w-full py-3 rounded-2xl bg-[#3C1F15] text-white text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {resettingId === customer.id ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <KeyRound size={15} />
                )}
                {resettingId === customer.id ? "ENVIANDO LINK..." : "ENVIAR LINK PARA NOVA SENHA"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
