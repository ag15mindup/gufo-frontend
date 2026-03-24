"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type WalletResponse = {
  user_id?: string;
  balance_gufo?: number | string | null;
  balance_eur?: number | string | null;
  season_spent?: number | string | null;
  current_level?: string | null;
  cashback_percent?: number | string | null;
  last_season_reset?: string | null;
  success?: boolean;
  error?: string;
  data?: unknown;
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
  raw?: unknown;
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

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
  return tx?.type ?? tx?.tipo ?? tx?.raw?.type ?? tx?.raw?.tipo ?? "-";
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

function extractWallet(payload: any): WalletResponse {
  if (!payload) return {};
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
}

function extractTransactions(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
  return [];
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
    let isMounted = true;

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

        if (!transactionsRes.response.ok || transactionsRes.data?.success === false) {
          throw new Error(
            transactionsRes.data?.error || "Errore nel recupero transazioni"
          );
        }

        const walletPayload = walletRes.data ?? {};
        const transactionsPayload = transactionsRes.data ?? {};

        const wallet: WalletResponse = extractWallet(walletPayload);
        const rawTransactions = extractTransactions(transactionsPayload);

        const normalizedTransactions: Transaction[] = rawTransactions.map((tx: any) => ({
          id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id,
          transaction_id: tx?.transaction_id ?? tx?.id ?? tx?.raw?.transaction_id,
          type: getTransactionType(tx),
          tipo: tx?.tipo ?? tx?.raw?.tipo,
          merchant_name: getTransactionMerchant(tx),
          benefit: tx?.benefit ?? tx?.raw?.benefit,
          merchant: tx?.merchant ?? tx?.raw?.merchant,
          amount_euro: getTransactionAmount(tx),
          amount: getTransactionAmount(tx),
          importo: tx?.importo ?? tx?.raw?.importo,
          gufo_earned: getTransactionGufo(tx),
          gufo: getTransactionGufo(tx),
          cashback:
            tx?.cashback ??
            tx?.cashback_percent ??
            tx?.raw?.cashback ??
            tx?.raw?.cashback_percent ??
            null,
          cashback_percent:
            tx?.cashback_percent ??
            tx?.cashback ??
            tx?.raw?.cashback_percent ??
            tx?.raw?.cashback ??
            null,
          created_at: tx?.created_at ?? tx?.raw?.created_at ?? null,
          raw: tx?.raw ?? tx,
        }));

        const totalGufoEarned = normalizedTransactions.reduce(
          (sum, tx) => sum + getTransactionGufo(tx),
          0
        );

        if (!isMounted) return;

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
        if (!isMounted) return;
        setError(err?.message || "Errore sconosciuto");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadWalletPage();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="wallet-page">
        <style>{walletStyles}</style>

        <div className="wallet-hero">
          <div>
            <div className="eyebrow">GUFO WALLET CENTER</div>
            <h1 className="wallet-title">Wallet</h1>
            <p className="wallet-subtitle">
              Caricamento saldo, cashback e movimenti...
            </p>
          </div>
        </div>

        <div className="loading-shell neon-card">
          <div className="loading-glow" />
          <p className="loading-text">Connessione al wallet in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-page">
        <style>{walletStyles}</style>

        <div className="wallet-hero">
          <div>
            <div className="eyebrow">GUFO WALLET CENTER</div>
            <h1 className="wallet-title">Wallet</h1>
            <p className="wallet-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <style>{walletStyles}</style>

      <div className="wallet-hero">
        <div>
          <div className="eyebrow">GUFO WALLET CENTER</div>
          <h1 className="wallet-title">Wallet</h1>
          <p className="wallet-subtitle">
            Panoramica saldo, cashback, stagione e movimenti
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Active Wallet
        </div>
      </div>

      <div className="top-stats-grid">
        <div className="big-stat-card neon-card">
          <div className="card-orb orb-cyan" />
          <div className="big-stat-topline">GUFO Balance</div>
          <div className="big-stat-label">Saldo GUFO</div>
          <div className="big-stat-value gufo-mark">
            G {walletData.balanceGufo.toFixed(2)}
          </div>
        </div>

        <div className="big-stat-card neon-card">
          <div className="card-orb orb-pink" />
          <div className="big-stat-topline">EUR Balance</div>
          <div className="big-stat-label">Saldo Euro</div>
          <div className="big-stat-value">
            € {walletData.balanceEuro.toFixed(2)}
          </div>
        </div>

        <div className="big-stat-card neon-card">
          <div className="big-stat-topline">Season</div>
          <div className="big-stat-label">Spesa stagione</div>
          <div className="big-stat-value">
            € {walletData.seasonSpent.toFixed(2)}
          </div>
        </div>

        <div className="big-stat-card neon-card">
          <div className="big-stat-topline">Cashback</div>
          <div className="big-stat-label">Cashback attuale</div>
          <div className="big-stat-value">{walletData.cashbackPercent}%</div>
        </div>

        <div className="big-stat-card neon-card">
          <div className="big-stat-topline">Membership</div>
          <div className="big-stat-label">Livello</div>
          <div className="big-stat-value">{formatLevel(walletData.level)}</div>
        </div>

        <div className="big-stat-card neon-card">
          <div className="big-stat-topline">Rewards</div>
          <div className="big-stat-label">GUFO guadagnati</div>
          <div className="big-stat-value">
            {walletData.totalGufoEarned.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="panel neon-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Riepilogo Wallet</h2>
            <p className="panel-subtitle">
              Stato attuale del wallet e della stagione attiva
            </p>
          </div>

          <div className="mini-pill">Overview</div>
        </div>

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
            <div className="summary-label">Ultimo reset stagionale</div>
            <div className="summary-value small">
              {walletData.lastSeasonReset
                ? formatDate(walletData.lastSeasonReset)
                : "Nessuno"}
            </div>
          </div>
        </div>
      </div>

      <div className="panel neon-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Storico transazioni</h2>
            <p className="panel-subtitle">
              Elenco completo dei movimenti del wallet
            </p>
          </div>

          <div className="mini-pill">{walletData.transactions.length} movimenti</div>
        </div>

        {walletData.transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p className="empty-title">Nessuna transazione disponibile</p>
            <p className="empty-text">
              Quando riceverai cashback o guadagni GUFO, li vedrai in questo elenco.
            </p>
            <div className="empty-pill">Wallet pronto per i prossimi movimenti</div>
          </div>
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
    width: 100%;
    min-height: 100%;
    color: #ffffff;
    position: relative;
  }

  .wallet-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.10), transparent 20%),
      radial-gradient(circle at 80% 18%, rgba(236, 72, 153, 0.10), transparent 22%),
      radial-gradient(circle at 18% 85%, rgba(34, 197, 94, 0.08), transparent 18%),
      radial-gradient(circle at 82% 80%, rgba(250, 204, 21, 0.08), transparent 18%);
    z-index: 0;
  }

  .wallet-hero,
  .top-stats-grid,
  .panel,
  .error-box,
  .loading-shell {
    position: relative;
    z-index: 1;
  }

  .wallet-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 28px;
  }

  .eyebrow {
    display: inline-block;
    margin-bottom: 10px;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #dbeafe;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.04),
      0 0 18px rgba(56, 189, 248, 0.08);
  }

  .wallet-title {
    margin: 0 0 8px 0;
    font-size: 60px;
    font-weight: 900;
    line-height: 0.98;
    letter-spacing: -0.04em;
    color: #ffffff;
    text-shadow:
      0 0 18px rgba(56, 189, 248, 0.16),
      0 0 28px rgba(139, 92, 246, 0.10);
  }

  .wallet-subtitle {
    margin: 0;
    font-size: 16px;
    color: #b9c6e3;
    line-height: 1.55;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    white-space: nowrap;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #eef2ff;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.06);
  }

  .hero-badge-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: linear-gradient(180deg, #4ade80, #22c55e);
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.55);
    flex-shrink: 0;
  }

  .top-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .neon-card {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    padding: 22px;
    background:
      linear-gradient(180deg, rgba(10, 16, 32, 0.82), rgba(15, 23, 42, 0.78));
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.30),
      0 0 22px rgba(56, 189, 248, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .neon-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 1.2px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.92),
      rgba(56, 189, 248, 0.92),
      rgba(34, 197, 94, 0.86),
      rgba(250, 204, 21, 0.86),
      rgba(168, 85, 247, 0.92)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.9;
  }

  .card-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(18px);
    pointer-events: none;
    opacity: 0.72;
  }

  .orb-cyan {
    top: -22px;
    right: -18px;
    width: 110px;
    height: 110px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.22), transparent 70%);
  }

  .orb-pink {
    bottom: -34px;
    left: -16px;
    width: 118px;
    height: 118px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.16), transparent 72%);
  }

  .big-stat-card {
    min-height: 150px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .big-stat-topline {
    position: relative;
    z-index: 1;
    margin-bottom: 10px;
    color: #9fb0d3;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .big-stat-label {
    position: relative;
    z-index: 1;
    color: #d8e2f4;
    margin-bottom: 12px;
    font-size: 15px;
  }

  .big-stat-value {
    position: relative;
    z-index: 1;
    font-size: 42px;
    font-weight: 900;
    line-height: 1.02;
    letter-spacing: -0.03em;
    color: #ffffff;
    word-break: break-word;
    text-shadow: 0 0 16px rgba(56, 189, 248, 0.10);
  }

  .gufo-mark {
    letter-spacing: -0.02em;
  }

  .panel {
    margin-bottom: 24px;
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
    position: relative;
    z-index: 1;
  }

  .panel-title {
    margin: 0 0 6px 0;
    font-size: 34px;
    line-height: 1.05;
    font-weight: 800;
    color: #ffffff;
  }

  .panel-subtitle {
    margin: 0;
    color: #b9c6e3;
    font-size: 14px;
    line-height: 1.5;
  }

  .mini-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    white-space: nowrap;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #eef2ff;
    font-size: 12px;
    font-weight: 700;
  }

  .summary-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .summary-card {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 18px;
    padding: 18px;
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
  }

  .summary-label {
    color: #b9c6e3;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .summary-value {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.15;
    color: #ffffff;
    word-break: break-word;
  }

  .summary-value.small {
    font-size: 18px;
  }

  .table-wrap {
    position: relative;
    z-index: 1;
    width: 100%;
    overflow-x: auto;
  }

  .transactions-table {
    width: 100%;
    border-collapse: collapse;
  }

  .transactions-table th {
    color: #aebedf;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding: 12px 0;
    text-align: left;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.02em;
  }

  .transactions-table td {
    padding: 16px 0;
    color: #f4f7ff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 14px;
    vertical-align: top;
  }

  .amount-green {
    color: #bbf7d0 !important;
    font-weight: 800;
  }

  .empty-state {
    position: relative;
    z-index: 1;
    border-radius: 24px;
    padding: 36px 20px;
    text-align: center;
    background:
      radial-gradient(circle at center, rgba(56, 189, 248, 0.06), transparent 38%),
      rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.12);
  }

  .empty-icon {
    font-size: 34px;
    margin-bottom: 12px;
    color: #dbe4f0;
  }

  .empty-title {
    margin: 0 0 8px 0;
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
  }

  .empty-text {
    margin: 0 auto 18px auto;
    color: #b9c6e3;
    font-size: 16px;
    max-width: 680px;
  }

  .empty-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    padding: 0 22px;
    border-radius: 999px;
    color: #ffffff;
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.10);
    box-shadow: 0 0 20px rgba(56, 189, 248, 0.08);
  }

  .loading-shell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 180px;
  }

  .loading-glow {
    position: absolute;
    width: 180px;
    height: 180px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%);
    filter: blur(20px);
    pointer-events: none;
  }

  .loading-text {
    position: relative;
    z-index: 1;
    margin: 0;
    font-size: 15px;
    color: #dbe4f0;
  }

  .error-box {
    margin-top: 14px;
    color: #fecaca;
    background: rgba(127, 29, 29, 0.24);
    border: 1px solid rgba(248, 113, 113, 0.28);
    padding: 16px 18px;
    border-radius: 18px;
  }

  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }

  .mobile-transactions {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .tx-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 14px;
  }

  .tx-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .tx-row:last-child {
    border-bottom: none;
  }

  .tx-label {
    color: #b9c6e3;
    font-size: 13px;
    flex: 0 0 90px;
  }

  .tx-value {
    color: #f4f7ff;
    font-size: 13px;
    text-align: right;
    word-break: break-word;
  }

  @media (max-width: 1100px) {
    .top-stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 768px) {
    .wallet-hero {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 22px;
    }

    .wallet-title {
      font-size: 40px;
    }

    .wallet-subtitle {
      font-size: 14px;
    }

    .top-stats-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .neon-card {
      padding: 18px 14px;
      border-radius: 20px;
    }

    .neon-card::before {
      border-radius: 20px;
    }

    .big-stat-card {
      min-height: auto;
    }

    .big-stat-value {
      font-size: 34px;
    }

    .panel-title {
      font-size: 26px;
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

    .empty-title {
      font-size: 18px;
    }

    .empty-text {
      font-size: 14px;
    }

    .panel-header {
      flex-direction: column;
      align-items: flex-start;
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
      font-size: 32px;
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