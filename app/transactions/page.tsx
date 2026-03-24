"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Transaction = {
  id?: string | null;
  transaction_id?: string | null;
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
  cashback?: number | string | null;
  cashback_percent?: number | string | null;
  created_at?: string | null;
  raw?: unknown;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

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

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("it-IT");
}

function extractTransactions(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
  return [];
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [merchantFilter, setMerchantFilter] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTransactions() {
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

        const { response, data } = await safeJsonFetch(
          `${API_URL}/transactions/${user.id}`
        );

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || "Errore nel caricamento transazioni");
        }

        const rawTransactions = extractTransactions(data);

        const normalizedTransactions: Transaction[] = rawTransactions.map(
          (tx: any) => ({
            id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id ?? null,
            transaction_id:
              tx?.transaction_id ?? tx?.id ?? tx?.raw?.transaction_id ?? null,
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
            cashback_percent:
              tx?.cashback_percent ??
              tx?.cashback ??
              tx?.raw?.cashback_percent ??
              tx?.raw?.cashback ??
              null,
            created_at: tx?.created_at ?? tx?.raw?.created_at ?? null,
            raw: tx?.raw ?? tx,
          })
        );

        const sortedTransactions = normalizedTransactions.sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });

        if (!isMounted) return;
        setTransactions(sortedTransactions);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Errore sconosciuto");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTransactions();

    return () => {
      isMounted = false;
    };
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

        <div className="transactions-hero">
          <div>
            <div className="eyebrow">GUFO TRANSACTION CENTER</div>
            <h1 className="page-title">Transazioni</h1>
            <p className="page-subtitle">Caricamento transazioni...</p>
          </div>
        </div>

        <div className="loading-shell neon-card">
          <div className="loading-glow" />
          <p className="loading-text">Recupero storico transazioni in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-page">
        <style>{transactionsStyles}</style>

        <div className="transactions-hero">
          <div>
            <div className="eyebrow">GUFO TRANSACTION CENTER</div>
            <h1 className="page-title">Transazioni</h1>
            <p className="page-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <style>{transactionsStyles}</style>

      <div className="transactions-hero">
        <div>
          <div className="eyebrow">GUFO TRANSACTION CENTER</div>
          <h1 className="page-title">Transazioni</h1>
          <p className="page-subtitle">Storico completo delle transazioni utente</p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Ledger Active
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card neon-card">
          <div className="card-orb orb-cyan" />
          <div className="stat-topline">Filtered Data</div>
          <div className="stat-label">Transazioni filtrate</div>
          <div className="stat-value">{filteredTransactions.length}</div>
        </div>

        <div className="stat-card neon-card">
          <div className="card-orb orb-pink" />
          <div className="stat-topline">Amount</div>
          <div className="stat-label">Importo totale</div>
          <div className="stat-value smaller-value">€ {totalAmount.toFixed(2)}</div>
        </div>

        <div className="stat-card neon-card">
          <div className="stat-topline">Rewards</div>
          <div className="stat-label">GUFO totali</div>
          <div className="stat-value">{totalGufo.toFixed(2)}</div>
        </div>
      </div>

      <div className="panel neon-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Filtri</h2>
            <p className="panel-subtitle">
              Seleziona tipo transazione o cerca per merchant
            </p>
          </div>

          <div className="mini-pill">Search & Filter</div>
        </div>

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

      <div className="panel neon-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title no-margin">Tutte le transazioni</h2>
            <p className="panel-subtitle">
              Storico completo filtrato in tempo reale
            </p>
          </div>

          <span className="panel-count">Totale: {filteredTransactions.length}</span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p className="empty-title">Nessuna transazione trovata</p>
            <p className="empty-text">
              Quando userai GUFO, qui vedrai tutti i movimenti filtrabili per tipo e merchant.
            </p>
          </div>
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
                    <tr key={tx.id || tx.transaction_id || index}>
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
                <div className="tx-card" key={tx.id || tx.transaction_id || index}>
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
    width: 100%;
    color: #ffffff;
    min-height: 100%;
    position: relative;
  }

  .transactions-page::before {
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

  .transactions-hero,
  .stats-grid,
  .panel,
  .error-box,
  .loading-shell {
    position: relative;
    z-index: 1;
  }

  .transactions-hero {
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

  .page-title {
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

  .page-subtitle {
    color: #b9c6e3;
    margin: 0;
    font-size: 16px;
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

  .stats-grid {
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

  .stat-card {
    min-width: 0;
  }

  .stat-topline {
    position: relative;
    z-index: 1;
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
    position: relative;
    z-index: 1;
  }

  .stat-value {
    font-size: 38px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.03em;
    word-break: break-word;
    color: #ffffff;
    position: relative;
    z-index: 1;
  }

  .smaller-value {
    font-size: 34px;
  }

  .panel {
    margin-bottom: 24px;
  }

  .panel-title {
    margin: 0 0 6px 0;
    font-size: 28px;
    line-height: 1.05;
    font-weight: 800;
    color: #ffffff;
    position: relative;
    z-index: 1;
  }

  .panel-title.no-margin {
    margin: 0;
  }

  .panel-subtitle {
    margin: 0;
    color: #b9c6e3;
    font-size: 14px;
    line-height: 1.5;
    position: relative;
    z-index: 1;
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }

  .panel-count {
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

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    position: relative;
    z-index: 1;
  }

  .input-label {
    display: block;
    color: #b9c6e3;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .input-control {
    width: 100%;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 14px 16px;
    color: white;
    outline: none;
    font-size: 14px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
  }

  .input-control::placeholder {
    color: #99a8c7;
  }

  .input-control:focus {
    border-color: rgba(56, 189, 248, 0.35);
    box-shadow:
      0 0 0 1px rgba(56, 189, 248, 0.16),
      0 0 18px rgba(56, 189, 248, 0.06);
  }

  .input-control option {
    background: #0f172a;
    color: #ffffff;
  }

  .table-wrap {
    width: 100%;
    overflow-x: auto;
    position: relative;
    z-index: 1;
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
    color: #b9c6e3;
    margin: 0;
    font-size: 16px;
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
    border: 1px solid rgba(248, 113, 113, 0.3);
    background: rgba(239, 68, 68, 0.10);
    color: #fca5a5;
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
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    z-index: 1;
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

  @media (max-width: 1024px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .transactions-hero {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 22px;
    }

    .page-title {
      font-size: 40px;
    }

    .page-subtitle {
      font-size: 14px;
    }

    .neon-card {
      padding: 18px 14px;
      border-radius: 20px;
    }

    .neon-card::before {
      border-radius: 20px;
    }

    .stat-value {
      font-size: 30px;
    }

    .smaller-value {
      font-size: 28px;
    }

    .panel-title {
      font-size: 22px;
      margin-bottom: 0;
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

    .empty-title {
      font-size: 18px;
    }

    .empty-text {
      font-size: 14px;
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
      font-size: 32px;
    }

    .stat-value {
      font-size: 26px;
    }

    .smaller-value {
      font-size: 24px;
    }

    .tx-label,
    .tx-value {
      font-size: 12px;
    }
  }
`;