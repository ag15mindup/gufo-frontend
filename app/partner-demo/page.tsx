"use client";

import { useState } from "react";

type CustomerResponse = {
  id: string;
  customer_code: string;
  balance_gufo: number;
  balance_eur: number;
  level: string;
  cashback_percent: number;
  season_spent: number;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  gufo_earned?: number;
  new_balance?: number;
  merchant_name?: string;
  transaction?: {
    id?: string;
    amount?: number;
    gufo_earned?: number;
    cashback?: number;
    benefit?: string;
    tipo?: string;
    created_at?: string;
  };
};

const DEFAULT_CUSTOMER_CODE = "GUFO-123456";
const PARTNER_API_KEY = "gufo_partner_123456";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Basic";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

async function safeJsonFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `L'API non ha restituito JSON. Controlla NEXT_PUBLIC_API_URL: ${API_URL}`
    );
  }

  const data = text ? JSON.parse(text) : {};
  return { response, data };
}

export default function PartnerDemoPage() {
  const [customerCode, setCustomerCode] = useState(DEFAULT_CUSTOMER_CODE);
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [amount, setAmount] = useState("50");
  const [merchantName, setMerchantName] = useState("adidas");
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  async function refreshCustomer(code: string) {
    const refreshed = await safeJsonFetch(
      `${API_URL}/partner/customer?code=${encodeURIComponent(code)}`
    );

    if (refreshed.response.ok) {
      setCustomer({
        id: refreshed.data.id,
        customer_code: refreshed.data.customer_code,
        balance_gufo: toNumberSafe(refreshed.data.balance_gufo),
        balance_eur: toNumberSafe(refreshed.data.balance_eur),
        level: String(refreshed.data.level || "basic"),
        cashback_percent: toNumberSafe(refreshed.data.cashback_percent),
        season_spent: toNumberSafe(refreshed.data.season_spent),
      });
    }
  }

  async function handleSearchCustomer(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setResult(null);
    setCustomer(null);

    const code = customerCode.trim();

    if (!code) {
      setError("Inserisci un codice cliente");
      return;
    }

    try {
      setLoadingCustomer(true);

      const { response, data } = await safeJsonFetch(
        `${API_URL}/partner/customer?code=${encodeURIComponent(code)}`
      );

      if (!response.ok) {
        throw new Error(data?.error || "Cliente non trovato");
      }

      setCustomer({
        id: data.id,
        customer_code: data.customer_code,
        balance_gufo: toNumberSafe(data.balance_gufo),
        balance_eur: toNumberSafe(data.balance_eur),
        level: String(data.level || "basic"),
        cashback_percent: toNumberSafe(data.cashback_percent),
        season_spent: toNumberSafe(data.season_spent),
      });
    } catch (err: any) {
      setError(err.message || "Errore durante la ricerca cliente");
    } finally {
      setLoadingCustomer(false);
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!customer) {
      setError("Cerca prima un cliente valido");
      return;
    }

    const finalAmount = toNumberSafe(amount);

    if (finalAmount <= 0) {
      setError("Inserisci un importo valido maggiore di 0");
      return;
    }

    if (!merchantName.trim()) {
      setError("Inserisci il nome del merchant");
      return;
    }

    try {
      setLoadingPayment(true);

      const { response, data } = await safeJsonFetch(`${API_URL}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-partner-key": PARTNER_API_KEY,
        },
        body: JSON.stringify({
          user_id: customer.id,
          amount: finalAmount,
          merchant_name: merchantName.trim(),
        }),
      });

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "Errore durante il pagamento");
      }

      setResult(data);
      await refreshCustomer(customer.customer_code);
      setAmount("");
    } catch (err: any) {
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoadingPayment(false);
    }
  }

  const previewAmount = toNumberSafe(amount);
  const previewCashback = customer
    ? Number(
        (
          (previewAmount * toNumberSafe(customer.cashback_percent)) /
          100
        ).toFixed(2)
      )
    : 0;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-3 break-words text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          GUFO Partner Demo
        </h1>

        <p className="mb-6 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base md:mb-8">
          Cerca il cliente tramite codice GUFO e simula un pagamento partner.
        </p>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg sm:rounded-3xl sm:p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <form onSubmit={handleSearchCustomer} className="space-y-5">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Cerca cliente
              </h2>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Codice cliente
                </label>
                <input
                  type="text"
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                  placeholder="Es. GUFO-123456"
                />
              </div>

              <button
                type="submit"
                disabled={loadingCustomer}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
              >
                {loadingCustomer ? "Ricerca cliente..." : "Cerca cliente"}
              </button>

              {customer && (
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 sm:p-5">
                  <h3 className="mb-4 text-lg font-bold text-blue-300 sm:text-xl">
                    Cliente trovato
                  </h3>

                  <div className="grid grid-cols-1 gap-4 text-slate-100 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Codice cliente</p>
                      <p className="break-words text-lg font-bold sm:text-xl">
                        {customer.customer_code}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Livello</p>
                      <p className="text-lg font-bold sm:text-xl">
                        {formatLevel(customer.level)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Saldo GUFO</p>
                      <p className="break-words text-lg font-bold sm:text-xl">
                        {toNumberSafe(customer.balance_gufo).toFixed(2)} GUFO
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Cashback</p>
                      <p className="text-lg font-bold sm:text-xl">
                        {toNumberSafe(customer.cashback_percent).toFixed(2)}%
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Saldo €</p>
                      <p className="break-words text-lg font-bold sm:text-xl">
                        €{toNumberSafe(customer.balance_eur).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-800/70 p-4">
                      <p className="text-sm text-slate-400">Spesa stagione</p>
                      <p className="break-words text-lg font-bold sm:text-xl">
                        €{toNumberSafe(customer.season_spent).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>

            <form onSubmit={handlePayment} className="space-y-5">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Registra pagamento
              </h2>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Merchant
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                  placeholder="Es. Adidas"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Importo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none"
                  placeholder="Es. 120"
                />
              </div>

              {customer && previewAmount > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                  <h3 className="mb-3 text-base font-semibold text-slate-200 sm:text-lg">
                    Riepilogo pagamento
                  </h3>

                  <div className="space-y-2 break-words text-sm text-slate-300 sm:text-base">
                    <p>
                      <span className="text-slate-400">Cliente:</span>{" "}
                      {customer.customer_code}
                    </p>
                    <p>
                      <span className="text-slate-400">Merchant:</span>{" "}
                      {merchantName.trim() || "-"}
                    </p>
                    <p>
                      <span className="text-slate-400">Importo:</span> €
                      {previewAmount.toFixed(2)}
                    </p>
                    <p>
                      <span className="text-slate-400">Cashback applicato:</span>{" "}
                      {toNumberSafe(customer.cashback_percent).toFixed(2)}%
                    </p>
                    <p>
                      <span className="text-slate-400">GUFO previsti:</span>{" "}
                      {previewCashback.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingPayment || !customer}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {loadingPayment ? "Pagamento in corso..." : "Esegui pagamento"}
              </button>

              {!customer && (
                <p className="text-sm text-slate-400">
                  Cerca prima un cliente per abilitare il pagamento.
                </p>
              )}
            </form>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {result?.success && (
            <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 sm:p-5">
              <h2 className="mb-4 text-xl font-bold text-green-300 sm:text-2xl">
                Pagamento completato
              </h2>

              <div className="grid grid-cols-1 gap-4 text-slate-100 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Merchant</p>
                  <p className="break-words text-lg font-bold">
                    {result.merchant_name || result.transaction?.benefit || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Importo</p>
                  <p className="break-words text-lg font-bold">
                    €{toNumberSafe(result.transaction?.amount).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">GUFO guadagnati</p>
                  <p className="break-words text-lg font-bold">
                    {toNumberSafe(
                      result.gufo_earned || result.transaction?.gufo_earned
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Nuovo saldo</p>
                  <p className="break-words text-lg font-bold">
                    {toNumberSafe(result.new_balance).toFixed(2)} GUFO
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Tipo</p>
                  <p className="break-words text-lg font-bold">
                    {result.transaction?.tipo || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Data</p>
                  <p className="break-words text-lg font-bold">
                    {result.transaction?.created_at
                      ? new Date(result.transaction.created_at).toLocaleString("it-IT")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}