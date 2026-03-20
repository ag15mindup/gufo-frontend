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
        const profileInitial = profileName.charAt(0).toUpperCase() || "U";

        if (!isMounted) return;

        setDashboardData({
          balanceGufo: toNumberSafe(stats?.balance_gufo ?? wallet?.balance_gufo),
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
        setError(err.message || "Errore sconosciuto");
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
        <h1 className="dashboard-title">GUFO Dashboard</h1>
        <p className="dashboard-subtitle">Caricamento dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <style>{dashboardStyles}</style>
        <h1 className="dashboard-title">GUFO Dashboard</h1>
        <p style={{ color: "#f87171" }}>{error}</p>
      </div>
    );
  }

  const maxMonthlyValue = Math.max(...dashboardData.monthlyExpenses, 1);

  return (
    <div className="dashboard-page">
      <style>{dashboardStyles}</style>

      <h1 className="dashboard-title">GUFO Dashboard</h1>
      <p className="dashboard-subtitle">Panoramica account utente.</p>

      <div className="dashboard-layout">
        <div className="profile-card">
          <div className="profile-avatar">{dashboardData.profileInitial}</div>

          <h2 className="profile-name">{dashboardData.profileName}</h2>
          <p className="profile-email">{dashboardData.profileEmail}</p>

          <div className="level-badge">{formatLevel(dashboardData.level)}</div>
        </div>

        <div className="dashboard-content">
          <h2 className="section-title">Riepilogo account</h2>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Saldo GUFO</div>
              <div className="stat-value">
                {dashboardData.balanceGufo.toFixed(2)}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Cashback</div>
              <div className="stat-value">{dashboardData.cashbackPercent}%</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Spesa stagione</div>
              <div className="stat-value">
                € {dashboardData.totalSpent.toFixed(2)}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Livello</div>
              <div className="stat-value">
                {formatLevel(dashboardData.level)}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Transazioni</div>
              <div className="stat-value">
                {dashboardData.totalTransactions}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">GUFO guadagnati</div>
              <div className="stat-value">
                {dashboardData.totalGufoEarned.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">Grafico spese mensili</h3>

            <div className="chart-wrap">
              {dashboardData.monthlyExpenses.map((value, index) => {
                const height =
                  value > 0 ? `${(value / maxMonthlyValue) * 100}%` : "4px";

                return (
                  <div key={index} className="chart-item">
                    <span className="chart-value">€{value.toFixed(0)}</span>
                    <div className="chart-bar" style={{ height }} />
                    <span className="chart-label">{getMonthLabel(index)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">Transazioni recenti</h3>

            {dashboardData.transactions.length === 0 ? (
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
      </div>
    </div>
  );
}

const dashboardStyles = `
  * {
    box-sizing: border-box;
  }

  .dashboard-page {
    color: white;
    width: 100%;
  }

  .dashboard-title {
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 10px 0;
    line-height: 1.1;
  }

  .dashboard-subtitle {
    color: #cbd5e1;
    margin: 0 0 30px 0;
    font-size: 16px;
  }

  .dashboard-layout {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  .profile-card {
    background: #1e293b;
    border-radius: 20px;
    padding: 28px 22px;
    min-height: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .profile-avatar {
    width: 78px;
    height: 78px;
    border-radius: 999px;
    background: #facc15;
    color: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 20px;
  }

  .profile-name {
    margin: 0;
    font-size: 34px;
    line-height: 1.1;
  }

  .profile-email {
    color: #cbd5e1;
    margin-top: 8px;
    margin-bottom: 0;
    word-break: break-word;
  }

  .level-badge {
    margin-top: 18px;
    background: #22c55e;
    color: white;
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 700;
  }

  .dashboard-content {
    min-width: 0;
  }

  .section-title {
    font-size: 40px;
    margin-top: 0;
    margin-bottom: 20px;
    line-height: 1.1;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #334155;
    border-radius: 18px;
    padding: 24px;
    min-width: 0;
  }

  .stat-label {
    color: #e2e8f0;
    margin-bottom: 10px;
    font-size: 15px;
  }

  .stat-value {
    font-size: 42px;
    font-weight: 700;
    line-height: 1.1;
    word-break: break-word;
  }

  .panel {
    background: #1e293b;
    border-radius: 18px;
    padding: 24px;
    margin-bottom: 24px;
    overflow: hidden;
  }

  .panel-title {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 28px;
    line-height: 1.1;
  }

  .chart-wrap {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 10px;
    align-items: end;
    height: 260px;
    overflow-x: auto;
    min-width: 0;
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
    color: #94a3b8;
    margin-bottom: 8px;
  }

  .chart-bar {
    width: 100%;
    max-width: 28px;
    min-width: 18px;
    background: #3b82f6;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
  }

  .chart-label {
    font-size: 12px;
    color: #cbd5e1;
    margin-top: 8px;
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
    .dashboard-layout {
      grid-template-columns: 1fr;
    }

    .profile-card {
      min-height: auto;
      justify-content: flex-start;
      align-items: center;
      padding: 24px 20px;
    }

    .section-title {
      font-size: 34px;
    }

    .dashboard-title {
      font-size: 42px;
    }
  }

  @media (max-width: 768px) {
    .dashboard-title {
      font-size: 32px;
    }

    .dashboard-subtitle {
      margin-bottom: 22px;
      font-size: 14px;
    }

    .section-title {
      font-size: 28px;
      margin-bottom: 16px;
    }

    .profile-card {
      border-radius: 18px;
      padding: 22px 16px;
    }

    .profile-avatar {
      width: 68px;
      height: 68px;
      font-size: 28px;
      margin-bottom: 16px;
    }

    .profile-name {
      font-size: 26px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .stat-card {
      padding: 18px;
      border-radius: 16px;
    }

    .stat-label {
      font-size: 14px;
    }

    .stat-value {
      font-size: 32px;
    }

    .panel {
      padding: 18px 14px;
      border-radius: 16px;
      margin-bottom: 18px;
    }

    .panel-title {
      font-size: 22px;
      margin-bottom: 16px;
    }

    .chart-wrap {
      gap: 8px;
      height: 220px;
    }

    .chart-value,
    .chart-label {
      font-size: 11px;
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

    .section-title {
      font-size: 24px;
    }

    .stat-value {
      font-size: 28px;
    }

    .profile-name {
      font-size: 22px;
    }

    .tx-label,
    .tx-value {
      font-size: 12px;
    }
  }
`;