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
        <div className="hero-card">
          <div className="hero-badge">GUFO</div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Caricamento dati account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <style>{dashboardStyles}</style>
        <div className="hero-card">
          <div className="hero-badge">GUFO</div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Si è verificato un problema.</p>
          <div className="error-box">{error}</div>
        </div>
      </div>
    );
  }

  const maxMonthlyValue = Math.max(...dashboardData.monthlyExpenses, 1);

  return (
    <div className="dashboard-page">
      <style>{dashboardStyles}</style>

      <section className="hero-card">
        <div className="hero-top">
          <div>
            <div className="hero-badge">GUFO</div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">
              Panoramica completa del tuo account e delle attività recenti.
            </p>
          </div>

          <div className="hero-user">
            <div className="profile-avatar">{dashboardData.profileInitial}</div>
            <div>
              <div className="hero-user-name">{dashboardData.profileName}</div>
              <div className="hero-user-email">{dashboardData.profileEmail}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <aside className="sidebar-card">
          <div className="sidebar-section">
            <div className="sidebar-label">Profilo</div>
            <h2 className="sidebar-name">{dashboardData.profileName}</h2>
            <p className="sidebar-email">{dashboardData.profileEmail}</p>
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-section">
            <div className="mini-stat">
              <span className="mini-stat-label">Livello</span>
              <span className="mini-stat-value">
                {formatLevel(dashboardData.level)}
              </span>
            </div>

            <div className="mini-stat">
              <span className="mini-stat-label">Cashback</span>
              <span className="mini-stat-value">
                {dashboardData.cashbackPercent}%
              </span>
            </div>

            <div className="mini-stat">
              <span className="mini-stat-label">Transazioni</span>
              <span className="mini-stat-value">
                {dashboardData.totalTransactions}
              </span>
            </div>
          </div>

          <div className="sidebar-divider" />

          <div className="level-pill">{formatLevel(dashboardData.level)}</div>
        </aside>

        <main className="main-content">
          <section className="stats-grid">
            <div className="stat-card glow-card">
              <div className="stat-label">Saldo GUFO</div>
              <div className="stat-value">
                {dashboardData.balanceGufo.toFixed(2)}
              </div>
            </div>

            <div className="stat-card glow-card">
              <div className="stat-label">GUFO guadagnati</div>
              <div className="stat-value">
                {dashboardData.totalGufoEarned.toFixed(2)}
              </div>
            </div>

            <div className="stat-card glow-card">
              <div className="stat-label">Spesa stagione</div>
              <div className="stat-value">
                € {dashboardData.totalSpent.toFixed(2)}
              </div>
            </div>

            <div className="stat-card glow-card">
              <div className="stat-label">Cashback attuale</div>
              <div className="stat-value">{dashboardData.cashbackPercent}%</div>
            </div>
          </section>

          <section className="panel glow-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Andamento spese mensili</h3>
                <p className="panel-subtitle">
                  Visualizzazione delle spese distribuite durante l’anno.
                </p>
              </div>
            </div>

            <div className="chart-wrap">
              {dashboardData.monthlyExpenses.map((value, index) => {
                const height =
                  value > 0 ? `${(value / maxMonthlyValue) * 100}%` : "6px";

                return (
                  <div key={index} className="chart-item">
                    <span className="chart-value">€{value.toFixed(0)}</span>
                    <div className="chart-bar-wrap">
                      <div className="chart-bar" style={{ height }} />
                    </div>
                    <span className="chart-label">{getMonthLabel(index)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel glow-panel">
            <div className="panel-header">
              <div>
                <h3 className="panel-title">Transazioni recenti</h3>
                <p className="panel-subtitle">
                  Ultimi movimenti registrati sul tuo account.
                </p>
              </div>
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
          </section>
        </main>
      </div>
    </div>
  );
}

const dashboardStyles = `
  * {
    box-sizing: border-box;
  }

  .dashboard-page {
    width: 100%;
    min-height: 100%;
    color: #f8fafc;
  }

  .dashboard-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 15% 20%, rgba(236, 72, 153, 0.12), transparent 22%),
      radial-gradient(circle at 80% 18%, rgba(59, 130, 246, 0.14), transparent 24%),
      radial-gradient(circle at 20% 85%, rgba(34, 197, 94, 0.12), transparent 22%),
      radial-gradient(circle at 82% 78%, rgba(250, 204, 21, 0.10), transparent 22%);
    z-index: 0;
  }

  .hero-card,
  .sidebar-card,
  .stat-card,
  .panel,
  .tx-card {
    position: relative;
    z-index: 1;
  }

  .hero-card {
    background:
      linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.88));
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 28px;
    padding: 28px;
    margin-bottom: 24px;
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.28),
      0 0 0 1px rgba(255, 255, 255, 0.02) inset;
    overflow: hidden;
  }

  .hero-card::after {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: 28px;
    padding: 1px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.55),
      rgba(59, 130, 246, 0.55),
      rgba(34, 197, 94, 0.55),
      rgba(250, 204, 21, 0.55),
      rgba(168, 85, 247, 0.55)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .hero-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 16px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(148, 163, 184, 0.18);
    color: #e2e8f0;
  }

  .dashboard-title {
    font-size: 46px;
    line-height: 1;
    margin: 0 0 10px 0;
    font-weight: 800;
  }

  .dashboard-subtitle {
    margin: 0;
    color: #cbd5e1;
    font-size: 16px;
    max-width: 680px;
  }

  .hero-user {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
    background: rgba(15, 23, 42, 0.58);
    border: 1px solid rgba(148, 163, 184, 0.16);
    padding: 14px 16px;
    border-radius: 20px;
  }

  .hero-user-name {
    font-weight: 700;
    font-size: 16px;
    color: #f8fafc;
    word-break: break-word;
  }

  .hero-user-email {
    font-size: 13px;
    color: #cbd5e1;
    word-break: break-word;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  .sidebar-card {
    background:
      linear-gradient(180deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.88));
    border: 1px solid rgba(148, 163, 184, 0.14);
    border-radius: 24px;
    padding: 24px 20px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  }

  .sidebar-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sidebar-label {
    color: #94a3b8;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
  }

  .sidebar-name {
    margin: 0;
    font-size: 28px;
    line-height: 1.1;
    word-break: break-word;
  }

  .sidebar-email {
    margin: 0;
    color: #cbd5e1;
    word-break: break-word;
  }

  .sidebar-divider {
    height: 1px;
    background: rgba(148, 163, 184, 0.16);
    margin: 22px 0;
  }

  .mini-stat {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  }

  .mini-stat:last-child {
    border-bottom: none;
  }

  .mini-stat-label {
    color: #94a3b8;
    font-size: 14px;
  }

  .mini-stat-value {
    color: #f8fafc;
    font-weight: 700;
    text-align: right;
  }

  .level-pill {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 14px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.95),
      rgba(59, 130, 246, 0.95),
      rgba(34, 197, 94, 0.95),
      rgba(250, 204, 21, 0.95)
    );
    color: #0f172a;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.18);
  }

  .main-content {
    min-width: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 24px;
  }

  .stat-card {
    background:
      linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92));
    border-radius: 22px;
    padding: 22px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    min-width: 0;
  }

  .glow-card {
    box-shadow:
      0 10px 28px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.015) inset;
  }

  .stat-label {
    color: #cbd5e1;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .stat-value {
    font-size: 38px;
    line-height: 1.1;
    font-weight: 800;
    word-break: break-word;
  }

  .panel {
    background:
      linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92));
    border-radius: 24px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid rgba(148, 163, 184, 0.14);
    overflow: hidden;
  }

  .glow-panel {
    box-shadow:
      0 10px 28px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.015) inset;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
  }

  .panel-title {
    margin: 0 0 6px 0;
    font-size: 28px;
    line-height: 1.1;
    font-weight: 800;
  }

  .panel-subtitle {
    margin: 0;
    color: #94a3b8;
    font-size: 14px;
  }

  .chart-wrap {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 10px;
    align-items: end;
    height: 280px;
    min-width: 0;
    overflow-x: auto;
    padding-top: 8px;
  }

  .chart-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    height: 100%;
    min-width: 0;
  }

  .chart-value {
    font-size: 12px;
    color: #cbd5e1;
    margin-bottom: 10px;
  }

  .chart-bar-wrap {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: end;
    justify-content: center;
    background: rgba(15, 23, 42, 0.42);
    border-radius: 14px;
    padding: 8px 0;
    border: 1px solid rgba(148, 163, 184, 0.08);
  }

  .chart-bar {
    width: 70%;
    min-width: 18px;
    max-width: 28px;
    border-radius: 999px;
    background: linear-gradient(
      180deg,
      #60a5fa 0%,
      #38bdf8 35%,
      #22c55e 68%,
      #facc15 100%
    );
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.22);
  }

  .chart-label {
    font-size: 12px;
    color: #cbd5e1;
    margin-top: 10px;
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
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    padding: 12px 0;
    text-align: left;
    font-weight: 700;
    font-size: 14px;
  }

  .transactions-table td {
    padding: 14px 0;
    color: #e2e8f0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    font-size: 14px;
    vertical-align: top;
  }

  .amount-green {
    color: #86efac !important;
    font-weight: 800;
  }

  .empty-state {
    border: 1px dashed rgba(148, 163, 184, 0.18);
    background: rgba(15, 23, 42, 0.46);
    border-radius: 22px;
    padding: 34px 18px;
    text-align: center;
  }

  .empty-icon {
    font-size: 34px;
    margin-bottom: 12px;
    color: #cbd5e1;
  }

  .empty-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 700;
    color: #f8fafc;
  }

  .empty-text {
    margin: 0;
    color: #94a3b8;
    font-size: 14px;
  }

  .error-box {
    margin-top: 14px;
    color: #fecaca;
    background: rgba(127, 29, 29, 0.28);
    border: 1px solid rgba(248, 113, 113, 0.28);
    padding: 14px 16px;
    border-radius: 16px;
  }

  .profile-avatar {
    width: 60px;
    height: 60px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    background: linear-gradient(
      135deg,
      #f472b6 0%,
      #60a5fa 35%,
      #4ade80 70%,
      #facc15 100%
    );
    box-shadow: 0 0 20px rgba(96, 165, 250, 0.2);
    flex-shrink: 0;
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
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 18px;
    padding: 14px;
  }

  .tx-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
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

  @media (max-width: 1100px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .sidebar-card {
      order: 2;
    }

    .main-content {
      order: 1;
    }
  }

  @media (max-width: 768px) {
    .hero-card {
      padding: 20px 16px;
      border-radius: 22px;
      margin-bottom: 18px;
    }

    .hero-top {
      flex-direction: column;
      align-items: stretch;
    }

    .dashboard-title {
      font-size: 32px;
    }

    .dashboard-subtitle {
      font-size: 14px;
    }

    .hero-user {
      width: 100%;
      padding: 12px 14px;
      border-radius: 16px;
    }

    .sidebar-card {
      padding: 18px 16px;
      border-radius: 20px;
    }

    .sidebar-name {
      font-size: 22px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }

    .stat-card {
      padding: 18px;
      border-radius: 18px;
    }

    .stat-value {
      font-size: 30px;
    }

    .panel {
      padding: 18px 14px;
      border-radius: 20px;
      margin-bottom: 18px;
    }

    .panel-title {
      font-size: 22px;
    }

    .panel-subtitle {
      font-size: 13px;
    }

    .chart-wrap {
      gap: 8px;
      height: 220px;
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
      font-size: 28px;
    }

    .stat-value {
      font-size: 26px;
    }

    .profile-avatar {
      width: 52px;
      height: 52px;
      font-size: 20px;
    }

    .tx-label,
    .tx-value,
    .chart-label,
    .chart-value {
      font-size: 11px;
    }
  }
`;