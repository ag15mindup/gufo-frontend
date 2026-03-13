"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Transaction = {
  id?: string;
  type?: string;
  tipo?: string;
  merchant_name?: string;
  benefit?: string;
  amount_euro?: number;
  amount?: number;
  gufo_earned?: number;
  gufo?: number;
  created_at?: string;
  raw?: any;
};

type DashboardData = {
  balanceGufo: number;
  totalTransactions: number;
  totalSpent: number;
  totalGufoEarned: number;
  level: string;
  cashbackPercent: number;
  transactions: Transaction[];
  monthlyExpenses: number[];
};

function formatLevel(level: string) {
  if (!level) return "Basic";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getMonthLabel(index: number) {
  const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  return months[index] || "";
}

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getTransactionAmount(tx: any) {
  return toNumberSafe(
    tx?.amount_euro ??
      tx?.amount ??
      tx?.importo ??
      tx?.raw?.amount_euro ??
      tx?.raw?.amount ??
      tx?.raw?.importo
  );
}

function getTransactionGufo(tx: any) {
  return toNumberSafe(
    tx?.gufo_earned ??
      tx?.gufo ??
      tx?.raw?.gufo_earned ??
      tx?.raw?.gufo
  );
}

function getTransactionMerchant(tx: any) {
  return (
    tx?.merchant_name ??
    tx?.benefit ??
    tx?.merchant ??
    tx?.raw?.merchant_name ??
    tx?.raw?.benefit ??
    tx?.raw?.merchant ??
    "-"
  );
}

function getTransactionType(tx: any) {
  return (
    tx?.type ??
    tx?.tipo ??
    tx?.raw?.type ??
    tx?.raw?.tipo ??
    "-"
  );
}

export default function DashboardPage() {
  const params = useParams();
  const userId = Array.isArray(params?.userId) ? params.userId[0] : params?.userId;

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balanceGufo: 0,
    totalTransactions: 0,
    totalSpent: 0,
    totalGufoEarned: 0,
    level: "Basic",
    cashbackPercent: 2,
    transactions: [],
    monthlyExpenses: Array(12).fill(0),
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      if (!userId || typeof userId !== "string") {
        setError("User ID non valido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

       const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/dashboard/1f49b570-08ea-4151-9999-825fa0c77d6e`,
  {
    cache: "no-store",
  }
);
    
  


        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || "Errore nel recupero dashboard");
        }

        const dashboard = data ?? {};
        const wallet = dashboard?.wallet ?? {};
        const stats = dashboard?.stats ?? {};
        const rawTransactions = Array.isArray(dashboard?.transactions)
          ? dashboard.transactions
          : [];

        const monthlyExpensesRaw = Array.isArray(stats?.monthlyExpenses)
          ? stats.monthlyExpenses
          : Array.isArray(stats?.monthly_expenses)
          ? stats.monthly_expenses
          : Array(12).fill(0);

        const monthlyExpenses = monthlyExpensesRaw.map((value: unknown) =>
          toNumberSafe(value)
        );

        const normalizedTransactions: Transaction[] = rawTransactions.map((tx: any) => ({
          id: tx?.id ?? tx?.raw?.id,
          type: getTransactionType(tx),
          merchant_name: getTransactionMerchant(tx),
          amount_euro: getTransactionAmount(tx),
          gufo_earned: getTransactionGufo(tx),
          created_at: tx?.created_at ?? tx?.raw?.created_at,
          raw: tx?.raw ?? tx,
        }));

        setDashboardData({
          balanceGufo: toNumberSafe(stats?.balance_gufo ?? wallet?.balance_gufo),
          totalTransactions: toNumberSafe(
            stats?.total_transactions ?? normalizedTransactions.length
          ),
          totalSpent: toNumberSafe(stats?.total_spent),
          totalGufoEarned: toNumberSafe(stats?.gufo_earned),
          level: String(stats?.level ?? "Basic"),
          cashbackPercent: toNumberSafe(stats?.cashback_percent ?? 2),
          transactions: normalizedTransactions,
          monthlyExpenses,
        });
      } catch (err: any) {
        setError(err.message || "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard GUFO</h1>
        <p>Caricamento dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard GUFO</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Dashboard GUFO</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl p-6 text-white bg-gradient-to-r from-blue-900 to-blue-500 shadow">
          <p className="text-sm opacity-80 mb-2">Saldo disponibile</p>
          <h2 className="text-5xl font-bold">
            {dashboardData.balanceGufo.toFixed(2)} GUFO
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-2xl font-semibold mb-4 text-gray-900">Statistiche</h3>
          <div className="space-y-3 text-gray-700">
            <p>Totale transazioni: {dashboardData.totalTransactions}</p>
            <p>Totale speso: €{dashboardData.totalSpent.toFixed(2)}</p>
            <p>GUFO guadagnati: {dashboardData.totalGufoEarned.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-2xl font-semibold mb-4 text-gray-900">Livello</h3>
          <h2 className="text-5xl font-bold capitalize text-gray-900">
            {formatLevel(dashboardData.level)}
          </h2>
          <p className="text-gray-600 mt-3">
            Cashback corrente: {dashboardData.cashbackPercent}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-gray-900">Grafico spese mensili</h3>

        <div className="grid grid-cols-12 gap-4 items-end h-64">
          {dashboardData.monthlyExpenses.map((value, index) => {
            const maxValue = Math.max(...dashboardData.monthlyExpenses, 1);
            const height = value > 0 ? `${(value / maxValue) * 100}%` : "4px";

            return (
              <div key={index} className="flex flex-col items-center justify-end h-full">
                <span className="text-xs text-gray-500 mb-2">€{value.toFixed(0)}</span>
                <div className="w-8 bg-blue-500 rounded-t-md" style={{ height }} />
                <span className="text-xs text-gray-600 mt-2">{getMonthLabel(index)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-2xl font-semibold mb-6 text-gray-900">Ultime transazioni</h3>

        {dashboardData.transactions.length === 0 ? (
          <p className="text-gray-500">Nessuna transazione disponibile</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="py-3">Tipo</th>
                  <th className="py-3">Brand</th>
                  <th className="py-3">Importo</th>
                  <th className="py-3">GUFO</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.transactions.map((tx, index) => (
                  <tr key={tx.id || index} className="border-b last:border-b-0">
                    <td className="py-4 text-gray-700">{getTransactionType(tx)}</td>
                    <td className="py-4 text-gray-700">{getTransactionMerchant(tx)}</td>
                    <td className="py-4 text-green-600">
                      €{getTransactionAmount(tx).toFixed(2)}
                    </td>
                    <td className="py-4 text-gray-700">
                      {getTransactionGufo(tx).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}