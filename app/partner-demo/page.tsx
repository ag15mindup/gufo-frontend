"use client";

import { useState } from "react";

type ApiResponse = {
  success?: boolean;
  error?: string;
  gufo_earned?: number;
  new_balance?: number;
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

const DEFAULT_USER_ID = "1f49b570-08ea-4151-9999-825fa0c77d6e";
const PARTNER_API_KEY = "gufo_partner_123456";

function toNumberSafe(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function PartnerDemoPage() {
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [amount, setAmount] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!userId.trim()) {
      setError("Inserisci un user ID");
      return;
    }

    if (toNumberSafe(amount) <= 0) {
      setError("Inserisci un importo valido maggiore di 0");
      return;
    }

    if (!merchantName.trim()) {
      setError("Inserisci il nome del merchant");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/transaction`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-partner-key": PARTNER_API_KEY,
    },
    body: JSON.stringify({
      user_id: userId,
      amount: Number(amount),
      merchant_name: merchantName,
    }),
  }
);

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "Errore durante il pagamento");
      }

      setResult(data);
      setAmount("");
      setMerchantName("");
    } catch (err: any) {
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">GUFO Partner Demo</h1>
        <p className="text-slate-300 mb-8">
          Simula un pagamento partner e accredita automaticamente i GUFO
          all’utente.
        </p>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-lg">
          <form onSubmit={handlePayment} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-300 mb-2">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none"
                placeholder="Inserisci user ID"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Importo (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none"
                placeholder="Es. 120"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Merchant</label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none"
                placeholder="Es. Adidas"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-500 transition px-4 py-3 font-semibold disabled:opacity-60"
            >
              {loading ? "Pagamento in corso..." : "Esegui pagamento"}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
              <h2 className="text-2xl font-bold text-green-300 mb-4">
                Pagamento completato
              </h2>

              <div className="space-y-2 text-slate-100">
                <p>
                  <span className="text-slate-300">Merchant:</span>{" "}
                  {result.transaction?.benefit || "-"}
                </p>
                <p>
                  <span className="text-slate-300">Importo:</span> €
                  {Number(result.transaction?.amount || 0).toFixed(2)}
                </p>
                <p>
                  <span className="text-slate-300">GUFO guadagnati:</span>{" "}
                  {Number(result.gufo_earned || result.transaction?.gufo_earned || 0).toFixed(2)}
                </p>
                <p>
                  <span className="text-slate-300">Nuovo saldo:</span>{" "}
                  {Number(result.new_balance || 0).toFixed(2)} GUFO
                </p>
                <p>
                  <span className="text-slate-300">Tipo:</span>{" "}
                  {result.transaction?.tipo || "-"}
                </p>
                <p>
                  <span className="text-slate-300">Data:</span>{" "}
                  {result.transaction?.created_at
                    ? new Date(result.transaction.created_at).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}