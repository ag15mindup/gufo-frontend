"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";

type Transaction = {
  id?: string | null;
  type?: string;
  tipo?: string;
  merchant_name?: string;
  merchant?: string;
  benefit?: string;
  amount_euro?: number | string | null;
  amount?: number | string | null;
  importo?: number | string | null;
  gufo_earned?: number | string | null;
  gufo?: number | string | null;
  created_at?: string | null;
  raw?: any;
};

type PartnerStatsResponse = {
  total_transactions?: number | string | null;
  total_amount?: number | string | null;
  total_gufo_distributed?: number | string | null;
  recent_transactions?: Transaction[];
  transactions?: Transaction[];
  stats?: {
    total_transactions?: number | string | null;
    total_amount?: number | string | null;
    total_gufo_distributed?: number | string | null;
    recent_transactions?: Transaction[];
    transactions?: Transaction[];
  };
  error?: string;
};

const API_URL = "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getTransactionType(tx: any) {
  return tx?.type ?? tx?.tipo ?? tx?.raw?.type ?? tx?.raw?.tipo ?? "-";
}

function getTransactionMerchant(tx: any) {
  return (
    tx?.merchant_name ??
    tx?.merchant ??
    tx?.benefit ??
    tx?.raw?.merchant_name ??
    tx?.raw?.merchant ??
    tx?.raw?.benefit ??
    "-"
  );
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

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("it-IT");
}

export default function PartnerDashboardPage() {
  const [data, setData] = useState<PartnerStatsResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError("");

        const { response, data } = await safeJsonFetch(`${API_URL}/partner/stats`);

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || "Errore nel caricamento statistiche");
        }

        const statsRoot: PartnerStatsResponse = data ?? {};
        const stats: PartnerStatsResponse = statsRoot?.stats ?? statsRoot;

        const rawTransactions = Array.isArray(stats?.recent_transactions)
          ? stats.recent_transactions
          : Array.isArray(stats?.transactions)
          ? stats.transactions
          : [];

        const normalizedTransactions: Transaction[] = rawTransactions.map(
          (tx: any) => ({
            id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id ?? null,
            type: getTransactionType(tx),
            merchant_name: getTransactionMerchant(tx),
            amount_euro: getTransactionAmount(tx),
            gufo_earned: getTransactionGufo(tx),
            created_at: tx?.created_at ?? tx?.raw?.created_at ?? null,
            raw: tx?.raw ?? tx,
          })
        );

        setData(stats);
        setTransactions(normalizedTransactions);
      } catch (err: any) {
        setError(err?.message || "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="partner-dashboard-page">
        <style>{partnerDashboardStyles}</style>
        <h1 className="page-title">GUFO Partner Dashboard</h1>
        <p className="page-subtitle">Caricamento statistiche...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partner-dashboard-page">
        <style>{partnerDashboardStyles}</style>
        <h1 className="page-title">GUFO Partner Dashboard</h1>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="partner-dashboard-page">
      <style>{partnerDashboardStyles}</style>

      <h1 className="page-title">GUFO Partner Dashboard</h1>
      <p className="page-subtitle">
        Panoramica partner con statistiche e ultime transazioni.
      </p>

      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Totale transazioni</p>
          <p className="stat-value">
            {toNumberSafe(data?.total_transactions)}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Totale importi</p>
          <p className="stat-value">
            €{toNumberSafe(data?.total_amount).toFixed(2)}
          </p>
        </div>

        <div className="stat-card">
          <p className="stat-label">GUFO distribuiti</p>
          <p className="stat-value">
            {toNumberSafe(data?.total_gufo_distributed).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Ultime transazioni</h2>

        {transactions.length === 0 ? (
          <p className="empty-text">Nessuna transazione trovata.</p>
        ) : (
          <>
            <div className="table-wrap desktop-only">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Tipo</th>
                    <th>Importo</th>
                    <th>GUFO</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => (
                    <tr key={tx.id || index}>
                      <td>{getTransactionMerchant(tx)}</td>
                      <td>{getTransactionType(tx)}</td>
                      <td className="amount-green">
                        €{getTransactionAmount(tx).toFixed(2)}
                      </td>
                      <td>{getTransactionGufo(tx).toFixed(2)}</td>
                      <td>{formatDate(tx.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-transactions mobile-only">
              {transactions.map((tx, index) => (
                <div className="tx-card" key={tx.id || index}>
                  <div className="tx-row">
                    <span className="tx-label">Merchant</span>
                    <span className="tx-value">{getTransactionMerchant(tx)}</span>
                  </div>

                  <div className="tx-row">
                    <span className="tx-label">Tipo</span>
                    <span className="tx-value">{getTransactionType(tx)}</span>
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

const partnerDashboardStyles = `
  * {
    box-sizing: border-box;
  }

  .partner-dashboard-page {
    color: white;
    width: 100%;
  }

  .page-title {
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 10px 0;
    line-height: 1.1;
  }

  .page-subtitle {
    color: #cbd5e1;
    margin: 0 0 30px 0;
    font-size: 16px;
    line-height: 1.6;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #1e293b;
    border: 1px solid rgba(148, 163, 184, 0.08);
    border-radius: 20px;
    padding: 24px;
    min-width: 0;
  }

  .stat-label {
    margin: 0 0 10px 0;
    color: #94a3b8;
    font-size: 14px;
  }

  .stat-value {
    margin: 0;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.1;
    word-break: break-word;
    color: white;
  }

  .panel {
    background: #1e293b;
    border: 1px solid rgba(148, 163, 184, 0.08);
    border-radius: 20px;
    padding: 24px;
    overflow: hidden;
  }

  .panel-title {
    margin: 0 0 20px 0;
    font-size: 28px;
    line-height: 1.1;
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

  .empty-text {
    margin: 0;
    color: #94a3b8;
  }

  .error-box {
    border: 1px solid rgba(248, 113, 113, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
    padding: 16px;
    border-radius: 16px;
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
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .page-title {
      font-size: 32px;
    }

    .page-subtitle {
      font-size: 14px;
      margin-bottom: 22px;
    }

    .stat-card {
      padding: 18px;
      border-radius: 16px;
    }

    .stat-value {
      font-size: 28px;
    }

    .panel {
      padding: 18px 14px;
      border-radius: 16px;
    }

    .panel-title {
      font-size: 22px;
      margin-bottom: 16px;
    }

    .desktop-only {
      display: none;
    }

    .mobile-only {
      display: block;
    }
  }

  @media (max-width: 480px) {
    .page-title {
      font-size: 28px;
    }

    .stat-value {
      font-size: 24px;
    }

    .tx-label,
    .tx-value {
      font-size: 12px;
    }
  }
`;