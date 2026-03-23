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
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Caricamento dati account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <style>{dashboardStyles}</style>
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">Si è verificato un problema.</p>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  const maxMonthlyValue = Math.max(...dashboardData.monthlyExpenses, 1);

  return (
    <div className="dashboard-page">
      <style>{dashboardStyles}</style>

      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">
        Panoramica account, spese e attività recenti
      </p>

      <div className="top-grid">
        <div className="profile-card neon-card">
          <div className="profile-header">
            <div className="profile-avatar">{dashboardData.profileInitial}</div>
            <div>
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
            <div className="stat-card neon-card">
              <div className="stat-label">Saldo GUFO</div>
              <div className="stat-value">
                {dashboardData.balanceGufo.toFixed(2)}
              </div>
            </div>

            <div className="stat-card neon-card">
              <div className="stat-label">GUFO guadagnati</div>
              <div className="stat-value">
                {dashboardData.totalGufoEarned.toFixed(2)}
              </div>
            </div>

            <div className="stat-card neon-card">
              <div className="stat-label">Spesa stagione</div>
              <div className="stat-value">
                € {dashboardData.totalSpent.toFixed(2)}
              </div>
            </div>

            <div className="stat-card neon-card">
              <div className="stat-label">Cashback attuale</div>
              <div className="stat-value">{dashboardData.cashbackPercent}%</div>
            </div>
          </div>

          <div className="chart-panel neon-card">
            <h2 className="section-title">Andamento spese</h2>
            <p className="section-subtitle">
              Distribuzione mensile delle spese registrate
            </p>

            <div className="chart-wrap">
              {dashboardData.monthlyExpenses.map((value, index) => {
                const height =
                  value > 0 ? `${(value / maxMonthlyValue) * 100}%` : "6px";

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

      <div className="transactions-panel neon-card">
        <h2 className="section-title">Transazioni recenti</h2>
        <p className="section-subtitle">
          Ultimi movimenti registrati sul tuo account
        </p>

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
  * {
    box-sizing: border-box;
  }

  .dashboard-page {
    width: 100%;
    color: #ffffff;
    min-height: 100%;
    position: relative;
  }

  .dashboard-page::before {
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

  .dashboard-title,
  .dashboard-subtitle,
  .top-grid,
  .transactions-panel {
    position: relative;
    z-index: 1;
  }

  .dashboard-title {
    font-size: 56px;
    font-weight: 700;
    margin: 0 0 10px 0;
    line-height: 1.05;
    color: #fff7ed;
  }

  .dashboard-subtitle {
    margin: 0 0 28px 0;
    font-size: 16px;
    color: #d6d3d1;
  }

  .top-grid {
    display: grid;
    grid-template-columns: 300px minmax(0, 1fr);
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

  .neon-card {
    position: relative;
    background:
      linear-gradient(180deg, rgba(10, 16, 32, 0.92), rgba(15, 23, 42, 0.88));
    border-radius: 22px;
    padding: 22px;
    overflow: hidden;
    backdrop-filter: blur(12px);
    box-shadow:
      0 10px 35px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .neon-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 22px;
    padding: 1.3px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.95),
      rgba(56, 189, 248, 0.95),
      rgba(34, 197, 94, 0.95),
      rgba(250, 204, 21, 0.95),
      rgba(168, 85, 247, 0.95)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
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
  }

  .profile-avatar {
    width: 62px;
    height: 62px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 800;
    color: #111827;
    background: linear-gradient(
      135deg,
      #f472b6 0%,
      #60a5fa 35%,
      #4ade80 70%,
      #facc15 100%
    );
    box-shadow: 0 0 24px rgba(96, 165, 250, 0.22);
    flex-shrink: 0;
  }

  .profile-name {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.1;
    color: #fff7ed;
    word-break: break-word;
  }

  .profile-email {
    margin-top: 4px;
    color: #d6d3d1;
    font-size: 14px;
    word-break: break-word;
  }

  .profile-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .profile-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: #e7e5e4;
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
    min-height: 48px;
    border-radius: 999px;
    font-weight: 700;
    color: #111827;
    background: linear-gradient(
      90deg,
      rgba(244, 114, 182, 0.95),
      rgba(96, 165, 250, 0.95),
      rgba(74, 222, 128, 0.95),
      rgba(250, 204, 21, 0.95)
    );
    box-shadow: 0 0 24px rgba(250, 204, 21, 0.14);
  }

  .stat-card {
    min-height: 126px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stat-label {
    color: #e7e5e4;
    margin-bottom: 10px;
    font-size: 16px;
  }

  .stat-value {
    font-size: 52px;
    font-weight: 700;
    line-height: 1;
    color: #fffaf0;
    word-break: break-word;
  }

  .section-title {
    margin: 0 0 6px 0;
    font-size: 22px;
    font-weight: 700;
    color: #fff7ed;
  }

  .section-subtitle {
    margin: 0 0 18px 0;
    color: #d6d3d1;
    font-size: 14px;
  }

  .chart-panel {
    min-width: 0;
  }

  .chart-wrap {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 10px;
    align-items: end;
    height: 260px;
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
    color: #d6d3d1;
    margin-bottom: 8px;
  }

  .chart-bar-shell {
    width: 100%;
    height: 100%;
    border-radius: 14px;
    padding: 8px 0;
    display: flex;
    align-items: end;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .chart-bar {
    width: 70%;
    min-width: 18px;
    max-width: 26px;
    border-radius: 999px;
    background: linear-gradient(
      180deg,
      #60a5fa 0%,
      #38bdf8 30%,
      #4ade80 68%,
      #facc15 100%
    );
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.18);
  }

  .chart-label {
    font-size: 12px;
    color: #e7e5e4;
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
    color: #d6d3d1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding: 12px 0;
    text-align: left;
    font-weight: 600;
    font-size: 14px;
  }

  .transactions-table td {
    padding: 14px 0;
    color: #f5f5f4;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 14px;
    vertical-align: top;
  }

  .amount-green {
    color: #bbf7d0 !important;
    font-weight: 700;
  }

  .empty-state {
    border-radius: 20px;
    padding: 34px 18px;
    text-align: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.10);
  }

  .empty-icon {
    font-size: 34px;
    margin-bottom: 12px;
    color: #e7e5e4;
  }

  .empty-title {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 700;
    color: #fff7ed;
  }

  .empty-text {
    margin: 0;
    color: #d6d3d1;
    font-size: 14px;
  }

  .error-box {
    position: relative;
    z-index: 1;
    margin-top: 14px;
    color: #fecaca;
    background: rgba(127, 29, 29, 0.25);
    border: 1px solid rgba(248, 113, 113, 0.28);
    padding: 14px 16px;
    border-radius: 16px;
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
    border-radius: 16px;
    padding: 14px;
  }

  .tx-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    padding: 7px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .tx-row:last-child {
    border-bottom: none;
  }

  .tx-label {
    color: #d6d3d1;
    font-size: 13px;
    flex: 0 0 90px;
  }

  .tx-value {
    color: #f5f5f4;
    font-size: 13px;
    text-align: right;
    word-break: break-word;
  }

  @media (max-width: 1100px) {
    .top-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .dashboard-title {
      font-size: 38px;
    }

    .dashboard-subtitle {
      font-size: 14px;
      margin-bottom: 20px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }

    .neon-card {
      padding: 18px 14px;
      border-radius: 18px;
    }

    .stat-card {
      min-height: auto;
    }

    .stat-value {
      font-size: 36px;
    }

    .profile-name {
      font-size: 20px;
    }

    .chart-wrap {
      height: 220px;
      gap: 8px;
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
      font-size: 30px;
    }

    .stat-value {
      font-size: 30px;
    }

    .profile-avatar {
      width: 54px;
      height: 54px;
      font-size: 22px;
    }

    .tx-label,
    .tx-value,
    .chart-label,
    .chart-value {
      font-size: 11px;
    }
  }
`;