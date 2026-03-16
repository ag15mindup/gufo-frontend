"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id?: string | null;
  type?: string;
  merchant_name?: string;
  amount_euro?: number;
  gufo_earned?: number;
  created_at?: string | null;
};

type PartnerStatsResponse = {
  total_transactions: number;
  total_amount: number;
  total_gufo_distributed: number;
  recent_transactions: Transaction[];
  error?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function safeJsonFetch(url: string) {
  const response = await fetch(url);
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

export default function PartnerDashboardPage() {
  const [data, setData] = useState<PartnerStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError("");

        const { response, data } = await safeJsonFetch(
          `${API_URL}/partner/stats`
        );

        if (!response.ok) {
          throw new Error(data?.error || "Errore nel caricamento statistiche");
        }

        setData(data);
      } catch (err: any) {
        setError(err.message || "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          GUFO Partner Dashboard
        </h1>
        <p className="text-slate-300 mb-8">
          Panoramica partner con statistiche e ultime transazioni.
        </p>

        {loading && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-slate-300">
            Caricamento statistiche...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
                <p className="text-slate-400 text-sm mb-2">
                  Totale transazioni
                </p>
                <p className="text-3xl font-bold">
                  {Number(data.total_transactions || 0)}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
                <p className="text-slate-400 text-sm mb-2">Totale importi</p>
                <p className="text-3xl font-bold">
                  €{Number(data.total_amount || 0).toFixed(2)}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
                <p className="text-slate-400 text-sm mb-2">
                  GUFO distribuiti
                </p>
                <p className="text-3xl font-bold">
                  {Number(data.total_gufo_distributed || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-5">Ultime transazioni</h2>

              {data.recent_transactions?.length === 0 ? (
                <p className="text-slate-400">Nessuna transazione trovata.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-700">
                        <th className="py-3 pr-4">Merchant</th>
                        <th className="py-3 pr-4">Tipo</th>
                        <th className="py-3 pr-4">Importo</th>
                        <th className="py-3 pr-4">GUFO</th>
                        <th className="py-3 pr-4">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_transactions.map((tx, index) => (
                        <tr
                          key={tx.id || index}
                          className="border-b border-slate-800 text-slate-200"
                        >
                          <td className="py-3 pr-4">
                            {tx.merchant_name || "-"}
                          </td>
                          <td className="py-3 pr-4">{tx.type || "-"}</td>
                          <td className="py-3 pr-4">
                            €{Number(tx.amount_euro || 0).toFixed(2)}
                          </td>
                          <td className="py-3 pr-4">
                            {Number(tx.gufo_earned || 0).toFixed(2)}
                          </td>
                          <td className="py-3 pr-4">
                            {tx.created_at
                              ? new Date(tx.created_at).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}