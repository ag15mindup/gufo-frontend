"use client";

import { useEffect, useState } from "react";

type WalletResponse = {
  user_id?: string;
  balance_gufo?: number | string | null;
  balance_eur?: number | string | null;
  season_spent?: number | string | null;
  current_level?: string | null;
  cashback_percent?: number | string | null;
  last_season_reset?: string | null;
};

type Transaction = {
  id?: string;
  transaction_id?: string;
  type?: string;
  tipo?: string;
  merchant_name?: string;
  benefit?: string;
  merchant?: string;
  amount_euro?: number | string | null;
  amount?: number | string | null;
  importo?: number | string | null;
  gufo_earned?: number | string | null;
  gufo?: number | string | null;
  cashback?: number | string | null;
  cashback_percent?: number | string | null;
  created_at?: string | null;
  raw?: any;
};

type WalletData = {
  balanceGufo: number;
  balanceEuro: number;
  seasonSpent: number;
  level: string;
  cashbackPercent: number;
  totalTransactions: number;
  totalGufoEarned: number;
  transactions: Transaction[];
  lastSeasonReset: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const USER_ID = "1f49b570-08ea-4151-9999-825fa0c77d6e";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Basic";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
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
  const direct = toNumberSafe(
    tx?.gufo_earned ??
      tx?.gufo ??
      tx?.raw?.gufo_earned ??
      tx?.raw?.gufo
  );

  if (direct > 0) return direct;

  const amount = getTransactionAmount(tx);
  const cashback = toNumberSafe(
    tx?.cashback_percent ??
      tx?.cashback ??
      tx?.raw?.cashback_percent ??
      tx?.raw?.cashback
  );

  if (amount > 0 && cashback > 0) {
    return Number(((amount * cashback) / 100).toFixed(2));
  }

  return 0;
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

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("it-IT");
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

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData>({
    balanceGufo: 0,
    balanceEuro: 0,
    seasonSpent: 0,
    level: "Basic",
    cashbackPercent: 2,
    totalTransactions: 0,
    totalGufoEarned: 0,
    transactions: [],
    lastSeasonReset: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWalletPage() {
      try {
        setLoading(true);
        setError("");

        const [walletRes, transactionsRes] = await Promise.all([
          safeJsonFetch(`${API_URL}/wallet/${USER_ID}`),
          safeJsonFetch(`${API_URL}/transactions/${USER_ID}`),
        ]);

        if (!walletRes.response.ok || walletRes.data?.success === false) {
          throw new Error(walletRes.data?.error || "Errore nel recupero wallet");
        }

        if (
          !transactionsRes.response.ok ||
          transactionsRes.data?.success === false
        ) {
          throw new Error(
            transactionsRes.data?.error || "Errore nel recupero transazioni"
          );
        }

        const wallet: WalletResponse = walletRes.data ?? {};
        const rawTransactions = Array.isArray(transactionsRes.data)
          ? transactionsRes.data
          : [];

        const normalizedTransactions: Transaction[] = rawTransactions.map(
          (tx: any) => ({
            id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id,
            transaction_id: tx?.transaction_id ?? tx?.id ?? tx?.raw?.transaction_id,
            type: getTransactionType(tx),
            merchant_name: getTransactionMerchant(tx),
            amount_euro: getTransactionAmount(tx),
            gufo_earned: getTransactionGufo(tx),
            cashback:
              tx?.cashback ??
              tx?.cashback_percent ??
              tx?.raw?.cashback ??
              tx?.raw?.cashback_percent ??
              null,
            created_at: tx?.created_at ?? tx?.raw?.created_at ?? null,
            raw: tx?.raw ?? tx,
          })
        );

        const totalGufoEarned = normalizedTransactions.reduce(
          (sum, tx) => sum + getTransactionGufo(tx),
          0
        );

        setWalletData({
          balanceGufo: toNumberSafe(wallet?.balance_gufo),
          balanceEuro: toNumberSafe(wallet?.balance_eur),
          seasonSpent: toNumberSafe(wallet?.season_spent),
          level: String(wallet?.current_level ?? "Basic"),
          cashbackPercent: toNumberSafe(wallet?.cashback_percent ?? 2),
          totalTransactions: normalizedTransactions.length,
          totalGufoEarned: Number(totalGufoEarned.toFixed(2)),
          transactions: normalizedTransactions,
          lastSeasonReset: String(wallet?.last_season_reset ?? ""),
        });
      } catch (err: any) {
        setError(err?.message || "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    loadWalletPage();
  }, []);

  if (loading) {
    return (
      <div style={{ color: "white" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>Wallet</h1>
        <p>Caricamento wallet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "white" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>Wallet</h1>
        <p style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ color: "white" }}>
      <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "10px" }}>
        Wallet
      </h1>

      <p style={{ color: "#cbd5e1", marginBottom: "30px" }}>
        Panoramica saldo, cashback e movimenti.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
            {walletData.balanceGufo.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            background: "#334155",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ color: "#e2e8f0", marginBottom: "8px" }}>Saldo Euro</div>
          <div style={{ fontSize: "48px", fontWeight: "bold" }}>
            € {walletData.balanceEuro.toFixed(2)}
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
            € {walletData.seasonSpent.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            background: "#334155",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ color: "#e2e8f0", marginBottom: "8px" }}>Cashback attuale</div>
          <div style={{ fontSize: "48px", fontWeight: "bold" }}>
            {walletData.cashbackPercent}%
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
            {formatLevel(walletData.level)}
          </div>
        </div>

        <div
          style={{
            background: "#334155",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ color: "#e2e8f0", marginBottom: "8px" }}>GUFO guadagnati</div>
          <div style={{ fontSize: "48px", fontWeight: "bold" }}>
            {walletData.totalGufoEarned.toFixed(2)}
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
        <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "30px" }}>
          Riepilogo wallet
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "16px",
          }}
        >
          <div
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <div style={{ color: "#94a3b8", marginBottom: "8px" }}>Transazioni</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>
              {walletData.totalTransactions}
            </div>
          </div>

          <div
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <div style={{ color: "#94a3b8", marginBottom: "8px" }}>Livello attuale</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>
              {formatLevel(walletData.level)}
            </div>
          </div>

          <div
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <div style={{ color: "#94a3b8", marginBottom: "8px" }}>Cashback</div>
            <div style={{ fontSize: "28px", fontWeight: "bold" }}>
              {walletData.cashbackPercent}%
            </div>
          </div>

          <div
            style={{
              background: "#0f172a",
              borderRadius: "12px",
              padding: "18px",
            }}
          >
            <div style={{ color: "#94a3b8", marginBottom: "8px" }}>
              Ultimo reset stagione
            </div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              {walletData.lastSeasonReset || "-"}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#1e293b",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px", fontSize: "30px" }}>
          Storico transazioni
        </h2>

        {walletData.transactions.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>Nessuna transazione disponibile</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    color: "#94a3b8",
                    borderBottom: "1px solid #334155",
                  }}
                >
                  <th style={{ padding: "12px 0", textAlign: "left" }}>Tipo</th>
                  <th style={{ padding: "12px 0", textAlign: "left" }}>Merchant</th>
                  <th style={{ padding: "12px 0", textAlign: "left" }}>Importo</th>
                  <th style={{ padding: "12px 0", textAlign: "left" }}>GUFO</th>
                  <th style={{ padding: "12px 0", textAlign: "left" }}>Cashback</th>
                  <th style={{ padding: "12px 0", textAlign: "left" }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {walletData.transactions.map((tx, index) => (
                  <tr
                    key={tx.id || tx.transaction_id || index}
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
                    <td style={{ padding: "14px 0", color: "#e2e8f0" }}>
                      {toNumberSafe(
                        tx?.cashback ??
                          tx?.cashback_percent ??
                          tx?.raw?.cashback ??
                          tx?.raw?.cashback_percent
                      ).toFixed(2)}
                      %
                    </td>
                    <td style={{ padding: "14px 0", color: "#cbd5e1" }}>
                      {formatDate(tx.created_at)}
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