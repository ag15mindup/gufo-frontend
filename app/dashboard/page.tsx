"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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
  raw?: unknown;
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
  profileName: string;
  profileEmail: string;
  profileInitial: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

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
  return tx?.type ?? tx?.tipo ?? tx?.raw?.type ?? tx?.raw?.tipo ?? "-";
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
    profileName: "Utente GUFO",
    profileEmail: "",
    profileInitial: "U",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
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

        const [dashboardRes, profileRes] = await Promise.all([
          safeJsonFetch(`${API_URL}/dashboard/${user.id}`),
          safeJsonFetch(`${API_URL}/profile/${user.id}`),
        ]);

        if (!dashboardRes.response.ok || dashboardRes.data?.success === false) {
          throw new Error(
            dashboardRes.data?.error || "Errore nel recupero dashboard"
          );
        }

        if (!profileRes.response.ok || profileRes.data?.success === false) {
          throw new Error(
            profileRes.data?.error || "Errore nel recupero profilo"
          );
        }

        const dashboard = dashboardRes.data ?? {};
        const profilePayload = profileRes.data ?? {};
        const profile = profilePayload?.profile ?? {};
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

        const profileName =
          profile?.full_name ??
          profile?.name ??
          profile?.username ??
          user.email?.split("@")[0] ??
          "Utente GUFO";

        const profileEmail = profile?.email ?? user.email ?? "";
        const profileInitial =
          profileName?.trim()?.charAt(0)?.toUpperCase() || "U";

        if (!isMounted) return;

        setDashboardData({
          balanceGufo: toNumberSafe(
            stats?.balance_gufo ?? wallet?.balance_gufo
          ),
          totalTransactions: toNumberSafe(
            stats?.total_transactions ?? normalizedTransactions.length
          ),
          totalSpent: toNumberSafe(
            stats?.season_spent ?? wallet?.season_spent ?? 0
          ),
          totalGufoEarned: toNumberSafe(
            stats?.gufo_earned ?? wallet?.balance_gufo ?? 0
          ),
          level: String(stats?.level ?? wallet?.current_level ?? "Basic"),
          cashbackPercent: toNumberSafe(
            stats?.cashback_percent ?? wallet?.cashback_percent ?? 2
          ),
          transactions: normalizedTransactions,
          monthlyExpenses,
          profileName,
          profileEmail,
          profileInitial,
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

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-page">
        <style>{dashboardStyles}</style>

        <div className="dashboard-hero">
          <div>
            <div className="eyebrow">GUFO CONTROL PANEL</div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Caricamento dati account...</p>
          </div>
        </div>

        <div className="loading-shell gufo-surface">
          <div className="loading-glow" />
          <p className="loading-text">Connessione ai dati in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <style>{dashboardStyles}</style>

        <div className="dashboard-hero">
          <div>
            <div className="eyebrow">GUFO CONTROL PANEL</div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  const maxMonthlyValue = Math.max(...dashboardData.monthlyExpenses, 1);

  return (
    <div className="dashboard-page">
      <style>{dashboardStyles}</style>

      <div className="dashboard-hero">
        <div>
          <div className="eyebrow">GUFO CONTROL PANEL</div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Panoramica account, cashback, spese e attività recenti
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Live Account
        </div>
      </div>

      <div className="top-grid">
        <div className="profile-card gufo-surface">
          <div className="card-orb orb-cyan" />
          <div className="card-orb orb-pink" />

          <div className="profile-header">
            <div className="profile-avatar">{dashboardData.profileInitial}</div>

            <div className="profile-meta">
              <div className="profile-kicker">Profilo utente</div>
              <div className="profile-name">{dashboardData.profileName}</div>
              <div className="profile-email">{dashboardData.profileEmail}</div>
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-stat-row">
              <span>Livello</span>
              <strong>{formatLevel(dashboardData.level)}</strong>
            </div>
            <div className="profile-stat-row">
              <span>Cashback</span>
              <strong>{dashboardData.cashbackPercent}%</strong>
            </div>
            <div className="profile-stat-row">
              <span>Transazioni</span>
              <strong>{dashboardData.totalTransactions}</strong>
            </div>
          </div>

          <div className="level-pill">{formatLevel(dashboardData.level)}</div>
        </div>

        <div className="stats-area">
          <div className="stats-grid">
            <div className="stat-card gufo-surface">
              <div className="stat-topline">Wallet</div>
              <div className="stat-label">Saldo GUFO</div>
              <div className="stat-value">
                {dashboardData.balanceGufo.toFixed(2)}
              </div>
            </div>

            <div className="stat-card gufo-surface">
              <div className="stat-topline">Rewards</div>
              <div className="stat-label">GUFO guadagnati</div>
              <div className="stat-value">
                {dashboardData.totalGufoEarned.toFixed(2)}
              </div>
            </div>

            <div className="stat-card gufo-surface">
              <div className="stat-topline">Season</div>
              <div className="stat-label">Spesa stagione</div>
              <div className="stat-value smaller-value">
                € {dashboardData.totalSpent.toFixed(2)}
              </div>
            </div>

            <div className="stat-card gufo-surface">
              <div className="stat-topline">Membership</div>
              <div className="stat-label">Cashback attuale</div>
              <div className="stat-value">{dashboardData.cashbackPercent}%</div>
            </div>
          </div>

          <div className="chart-panel gufo-surface">
            <div className="panel-header">
              <div>
                <h2 className="section-title">Andamento spese</h2>
                <p className="section-subtitle">
                  Distribuzione mensile delle spese registrate
                </p>
              </div>

              <div className="mini-pill">12 mesi</div>
            </div>

            <div className="chart-wrap">
              {dashboardData.monthlyExpenses.map((value, index) => {
                const height =
                  value > 0 ? `${(value / maxMonthlyValue) * 100}%` : "8px";

                return (
                  <div className="chart-item" key={index}>
                    <span className="chart-value">€{value.toFixed(0)}</span>
                    <div className="chart-bar-shell">
                      <div className="chart-bar" style={{ height }} />
                    </div>
                    <span className="chart-label">{getMonthLabel(index)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="transactions-panel gufo-surface">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Transazioni recenti</h2>
            <p className="section-subtitle">
              Ultimi movimenti registrati sul tuo account
            </p>
          </div>

          <div className="mini-pill">Ultime 8</div>
        </div>

        {dashboardData.transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p className="empty-title">Nessuna transazione disponibile</p>
            <p className="empty-text">
              Quando inizierai a ricevere cashback o GUFO, li vedrai qui.
            </p>
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
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.transactions.slice(0, 8).map((tx, index) => (
                    <tr key={tx.id || index}>
                      <td>{getTransactionType(tx)}</td>
                      <td>{getTransactionMerchant(tx)}</td>
                      <td className="amount-green">
                        €{getTransactionAmount(tx).toFixed(2)}
                      </td>
                      <td>{getTransactionGufo(tx).toFixed(2)}</td>
                      <td>
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleString("it-IT")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-transactions mobile-only">
              {dashboardData.transactions.slice(0, 8).map((tx, index) => (
                <div className="tx-card" key={tx.id || index}>
                  <div className="tx-row">
                    <span className="tx-label">Tipo</span>
                    <span className="tx-value">{getTransactionType(tx)}</span>
                  </div>

                  <div className="tx-row">
                    <span className="tx-label">Merchant</span>
                    <span className="tx-value">
                      {getTransactionMerchant(tx)}
                    </span>
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
                    <span className="tx-label">Data</span>
                    <span className="tx-value">
                      {tx.created_at
                        ? new Date(tx.created_at).toLocaleString("it-IT")
                        : "-"}
                    </span>
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

const dashboardStyles = `
  .dashboard-page {
    width: 100%;
    min-height: 100%;
    color: #ffffff;
    position: relative;
  }

  .dashboard-page::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 12% 12%, rgba(56, 189, 248, 0.08), transparent 18%),
      radial-gradient(circle at 88% 10%, rgba(236, 72, 153, 0.07), transparent 18%),
      radial-gradient(circle at 18% 88%, rgba(34, 197, 94, 0.05), transparent 16%),
      radial-gradient(circle at 82% 84%, rgba(250, 204, 21, 0.05), transparent 16%);
    z-index: 0;
  }

  .dashboard-hero,
  .top-grid,
  .transactions-panel,
  .loading-shell,
  .error-box {
    position: relative;
    z-index: 1;
  }

  .dashboard-hero {
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
      0 0 18px rgba(56, 189, 248, 0.06);
  }

  .dashboard-title {
    margin: 0 0 8px 0;
    font-size: 60px;
    font-weight: 900;
    line-height: 0.98;
    letter-spacing: -0.04em;
    color: #ffffff;
    text-shadow:
      0 0 18px rgba(56, 189, 248, 0.14),
      0 0 28px rgba(139, 92, 246, 0.08);
  }

  .dashboard-subtitle {
    margin: 0;
    max-width: 760px;
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
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.05);
  }

  .hero-badge-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: linear-gradient(180deg, #4ade80, #22c55e);
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.45);
    flex-shrink: 0;
  }

  .top-grid {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
    margin-bottom: 24px;
  }

  .stats-area {
    min-width: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 20px;
  }

  .gufo-surface {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    padding: 22px;
    background:
      linear-gradient(180deg, rgba(10, 18, 36, 0.58), rgba(8, 15, 30, 0.70));
    border: 1px solid rgba(255,255,255,0.08);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.24),
      0 0 18px rgba(56, 189, 248, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .gufo-surface::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 1px;
    background: linear-gradient(
      90deg,
      rgba(56, 189, 248, 0.60),
      rgba(139, 92, 246, 0.55),
      rgba(236, 72, 153, 0.50),
      rgba(250, 204, 21, 0.40),
      rgba(34, 197, 94, 0.40)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.7;
  }

  .card-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(18px);
    pointer-events: none;
    opacity: 0.6;
  }

  .orb-cyan {
    top: -20px;
    right: -15px;
    width: 110px;
    height: 110px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%);
  }

  .orb-pink {
    bottom: -35px;
    left: -20px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.13), transparent 72%);
  }

  .profile-card {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 1;
  }

  .profile-avatar {
    width: 68px;
    height: 68px;
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 900;
    color: #111827;
    background: linear-gradient(
      135deg,
      #f472b6 0%,
      #60a5fa 35%,
      #4ade80 70%,
      #facc15 100%
    );
    box-shadow:
      0 0 22px rgba(96, 165, 250, 0.16),
      0 0 24px rgba(236, 72, 153, 0.08);
    flex-shrink: 0;
  }

  .profile-meta {
    min-width: 0;
  }

  .profile-kicker {
    margin-bottom: 6px;
    color: #9fb0d3;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .profile-name {
    font-size: 26px;
    font-weight: 800;
    line-height: 1.05;
    color: #ffffff;
    word-break: break-word;
  }

  .profile-email {
    margin-top: 6px;
    color: #b9c6e3;
    font-size: 14px;
    word-break: break-word;
  }

  .profile-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    z-index: 1;
  }

  .profile-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: #dbe4f0;
    font-size: 14px;
  }

  .profile-stat-row strong {
    color: #ffffff;
  }

  .level-pill {
    margin-top: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50px;
    border-radius: 999px;
    font-weight: 800;
    color: #111827;
    background: linear-gradient(
      90deg,
      rgba(244, 114, 182, 0.95),
      rgba(96, 165, 250, 0.95),
      rgba(74, 222, 128, 0.95),
      rgba(250, 204, 21, 0.95)
    );
    box-shadow:
      0 0 18px rgba(250, 204, 21, 0.10),
      0 0 26px rgba(56, 189, 248, 0.08);
    position: relative;
    z-index: 1;
  }

  .stat-card {
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stat-topline {
    margin-bottom: 10px;
    color: #9fb0d3;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .stat-label {
    color: #d8e2f4;
    margin-bottom: 12px;
    font-size: 15px;
  }

  .stat-value {
    font-size: 52px;
    font-weight: 900;
    line-height: 0.98;
    letter-spacing: -0.04em;
    color: #ffffff;
    word-break: break-word;
    text-shadow: 0 0 14px rgba(56, 189, 248, 0.08);
  }

  .smaller-value {
    font-size: 42px;
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .section-title {
    margin: 0 0 6px 0;
    font-size: 24px;
    font-weight: 800;
    line-height: 1.1;
    color: #ffffff;
  }

  .section-subtitle {
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

  .chart-panel {
    min-width: 0;
  }

  .chart-wrap {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 10px;
    align-items: end;
    height: 280px;
    min-width: 0;
    overflow-x: auto;
  }

  .chart-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    height: 100%;
  }

  .chart-value {
    font-size: 12px;
    color: #c6d3eb;
    margin-bottom: 8px;
  }

  .chart-bar-shell {
    width: 100%;
    height: 100%;
    border-radius: 16px;
    padding: 8px 0;
    display: flex;
    align-items: end;
    justify-content: center;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .chart-bar {
    width: 72%;
    min-width: 18px;
    max-width: 28px;
    border-radius: 999px;
    background: linear-gradient(
      180deg,
      #60a5fa 0%,
      #38bdf8 26%,
      #8b5cf6 52%,
      #ec4899 76%,
      #facc15 100%
    );
    box-shadow:
      0 0 14px rgba(56, 189, 248, 0.12),
      0 0 20px rgba(236, 72, 153, 0.08);
  }

  .chart-label {
    font-size: 12px;
    color: #dbe4f0;
    margin-top: 8px;
  }

  .transactions-panel {
    position: relative;
    z-index: 1;
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
    border-radius: 22px;
    padding: 36px 18px;
    text-align: center;
    background: rgba(255, 255, 255, 0.025);
    border: 1px dashed rgba(255, 255, 255, 0.10);
  }

  .empty-icon {
    font-size: 34px;
    margin-bottom: 12px;
    color: #dbe4f0;
  }

  .empty-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 800;
    color: #ffffff;
  }

  .empty-text {
    margin: 0;
    color: #b9c6e3;
    font-size: 14px;
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
    background: radial-gradient(circle, rgba(56, 189, 248, 0.14), transparent 70%);
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

  .mobile-only {
    display: none;
  }

  .desktop-only {
    display: block;
  }

  .mobile-transactions {
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

  @media (max-width: 1180px) {
    .top-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .dashboard-hero {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 22px;
    }

    .dashboard-title {
      font-size: 40px;
    }

    .dashboard-subtitle {
      font-size: 14px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }

    .gufo-surface {
      padding: 18px 14px;
      border-radius: 20px;
    }

    .gufo-surface::before {
      border-radius: 20px;
    }

    .stat-card {
      min-height: auto;
    }

    .stat-value {
      font-size: 38px;
    }

    .smaller-value {
      font-size: 32px;
    }

    .profile-name {
      font-size: 22px;
    }

    .chart-wrap {
      height: 230px;
      gap: 8px;
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
    .dashboard-title {
      font-size: 32px;
    }

    .profile-avatar {
      width: 58px;
      height: 58px;
      font-size: 24px;
      border-radius: 18px;
    }

    .profile-name {
      font-size: 20px;
    }

    .stat-value {
      font-size: 32px;
    }

    .smaller-value {
      font-size: 28px;
    }

    .tx-label,
    .tx-value,
    .chart-label,
    .chart-value {
      font-size: 11px;
    }
  }
`;