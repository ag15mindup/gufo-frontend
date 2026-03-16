"use client";

import { useEffect, useMemo, useState } from "react";

type Transaction = {
  id?: string | null;
  type?: string;
  merchant_name?: string;
  amount_euro?: number;
  gufo_earned?: number;
  created_at?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const USER_ID = "1f49b570-08ea-4151-9999-825fa0c77d6e";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [merchantFilter, setMerchantFilter] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        setError("");

        const { response, data } = await safeJsonFetch(
          `${API_URL}/transactions/${USER_ID}`
        );

        if (!response.ok) {
          throw new Error(data?.error || "Errore nel caricamento transazioni");
        }

        setTransactions(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const transactionTypes = useMemo(() => {
    const types = Array.from(
      new Set(
        transactions
          .map((tx) => String(tx.type || "").trim())
          .filter((value) => value.length > 0)
      )
    );
    return types;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType =
        typeFilter === "all" ||
        String(tx.type || "").toLowerCase() === typeFilter.toLowerCase();

      const matchesMerchant = String(tx.merchant_name || "")
        .toLowerCase()
        .includes(merchantFilter.toLowerCase().trim());

      return matchesType && matchesMerchant;
    });
  }, [transactions, typeFilter, merchantFilter]);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          GUFO Transactions
        </h1>
        <p className="text-slate-300 mb-8">
          Storico completo delle transazioni utente.
        </p>

        {loading && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-slate-300">
            Caricamento transazioni...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-lg mb-8">
              <h2 className="text-2xl font-bold mb-5">Filtri</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Tipo transazione
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none"
                  >
                    <option value="all">Tutti</option>
                    {transactionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Cerca merchant
                  </label>
                  <input
                    type="text"
                    value={merchantFilter}
                    onChange={(e) => setMerchantFilter(e.target.value)}
                    className="w-full rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none"
                    placeholder="Es. Adidas"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold">Tutte le transazioni</h2>
                <span className="text-slate-400 text-sm">
                  Totale: {filteredTransactions.length}
                </span>
              </div>

              {filteredTransactions.length === 0 ? (
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
                      {filteredTransactions.map((tx, index) => (
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