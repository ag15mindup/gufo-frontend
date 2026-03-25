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
    tx?.gufo_earned ?? tx?.gufo ?? tx?.raw?.gufo_earned ?? tx?.raw?.gufo
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
  return date.toLocaleDateString("it-IT");
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

  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("GUFO User");
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

        const fallbackName =
          user.user_metadata?.username ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "GUFO User";

        if (isMounted) {
          setUserEmail(user.email || "");
          setUserName(fallbackName);
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
      <div className="wallet-premium-page">
        <style>{walletStyles}</style>

        <div className="hero-line" />

        <div className="wallet-premium-hero">
          <div className="hero-left">
            <div className="hero-eyebrow">GUFO WALLET</div>
            <h1 className="hero-title">Wallet</h1>
            <p className="hero-subtitle">
              Connessione al saldo, cashback e movimenti in corso...
            </p>
          </div>
        </div>

        <div className="loading-box premium-card">
          <p>Caricamento wallet premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-premium-page">
        <style>{walletStyles}</style>

        <div className="hero-line" />

        <div className="wallet-premium-hero">
          <div className="hero-left">
            <div className="hero-eyebrow">GUFO WALLET</div>
            <h1 className="hero-title">Wallet</h1>
            <p className="hero-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="wallet-premium-page">
      <style>{walletStyles}</style>

      <div className="hero-line" />

      <div className="wallet-premium-hero">
        <div className="hero-left">
          <div className="hero-eyebrow">Welcome back!</div>
          <h1 className="hero-title">{userName}</h1>
          <p className="hero-subtitle">{userEmail || "Profilo wallet attivo"}</p>
        </div>

        <div className="balance-card premium-card">
          <div className="balance-label">Balance</div>
          <div className="balance-value">{walletData.balanceGufo.toFixed(2)} GUFO</div>

          <div className="balance-actions">
            <button className="action-btn action-btn-secondary" type="button">
              + Deposit
            </button>
            <button className="action-btn action-btn-primary" type="button">
              + Withdraw
            </button>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="mini-stat premium-card">
          <div className="mini-stat-number">{walletData.totalTransactions}</div>
          <div className="mini-stat-label">Active Transactions</div>
          <div className="mini-stat-side">Live</div>
        </div>

        <div className="mini-stat premium-card">
          <div className="mini-stat-number">{formatLevel(walletData.level)}</div>
          <div className="mini-stat-label">Membership Level</div>
          <div className="mini-stat-side">User tier</div>
        </div>

        <div className="mini-stat premium-card">
          <div className="mini-stat-number">{walletData.cashbackPercent}%</div>
          <div className="mini-stat-label">Cashback Rate</div>
          <div className="mini-stat-side">Current</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="left-column premium-card">
          <div className="section-header">
            <h2 className="section-title">Recent Transactions</h2>
            <span className="section-link">View All</span>
          </div>

          {walletData.transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nessuna transazione disponibile</div>
              <div className="empty-text">
                Quando riceverai cashback o guadagni GUFO, li vedrai qui.
              </div>
            </div>
          ) : (
            <>
              <div className="table-wrap desktop-only">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Partner</th>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Importo</th>
                      <th>GUFO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {walletData.transactions.slice(0, 8).map((tx, index) => (
                      <tr key={tx.id || tx.transaction_id || index}>
                        <td>{getTransactionMerchant(tx)}</td>
                        <td>{formatDate(tx.created_at)}</td>
                        <td>
                          <span className="type-pill">{getTransactionType(tx)}</span>
                        </td>
                        <td className="amount-cell">
                          € {getTransactionAmount(tx).toFixed(2)}
                        </td>
                        <td>{getTransactionGufo(tx).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-only mobile-list">
                {walletData.transactions.slice(0, 8).map((tx, index) => (
                  <div className="mobile-tx-card" key={tx.id || tx.transaction_id || index}>
                    <div className="mobile-tx-top">
                      <strong>{getTransactionMerchant(tx)}</strong>
                      <span className="type-pill">{getTransactionType(tx)}</span>
                    </div>
                    <div className="mobile-tx-row">
                      <span>Data</span>
                      <span>{formatDate(tx.created_at)}</span>
                    </div>
                    <div className="mobile-tx-row">
                      <span>Importo</span>
                      <span className="amount-cell">
                        € {getTransactionAmount(tx).toFixed(2)}
                      </span>
                    </div>
                    <div className="mobile-tx-row">
                      <span>GUFO</span>
                      <span>{getTransactionGufo(tx).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="right-column premium-card">
          <div className="section-header">
            <h2 className="section-title">Top Info</h2>
            <span className="pro-badge">PRO</span>
          </div>

          <div className="info-stack">
            <div className="info-card">
              <div className="info-icon info-icon-pink" />
              <div className="info-copy">
                <div className="info-main">{userName}</div>
                <div className="info-sub">Profilo attivo</div>
              </div>
              <div className="info-tag">{formatLevel(walletData.level).toUpperCase()}</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-cyan" />
              <div className="info-copy">
                <div className="info-main">€ {walletData.seasonSpent.toFixed(2)}</div>
                <div className="info-sub">Spesa totale stagione</div>
              </div>
              <div className="info-tag">TOT</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-gold" />
              <div className="info-copy">
                <div className="info-main">{walletData.totalGufoEarned.toFixed(2)}</div>
                <div className="info-sub">GUFO guadagnati</div>
              </div>
              <div className="info-tag">EARN</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-green" />
              <div className="info-copy">
                <div className="info-main">€ {walletData.balanceEuro.toFixed(2)}</div>
                <div className="info-sub">Saldo convertibile</div>
              </div>
              <div className="info-tag">EUR</div>
            </div>

            <div className="reset-box">
              <div className="reset-label">Ultimo reset stagionale</div>
              <div className="reset-value">
                {walletData.lastSeasonReset
                  ? formatDate(walletData.lastSeasonReset)
                  : "Nessuno"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const walletStyles = `
  * {
    box-sizing: border-box;
  }

  .wallet-premium-page {
    position: relative;
    min-height: 100%;
    color: #ffffff;
  }

  .wallet-premium-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(6, 10, 20, 0.18), rgba(6, 10, 20, 0.34)),
      radial-gradient(circle at 18% 20%, rgba(56, 189, 248, 0.10), transparent 24%),
      radial-gradient(circle at 84% 18%, rgba(236, 72, 153, 0.10), transparent 24%),
      radial-gradient(circle at 18% 84%, rgba(34, 197, 94, 0.08), transparent 20%),
      radial-gradient(circle at 82% 80%, rgba(250, 204, 21, 0.08), transparent 22%);
    z-index: 0;
  }

  .wallet-premium-page > * {
    position: relative;
    z-index: 1;
  }

  .hero-line {
    width: 100%;
    height: 3px;
    border-radius: 999px;
    margin-bottom: 22px;
    background: linear-gradient(
      90deg,
      rgba(34, 211, 238, 0.95),
      rgba(132, 204, 22, 0.9),
      rgba(250, 204, 21, 0.95),
      rgba(251, 113, 133, 0.95),
      rgba(196, 181, 253, 0.95)
    );
    box-shadow: 0 0 18px rgba(255,255,255,0.14);
  }

  .wallet-premium-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 420px);
    gap: 24px;
    align-items: start;
    margin-bottom: 22px;
  }

  .hero-eyebrow {
    font-size: 13px;
    font-weight: 800;
    color: #f8fafc;
    margin-bottom: 10px;
  }

  .hero-title {
    margin: 0 0 8px 0;
    font-size: 58px;
    line-height: 0.96;
    font-weight: 900;
    letter-spacing: -0.04em;
    text-shadow: 0 0 18px rgba(255,255,255,0.12);
    word-break: break-word;
  }

  .hero-subtitle {
    margin: 0;
    color: #d7e2f2;
    font-size: 15px;
  }

  .premium-card {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.60),
      rgba(15, 23, 42, 0.48)
    );
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 24px;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow:
      0 16px 38px rgba(0,0,0,0.28),
      inset 0 1px 0 rgba(255,255,255,0.05),
      0 0 0 1px rgba(255,255,255,0.02);
  }

  .balance-card {
    padding: 26px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .balance-label {
    color: #f8fafc;
    font-size: 28px;
    font-weight: 700;
  }

  .balance-value {
    font-size: 56px;
    font-weight: 900;
    line-height: 0.98;
    letter-spacing: -0.04em;
    text-shadow:
      0 0 18px rgba(255,255,255,0.10),
      0 0 26px rgba(56, 189, 248, 0.12);
  }

  .balance-actions {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  .action-btn {
    border: none;
    border-radius: 16px;
    min-height: 50px;
    padding: 0 22px;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  }

  .action-btn:hover {
    transform: translateY(-2px);
  }

  .action-btn-secondary {
    color: #ffffff;
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.92), rgba(59, 130, 246, 0.88));
    box-shadow: 0 10px 28px rgba(59, 130, 246, 0.26);
  }

  .action-btn-primary {
    color: #ffffff;
    background: linear-gradient(180deg, rgba(34, 211, 238, 0.94), rgba(14, 165, 233, 0.90));
    box-shadow: 0 10px 28px rgba(34, 211, 238, 0.28);
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 22px;
  }

  .mini-stat {
    min-height: 150px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .mini-stat-number {
    font-size: 32px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.03em;
    color: #ffffff;
    word-break: break-word;
  }

  .mini-stat-label {
    color: #e8eefc;
    font-size: 15px;
    font-weight: 700;
  }

  .mini-stat-side {
    color: #dbe7fb;
    font-size: 14px;
    font-weight: 700;
    opacity: 0.92;
    align-self: flex-end;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) 340px;
    gap: 20px;
  }

  .left-column,
  .right-column {
    padding: 22px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
  }

  .section-title {
    margin: 0;
    font-size: 22px;
    font-weight: 900;
    color: #ffffff;
  }

  .section-link {
    color: #c8f2f5;
    font-size: 14px;
    font-weight: 800;
  }

  .pro-badge {
    min-height: 32px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    color: #d1fae5;
    background: rgba(34, 197, 94, 0.14);
    border: 1px solid rgba(134, 239, 172, 0.20);
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
    text-align: left;
    padding: 12px 0;
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 700;
    border-bottom: 1px solid rgba(255,255,255,0.12);
  }

  .transactions-table td {
    padding: 16px 0;
    color: #ffffff;
    font-size: 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .type-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.10);
    color: #eaf2ff;
    font-size: 12px;
    font-weight: 700;
  }

  .amount-cell {
    color: #d1fae5;
    font-weight: 800;
  }

  .info-stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .info-card {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
  }

  .info-icon {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    box-shadow: 0 0 18px rgba(255,255,255,0.10);
  }

  .info-icon-pink {
    background: radial-gradient(circle at 30% 30%, #f9a8d4, #a855f7);
  }

  .info-icon-cyan {
    background: radial-gradient(circle at 30% 30%, #67e8f9, #2563eb);
  }

  .info-icon-gold {
    background: radial-gradient(circle at 30% 30%, #fde68a, #f59e0b);
  }

  .info-icon-green {
    background: radial-gradient(circle at 30% 30%, #86efac, #16a34a);
  }

  .info-copy {
    min-width: 0;
  }

  .info-main {
    color: #ffffff;
    font-size: 18px;
    font-weight: 900;
    line-height: 1.1;
    word-break: break-word;
  }

  .info-sub {
    color: #dbe7fb;
    font-size: 13px;
    margin-top: 4px;
  }

  .info-tag {
    color: #dbeafe;
    font-size: 12px;
    font-weight: 900;
    opacity: 0.9;
  }

  .reset-box {
    border-radius: 18px;
    padding: 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.10);
  }

  .reset-label {
    color: #cbd5e1;
    font-size: 13px;
    margin-bottom: 8px;
  }

  .reset-value {
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
  }

  .loading-box,
  .error-box {
    padding: 22px;
  }

  .loading-box p {
    margin: 0;
    color: #e2e8f0;
    font-size: 15px;
  }

  .error-box {
    color: #fecaca;
    background: rgba(127, 29, 29, 0.24);
    border: 1px solid rgba(248, 113, 113, 0.28);
    border-radius: 20px;
  }

  .empty-state {
    padding: 28px 12px 10px 0;
  }

  .empty-title {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 8px;
  }

  .empty-text {
    color: #dbe7fb;
    font-size: 14px;
  }

  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }

  .mobile-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mobile-tx-card {
    padding: 14px;
    border-radius: 18px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.10);
  }

  .mobile-tx-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .mobile-tx-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 0;
    color: #e2e8f0;
    font-size: 13px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .mobile-tx-row:last-child {
    border-bottom: none;
  }

  @media (max-width: 1200px) {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .right-column {
      order: 2;
    }

    .left-column {
      order: 1;
    }
  }

  @media (max-width: 980px) {
    .wallet-premium-hero {
      grid-template-columns: 1fr;
    }

    .stats-row {
      grid-template-columns: 1fr;
    }

    .hero-title {
      font-size: 42px;
    }

    .balance-value {
      font-size: 42px;
    }
  }

  @media (max-width: 768px) {
    .desktop-only {
      display: none;
    }

    .mobile-only {
      display: block;
    }

    .left-column,
    .right-column,
    .balance-card,
    .mini-stat {
      padding: 16px;
    }

    .hero-title {
      font-size: 34px;
    }

    .balance-label {
      font-size: 22px;
    }

    .balance-value {
      font-size: 34px;
    }

    .section-title {
      font-size: 19px;
    }

    .balance-actions {
      flex-direction: column;
    }

    .action-btn {
      width: 100%;
    }
  }
`;