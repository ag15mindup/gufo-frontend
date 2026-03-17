"use client";

import { useEffect, useMemo, useState } from "react";

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

const API_URL = "https://gufo-backend1.onrender.com";
const USER_ID = "1f49b570-08ea-4151-9999-825fa0c77d6e";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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

import { safeJsonFetch } from "@/lib/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [merchantFilter, setMerchantFilter] = useState("");

  useEffect(() => {
    async function loadTransactions() {
      try {
        setLoading(true);
        setError("");

        const { response, data } = await safeJsonFetch(
          `${API_URL}/transactions/${USER_ID}`
        );

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || "Errore nel caricamento transazioni");
        }

        const rawTransactions = Array.isArray(data) ? data : [];

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

        setTransactions(normalizedTransactions);
      } catch (err: any) {
        setError(err.message || "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const transactionTypes = useMemo(() => {
    return Array.from(
      new Set(
        transactions
          .map((tx) => String(getTransactionType(tx) || "").trim())
          .filter((value) => value.length > 0 && value !== "-")
      )
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesType =
        typeFilter === "all" ||
        String(getTransactionType(tx)).toLowerCase() === typeFilter.toLowerCase();

      const matchesMerchant = String(getTransactionMerchant(tx))
        .toLowerCase()
        .includes(merchantFilter.toLowerCase().trim());

      return matchesType && matchesMerchant;
    });
  }, [transactions, typeFilter, merchantFilter]);

  const totalAmount = filteredTransactions.reduce(
    (sum, tx) => sum + getTransactionAmount(tx),
    0
  );

  const totalGufo = filteredTransactions.reduce(
    (sum, tx) => sum + getTransactionGufo(tx),
    0
  );

  if (loading) {
    return (
      <div className="transactions-page">
        <style>{transactionsStyles}</style>
        <h1 className="page-title">GUFO Transactions</h1>
        <p className="page-subtitle">Caricamento transazioni...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-page">
        <style>{transactionsStyles}</style>
        <h1 className="page-title">GUFO Transactions</h1>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <style>{transactionsStyles}</style>

      <h1 className="page-title">GUFO Transactions</h1>
      <p className="page-subtitle">Storico completo delle transazioni utente.</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Transazioni filtrate</div>
          <div className="stat-value">{filteredTransactions.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Importo totale</div>
          <div className="stat-value">€ {totalAmount.toFixed(2)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">GUFO totali</div>
          <div className="stat-value">{totalGufo.toFixed(2)}</div>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Filtri</h2>

        <div className="filters-grid">
          <div>
            <label className="input-label">Tipo transazione</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-control"
            >
              <option value="all">Tutti</option>
              {transactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Cerca merchant</label>
            <input
              type="text"
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
              className="input-control"
              placeholder="Es. Adidas"
            />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title no-margin">Tutte le transazioni</h2>
          <span className="panel-count">Totale: {filteredTransactions.length}</span>
        </div>

        {filteredTransactions.length === 0 ? (
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
                  {filteredTransactions.map((tx, index) => (
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
              {filteredTransactions.map((tx, index) => (
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
                    <span className="tx-value">{getTransactionGufo(tx).toFixed(2)}</span>
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

const transactionsStyles = `
  * {
    box-sizing: border-box;
  }

  .transactions-page {
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
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #334155;
    border-radius: 16px;
    padding: 24px;
    min-width: 0;
  }

  .stat-label {
    color: #e2e8f0;
    margin-bottom: 10px;
    font-size: 15px;
  }

  .stat-value {
    font-size: 38px;
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
    margin: 0 0 20px 0;
    font-size: 28px;
    line-height: 1.1;
  }

  .panel-title.no-margin {
    margin: 0;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
  }

  .panel-count {
    color: #94a3b8;
    font-size: 14px;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .input-label {
    display: block;
    color: #cbd5e1;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .input-control {
    width: 100%;
    border-radius: 14px;
    background: #0f172a;
    border: 1px solid #334155;
    padding: 14px 16px;
    color: white;
    outline: none;
    font-size: 14px;
  }

  .input-control::placeholder {
    color: #94a3b8;
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
    color: #94a3b8;
    margin: 0;
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
    }

    .stat-value {
      font-size: 30px;
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

    .panel-header {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .filters-grid {
      grid-template-columns: 1fr;
      gap: 14px;
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
      font-size: 26px;
    }

    .tx-label,
    .tx-value {
      font-size: 12px;
    }
  }
`;