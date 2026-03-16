"use client";

import { useEffect, useState } from "react";

type Transaction = {
  id?: string;
  type?: string;
  tipo?: string;
  merchant_name?: string;
  benefit?: string;
  merchant?: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const USER_ID = "1f49b570-08ea-4151-9999-825fa0c77d6e";

function formatLevel(level: string) {
  if (!level) return "Basic";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getMonthLabel(index: number) {
  const months = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];
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

export default function DashboardPage() {
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
      try {
        setLoading(true);
        setError("");

        const { response, data } = await safeJsonFetch(
          `${API_URL}/dashboard/${USER_ID}`
        );

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

        const normalizedTransactions: Transaction[] = rawTransactions.map(
          (tx: any) => ({
            id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id,
            type: getTransactionType(tx),
            merchant_name: getTransactionMerchant(tx),
            amount_euro: getTransactionAmount(tx),
            gufo_earned: getTransactionGufo(tx),
            created_at: tx?.created_at ?? tx?.raw?.created_at,
            raw: tx?.raw ?? tx,
          })
        );

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
  }, []);

  if (loading) {
    return (
      <div style={{ color: "white" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>GUFO Dashboard</h1>
        <p>Caricamento dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "white" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>GUFO Dashboard</h1>
        <p style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  const maxMonthlyValue = Math.max(...dashboardData.monthlyExpenses, 1);

  return (
    <div style={{ color: "white" }}>
      <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "10px" }}>
        GUFO Dashboard
      </h1>
      <p style={{ color: "#cbd5e1", marginBottom: "30px" }}>
        Panoramica account utente.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "#1e293b",
            borderRadius: "16px",
            padding: "24px",
            minHeight: "420px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "999px",
              background: "#facc15",
              color: "#111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              marginBottom: "20px",
            }}
          >
            U
          </div>

          <h2 style={{ margin: 0, fontSize: "34px" }}>Utente GUFO</h2>
          <p style={{ color: "#cbd5e1", marginTop: "8px" }}>email@gufo.app</p>

          <div
            style={{
              marginTop: "16px",
              background: "#22c55e",
              color: "white",
              padding: "8px 16px",
              borderRadius: "999px",
              fontWeight: "bold",
            }}
          >
            {formatLevel(dashboardData.level)}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "40px", marginTop: 0, marginBottom: "20px" }}>
            Riepilogo account
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                background: "#334155",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div style={{ color: "#e2e8f0", marginBottom: "8px" }}>Saldo GUFO</div>
              <div style={{ fontSize: "48px", fontWeight: "bold" }}>
                {dashboardData.balanceGufo.toFixed(2)}
              </div>
            </div>

            <div
              style={{
                background: "#334155",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div style={{ color: "#e2e8f0", marginBottom: "8px" }}>Cashback</div>
              <div style={{ fontSize: "48px", fontWeight: "bold" }}>
                {dashboardData.cashbackPercent}%
              </div>
            </div>

            <div
              style={{
                background: "#334155",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div style={{ color: "#e2e8f0", marginBottom: "8px" }}>Spesa stagione</div>
              <div style={{ fontSize: "48px", fontWeight: "bold" }}>
                € {dashboardData.totalSpent.toFixed(2)}
              </div>
            </div>

            <div
              style={{
                background: "#334155",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div style={{ color: "#e2e8f0", marginBottom: "8px" }}>Livello</div>
              <div style={{ fontSize: "48px", fontWeight: "bold" }}>
                {formatLevel(dashboardData.level)}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#1e293b",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "28px" }}>
              Grafico spese mensili
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                gap: "12px",
                alignItems: "end",
                height: "260px",
              }}
            >
              {dashboardData.monthlyExpenses.map((value, index) => {
                const height =
                  value > 0 ? `${(value / maxMonthlyValue) * 100}%` : "4px";

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "end",
                      height: "100%",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}>
                      €{value.toFixed(0)}
                    </span>
                    <div
                      style={{
                        width: "28px",
                        height,
                        background: "#3b82f6",
                        borderTopLeftRadius: "6px",
                        borderTopRightRadius: "6px",
                      }}
                    />
                    <span style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "8px" }}>
                      {getMonthLabel(index)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: "#1e293b",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "28px" }}>
              Transazioni recenti
            </h3>

            {dashboardData.transactions.length === 0 ? (
              <p style={{ color: "#94a3b8" }}>Nessuna transazione disponibile</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: "#94a3b8", borderBottom: "1px solid #334155" }}>
                      <th style={{ padding: "12px 0", textAlign: "left" }}>Tipo</th>
                      <th style={{ padding: "12px 0", textAlign: "left" }}>Merchant</th>
                      <th style={{ padding: "12px 0", textAlign: "left" }}>Importo</th>
                      <th style={{ padding: "12px 0", textAlign: "left" }}>GUFO</th>
                      <th style={{ padding: "12px 0", textAlign: "left" }}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.transactions.slice(0, 8).map((tx, index) => (
                      <tr
                        key={tx.id || index}
                        style={{ borderBottom: "1px solid #334155" }}
                      >
                        <td style={{ padding: "14px 0", color: "#e2e8f0" }}>
                          {getTransactionType(tx)}
                        </td>
                        <td style={{ padding: "14px 0", color: "#e2e8f0" }}>
                          {getTransactionMerchant(tx)}
                        </td>
                        <td style={{ padding: "14px 0", color: "#86efac", fontWeight: "bold" }}>
                          €{getTransactionAmount(tx).toFixed(2)}
                        </td>
                        <td style={{ padding: "14px 0", color: "#e2e8f0" }}>
                          {getTransactionGufo(tx).toFixed(2)}
                        </td>
                        <td style={{ padding: "14px 0", color: "#cbd5e1" }}>
                          {tx.created_at
                            ? new Date(tx.created_at).toLocaleString("it-IT")
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}