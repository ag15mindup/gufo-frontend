"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";

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

const API_URL = "https://gufo-backend1.onrender.com";

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

function getTransactionCashback(tx: any) {
  return toNumberSafe(
    tx?.cashback ??
      tx?.cashback_percent ??
      tx?.raw?.cashback ??
      tx?.raw?.cashback_percent
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("it-IT");
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

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(userError.message || "Errore recupero utente");
        }

        if (!user) {
          throw new Error("Utente non autenticato");
        }

        const [walletRes, transactionsRes] = await Promise.all([
          safeJsonFetch(`${API_URL}/wallet/${user.id}`),
          safeJsonFetch(`${API_URL}/transactions/${user.id}`),
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
            transaction_id:
              tx?.transaction_id ?? tx?.id ?? tx?.raw?.transaction_id,
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
      <div className="wallet-page">
        <style>{walletStyles}</style>
        <h1 className="wallet-title">Wallet</h1>
        <p className="wallet-subtitle">Caricamento wallet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-page">
        <style>{walletStyles}</style>
        <h1 className="wallet-title">Wallet</h1>
        <p style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <style>{walletStyles}</style>

      <h1 className="wallet-title">Wallet</h1>
      <p className="wallet-subtitle">Panoramica saldo, cashback e movimenti.</p>

      <div className="top-stats-grid">
        <div className="big-stat-card">
          <div className="big-stat-label">Saldo GUFO</div>
          <div className="big-stat-value">{walletData.balanceGufo.toFixed(2)}</div>
        </div>

        <div className="big-stat-card">
          <div className="big-stat-label">Saldo Euro</div>
          <div className="big-stat-value">€ {walletData.balanceEuro.toFixed(2)}</div>
        </div>

        <div className="big-stat-card">
          <div className="big-stat-label">Spesa stagione</div>
          <div className="big-stat-value">€ {walletData.seasonSpent.toFixed(2)}</div>
        </div>

        <div className="big-stat-card">
          <div className="big-stat-label">Cashback attuale</div>
          <div className="big-stat-value">{walletData.cashbackPercent}%</div>
        </div>

        <div className="big-stat-card">
          <div className="big-stat-label">Livello</div>
          <div className="big-stat-value">{formatLevel(walletData.level)}</div>
        </div>

        <div className="big-stat-card">
          <div className="big-stat-label">GUFO guadagnati</div>
          <div className="big-stat-value">
            {walletData.totalGufoEarned.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Riepilogo wallet</h2>

        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Transazioni</div>
            <div className="summary-value">{walletData.totalTransactions}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Livello attuale</div>
            <div className="summary-value">{formatLevel(walletData.level)}</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Cashback</div>
            <div className="summary-value">{walletData.cashbackPercent}%</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Ultimo reset stagione</div>
            <div className="summary-value small">
              {walletData.lastSeasonReset
                ? formatDate(walletData.lastSeasonReset)
                : "-"}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Storico transazioni</h2>

        {walletData.transactions.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>Nessuna transazione disponibile</p>
        ) : (
          <>
            <div className="table-wrap desktop-only">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Merchant</th>
                    <th>Importo</th>
                    <th>GUFO</th>
                    <th>Cashback</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {walletData.transactions.map((tx, index) => (
                    <tr key={tx.id || tx.transaction_id || index}>
                      <td>{getTransactionType(tx)}</td>
                      <td>{getTransactionMerchant(tx)}</td>
                      <td className="amount-green">
                        €{getTransactionAmount(tx).toFixed(2)}
                      </td>
                      <td>{getTransactionGufo(tx).toFixed(2)}</td>
                      <td>{getTransactionCashback(tx).toFixed(2)}%</td>
                      <td>{formatDate(tx.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-transactions mobile-only">
              {walletData.transactions.map((tx, index) => (
                <div
                  className="tx-card"
                  key={tx.id || tx.transaction_id || index}
                >
                  <div className="tx-row">
                    <span className="tx-label">Tipo</span>
                    <span className="tx-value">{getTransactionType(tx)}</span>
                  </div>

                  <div className="tx-row">
                    <span className="tx-label">Merchant</span>
                    <span className="tx-value">{getTransactionMerchant(tx)}</span>
                  </div>

                  <div className="tx-row">
                    <span className="tx-label">Importo</span>
                    <span className="tx-value amount-green">
                      €{getTransactionAmount(tx).toFixed(2)}
                    </span>
                  </div>

                  <div className="tx-row">
                    <span className="tx-label">GUFO</span>
                    <span className="tx-value">
                      {getTransactionGufo(tx).toFixed(2)}
                    </span>
                  </div>

                  <div className="tx-row">
                    <span className="tx-label">Cashback</span>
                    <span className="tx-value">
                      {getTransactionCashback(tx).toFixed(2)}%
                    </span>
                  </div>

                  <div className="tx-row">
                    <span className="tx-label">Data</span>
                    <span className="tx-value">{formatDate(tx.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const walletStyles = `
  * {
    box-sizing: border-box;
  }

  .wallet-page {
    color: white;
    width: 100%;
  }

  .wallet-title {
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 10px 0;
    line-height: 1.1;
  }

  .wallet-subtitle {
    color: #cbd5e1;
    margin: 0 0 30px 0;
    font-size: 16px;
  }

  .top-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .big-stat-card {
    background: #334155;
    border-radius: 16px;
    padding: 24px;
    min-width: 0;
  }

  .big-stat-label {
    color: #e2e8f0;
    margin-bottom: 8px;
    font-size: 15px;
  }

  .big-stat-value {
    font-size: 42px;
    font-weight: 700;
    line-height: 1.1;
    word-break: break-word;
  }

  .panel {
    background: #1e293b;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    overflow: hidden;
  }

  .panel-title {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 30px;
    line-height: 1.1;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .summary-card {
    background: #0f172a;
    border-radius: 12px;
    padding: 18px;
    min-width: 0;
  }

  .summary-label {
    color: #94a3b8;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .summary-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.15;
    word-break: break-word;
  }

  .summary-value.small {
    font-size: 18px;
  }

  .table-wrap {
    width: 100%;
    overflow-x: auto;
  }

  .transactions-table {
    width: 100%;
    border-collapse: collapse;
  }

  .transactions-table th {
    color: #94a3b8;
    border-bottom: 1px solid #334155;
    padding: 12px 0;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
  }

  .transactions-table td {
    padding: 14px 0;
    color: #e2e8f0;
    border-bottom: 1px solid #334155;
    font-size: 14px;
    vertical-align: top;
  }

  .amount-green {
    color: #86efac !important;
    font-weight: 700;
  }

  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }

  .mobile-transactions {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .tx-card {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 14px;
  }

  .tx-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 6px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  }

  .tx-row:last-child {
    border-bottom: none;
  }

  .tx-label {
    color: #94a3b8;
    font-size: 13px;
    flex: 0 0 90px;
  }

  .tx-value {
    color: #e2e8f0;
    font-size: 13px;
    text-align: right;
    word-break: break-word;
  }

  @media (max-width: 1024px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 768px) {
    .wallet-title {
      font-size: 32px;
    }

    .wallet-subtitle {
      font-size: 14px;
      margin-bottom: 22px;
    }

    .top-stats-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .big-stat-card {
      padding: 18px;
      border-radius: 16px;
    }

    .big-stat-label {
      font-size: 14px;
    }

    .big-stat-value {
      font-size: 32px;
    }

    .panel {
      padding: 18px 14px;
      border-radius: 16px;
      margin-bottom: 18px;
    }

    .panel-title {
      font-size: 24px;
      margin-bottom: 16px;
    }

    .summary-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .summary-card {
      padding: 16px;
    }

    .summary-value {
      font-size: 24px;
    }

    .summary-value.small {
      font-size: 16px;
    }

    .desktop-only {
      display: none;
    }

    .mobile-only {
      display: block;
    }
  }

  @media (max-width: 480px) {
    .wallet-title {
      font-size: 28px;
    }

    .panel-title {
      font-size: 22px;
    }

    .big-stat-value {
      font-size: 28px;
    }

    .summary-value {
      font-size: 22px;
    }

    .tx-label,
    .tx-value {
      font-size: 12px;
    }
  }
`;