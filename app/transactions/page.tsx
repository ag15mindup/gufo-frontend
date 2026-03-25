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

  return date.toLocaleDateString("it-IT");
}

function extractTransactions(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
  return [];
}

function getTypeClass(type: string) {
  const normalized = String(type).toLowerCase();

  if (normalized.includes("cashback")) return "type-pill type-cashback";
  if (normalized.includes("bonus")) return "type-pill type-bonus";
  if (normalized.includes("payment")) return "type-pill type-payment";
  if (normalized.includes("withdraw")) return "type-pill type-withdraw";

  return "type-pill";
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

  const cashbackTransactions = filteredTransactions.filter((tx) =>
    String(getTransactionType(tx)).toLowerCase().includes("cashback")
  ).length;

  if (loading) {
    return (
      <div className="transactions-premium-page">
        <style>{transactionsStyles}</style>

        <div className="hero-line" />

        <div className="transactions-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO LEDGER</div>
            <h1 className="hero-title">Transazioni</h1>
            <p className="hero-subtitle">
              Caricamento storico movimenti in corso...
            </p>
          </div>
        </div>

        <div className="loading-box premium-card">
          <p>Recupero transazioni premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transactions-premium-page">
        <style>{transactionsStyles}</style>

        <div className="hero-line" />

        <div className="transactions-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO LEDGER</div>
            <h1 className="hero-title">Transazioni</h1>
            <p className="hero-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="transactions-premium-page">
      <style>{transactionsStyles}</style>

      <div className="hero-line" />

      <div className="transactions-premium-hero">
        <div>
          <div className="hero-eyebrow">GUFO LEDGER</div>
          <h1 className="hero-title">Transazioni</h1>
          <p className="hero-subtitle">
            Storico completo dei movimenti utente con filtro live
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Ledger Active
        </div>
      </div>

      <div className="stats-row">
        <div className="mini-stat premium-card">
          <div className="mini-stat-number">{filteredTransactions.length}</div>
          <div className="mini-stat-label">Transazioni filtrate</div>
          <div className="mini-stat-side">Live</div>
        </div>

        <div className="mini-stat premium-card">
          <div className="mini-stat-number">€ {totalAmount.toFixed(2)}</div>
          <div className="mini-stat-label">Importo totale</div>
          <div className="mini-stat-side">Amount</div>
        </div>

        <div className="mini-stat premium-card">
          <div className="mini-stat-number">{totalGufo.toFixed(2)}</div>
          <div className="mini-stat-label">GUFO totali</div>
          <div className="mini-stat-side">Rewards</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="left-column premium-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Tutte le transazioni</h2>
              <p className="section-subtitle">
                Storico completo filtrato in tempo reale
              </p>
            </div>
            <span className="section-count">Totale: {filteredTransactions.length}</span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nessuna transazione trovata</div>
              <div className="empty-text">
                Quando userai GUFO, qui vedrai tutti i movimenti filtrabili per tipo e merchant.
              </div>
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
                        <td>
                          <span className={getTypeClass(getTransactionType(tx))}>
                            {getTransactionType(tx)}
                          </span>
                        </td>
                        <td className="amount-cell">
                          € {getTransactionAmount(tx).toFixed(2)}
                        </td>
                        <td>{getTransactionGufo(tx).toFixed(2)}</td>
                        <td>{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-only mobile-list">
                {filteredTransactions.map((tx, index) => (
                  <div className="mobile-tx-card" key={tx.id || tx.transaction_id || index}>
                    <div className="mobile-tx-top">
                      <strong>{getTransactionMerchant(tx)}</strong>
                      <span className={getTypeClass(getTransactionType(tx))}>
                        {getTransactionType(tx)}
                      </span>
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

                    <div className="mobile-tx-row">
                      <span>Data</span>
                      <span>{formatDate(tx.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="right-column premium-card">
          <div className="section-header">
            <h2 className="section-title">Insights</h2>
            <span className="pro-badge">PRO</span>
          </div>

          <div className="info-stack">
            <div className="info-card">
              <div className="info-icon info-icon-cyan" />
              <div className="info-copy">
                <div className="info-main">{filteredTransactions.length}</div>
                <div className="info-sub">Movimenti visibili</div>
              </div>
              <div className="info-tag">LIVE</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-pink" />
              <div className="info-copy">
                <div className="info-main">€ {totalAmount.toFixed(2)}</div>
                <div className="info-sub">Volume filtrato</div>
              </div>
              <div className="info-tag">TOT</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-gold" />
              <div className="info-copy">
                <div className="info-main">{totalGufo.toFixed(2)}</div>
                <div className="info-sub">GUFO generati</div>
              </div>
              <div className="info-tag">EARN</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-green" />
              <div className="info-copy">
                <div className="info-main">{cashbackTransactions}</div>
                <div className="info-sub">Cashback registrati</div>
              </div>
              <div className="info-tag">CB</div>
            </div>
          </div>
        </div>
      </div>

      <div className="filters-panel premium-card">
        <div className="section-header filters-header">
          <div>
            <h2 className="section-title">Filtri</h2>
            <p className="section-subtitle">
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
              placeholder="Es. Coop, Eni, Adidas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const transactionsStyles = `
  * {
    box-sizing: border-box;
  }

  .transactions-premium-page {
    position: relative;
    min-height: 100%;
    color: #ffffff;
  }

  .transactions-premium-page::before {
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

  .transactions-premium-page > * {
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

  .transactions-premium-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
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
    line-height: 1.5;
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
    margin-bottom: 22px;
  }

  .left-column,
  .right-column,
  .filters-panel {
    padding: 22px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
  }

  .filters-header {
    margin-bottom: 20px;
  }

  .section-title {
    margin: 0;
    font-size: 22px;
    font-weight: 900;
    color: #ffffff;
  }

  .section-subtitle {
    margin: 6px 0 0 0;
    color: #d7e2f2;
    font-size: 14px;
    line-height: 1.5;
  }

  .section-count,
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
    vertical-align: middle;
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

  .type-cashback {
    background: rgba(34, 197, 94, 0.14);
    border-color: rgba(134, 239, 172, 0.22);
    color: #dcfce7;
  }

  .type-bonus {
    background: rgba(168, 85, 247, 0.16);
    border-color: rgba(216, 180, 254, 0.22);
    color: #f3e8ff;
  }

  .type-payment {
    background: rgba(59, 130, 246, 0.16);
    border-color: rgba(147, 197, 253, 0.22);
    color: #dbeafe;
  }

  .type-withdraw {
    background: rgba(251, 146, 60, 0.16);
    border-color: rgba(253, 186, 116, 0.24);
    color: #ffedd5;
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

  .info-icon-cyan {
    background: radial-gradient(circle at 30% 30%, #67e8f9, #2563eb);
  }

  .info-icon-pink {
    background: radial-gradient(circle at 30% 30%, #f9a8d4, #a855f7);
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

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
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
  }

  @media (max-width: 980px) {
    .stats-row {
      grid-template-columns: 1fr;
    }

    .hero-title {
      font-size: 42px;
    }
  }

  @media (max-width: 768px) {
    .transactions-premium-hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-title {
      font-size: 34px;
    }

    .left-column,
    .right-column,
    .filters-panel,
    .mini-stat {
      padding: 16px;
    }

    .filters-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .section-header {
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
`;