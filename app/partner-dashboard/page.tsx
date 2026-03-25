"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";

type Transaction = {
  id?: string | null;
  transaction_id?: string | null;
  Transaction_id?: string | null;
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
  partner_id?: number | string | null;
  raw?: unknown;
};

type PartnerStatsResponse = {
  total_transactions?: number | string | null;
  total_amount?: number | string | null;
  total_gufo_distributed?: number | string | null;
  recent_transactions?: Transaction[];
  transactions?: Transaction[];
  partner_id?: number | string | null;
  stats?: {
    total_transactions?: number | string | null;
    total_amount?: number | string | null;
    total_gufo_distributed?: number | string | null;
    recent_transactions?: Transaction[];
    transactions?: Transaction[];
    partner_id?: number | string | null;
  };
  error?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

const PARTNER_OPTIONS = [
  { id: 2, label: "Eni" },
  { id: 3, label: "Coop" },
];

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getTransactionId(tx: any) {
  return (
    tx?.id ??
    tx?.transaction_id ??
    tx?.Transaction_id ??
    tx?.raw?.id ??
    tx?.raw?.transaction_id ??
    tx?.raw?.Transaction_id ??
    null
  );
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

function getTransactionPartnerId(tx: any) {
  return toNumberSafe(tx?.partner_id ?? tx?.raw?.partner_id);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("it-IT");
}

function getTypeClass(type: string) {
  const normalized = String(type).toLowerCase();

  if (normalized.includes("cashback")) return "type-pill type-cashback";
  if (normalized.includes("bonus")) return "type-pill type-bonus";
  if (normalized.includes("payment")) return "type-pill type-payment";
  if (normalized.includes("withdraw")) return "type-pill type-withdraw";

  return "type-pill";
}

export default function PartnerDashboardPage() {
  const [selectedPartnerId, setSelectedPartnerId] = useState<number>(3);
  const [data, setData] = useState<PartnerStatsResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats(partnerId: number) {
    try {
      setLoading(true);
      setError("");

      const { response, data } = await safeJsonFetch(
        `${API_URL}/partner/stats?partner_id=${partnerId}`
      );

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

      const normalizedTransactions: Transaction[] = rawTransactions
        .map((tx: any) => ({
          id: getTransactionId(tx),
          transaction_id:
            tx?.transaction_id ?? tx?.Transaction_id ?? tx?.id ?? null,
          Transaction_id:
            tx?.Transaction_id ?? tx?.transaction_id ?? tx?.id ?? null,
          type: getTransactionType(tx),
          merchant_name: getTransactionMerchant(tx),
          amount_euro: getTransactionAmount(tx),
          gufo_earned: getTransactionGufo(tx),
          created_at: tx?.created_at ?? tx?.raw?.created_at ?? null,
          partner_id: tx?.partner_id ?? tx?.raw?.partner_id ?? null,
          raw: tx?.raw ?? tx,
        }))
        .sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        });

      setData(stats);
      setTransactions(normalizedTransactions);
    } catch (err: any) {
      setError(err?.message || "Errore sconosciuto");
      setData(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats(selectedPartnerId);
  }, [selectedPartnerId]);

  const activePartnerLabel =
    PARTNER_OPTIONS.find((p) => p.id === selectedPartnerId)?.label ||
    `Partner ${selectedPartnerId}`;

  const avgTicket =
    toNumberSafe(data?.total_transactions) > 0
      ? toNumberSafe(data?.total_amount) / toNumberSafe(data?.total_transactions)
      : 0;

  if (loading) {
    return (
      <div className="partner-dashboard-premium-page">
        <style>{partnerDashboardStyles}</style>

        <div className="hero-line" />

        <div className="dashboard-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO PARTNER ANALYTICS</div>
            <h1 className="hero-page-title">Partner Dashboard</h1>
            <p className="hero-page-subtitle">Caricamento statistiche...</p>
          </div>
        </div>

        <div className="loading-box premium-card">
          <p>Recupero analytics partner premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partner-dashboard-premium-page">
        <style>{partnerDashboardStyles}</style>

        <div className="hero-line" />

        <div className="dashboard-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO PARTNER ANALYTICS</div>
            <h1 className="hero-page-title">Partner Dashboard</h1>
            <p className="hero-page-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="toolbar-row">
          <div className="toolbar-card premium-card">
            <div className="toolbar-left">
              <div className="field-inline">
                <label className="field-label">Partner</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                  className="field-input"
                >
                  {PARTNER_OPTIONS.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.label} (ID {partner.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => loadStats(selectedPartnerId)}
              className="refresh-button"
            >
              Ricarica
            </button>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="partner-dashboard-premium-page">
      <style>{partnerDashboardStyles}</style>

      <div className="hero-line" />

      <div className="dashboard-premium-hero">
        <div>
          <div className="hero-eyebrow">GUFO PARTNER ANALYTICS</div>
          <h1 className="hero-page-title">Partner Dashboard</h1>
          <p className="hero-page-subtitle">
            Panoramica partner con statistiche e ultime transazioni
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Analytics Active
        </div>
      </div>

      <div className="toolbar-row">
        <div className="toolbar-card premium-card">
          <div className="toolbar-left">
            <div className="field-inline">
              <label className="field-label">Partner</label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                className="field-input"
              >
                {PARTNER_OPTIONS.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.label} (ID {partner.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="partner-meta">
              <span className="partner-badge">{activePartnerLabel}</span>
              <span className="partner-badge light">
                partner_id: {selectedPartnerId}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadStats(selectedPartnerId)}
            className="refresh-button"
          >
            Ricarica
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="mini-stat premium-card">
          <div className="mini-stat-number">
            {toNumberSafe(data?.total_transactions)}
          </div>
          <div className="mini-stat-label">Totale transazioni</div>
          <div className="mini-stat-side">Ops</div>
        </div>

        <div className="mini-stat premium-card">
          <div className="mini-stat-number">
            €{toNumberSafe(data?.total_amount).toFixed(2)}
          </div>
          <div className="mini-stat-label">Totale importi</div>
          <div className="mini-stat-side">Volume</div>
        </div>

        <div className="mini-stat premium-card">
          <div className="mini-stat-number">
            {toNumberSafe(data?.total_gufo_distributed).toFixed(2)}
          </div>
          <div className="mini-stat-label">GUFO distribuiti</div>
          <div className="mini-stat-side">Reward</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="left-column premium-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Ultime transazioni</h2>
              <p className="section-subtitle">
                Storico recente del partner selezionato
              </p>
            </div>

            <div className="mini-pill">{transactions.length} record</div>
          </div>

          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">Nessuna transazione trovata</div>
              <div className="empty-text">
                Le transazioni partner appariranno qui appena disponibili.
              </div>
            </div>
          ) : (
            <>
              <div className="table-wrap desktop-only">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Merchant</th>
                      <th>Tipo</th>
                      <th>Importo</th>
                      <th>GUFO</th>
                      <th>Partner ID</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr
                        key={
                          tx.id || tx.transaction_id || tx.Transaction_id || index
                        }
                      >
                        <td>{getTransactionId(tx) || "-"}</td>
                        <td>{getTransactionMerchant(tx)}</td>
                        <td>
                          <span className={getTypeClass(getTransactionType(tx))}>
                            {getTransactionType(tx)}
                          </span>
                        </td>
                        <td className="amount-cell">
                          €{getTransactionAmount(tx).toFixed(2)}
                        </td>
                        <td>{getTransactionGufo(tx).toFixed(2)}</td>
                        <td>{getTransactionPartnerId(tx)}</td>
                        <td>{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mobile-only mobile-list">
                {transactions.map((tx, index) => (
                  <div
                    className="mobile-tx-card"
                    key={tx.id || tx.transaction_id || tx.Transaction_id || index}
                  >
                    <div className="mobile-tx-top">
                      <strong>{getTransactionMerchant(tx)}</strong>
                      <span className={getTypeClass(getTransactionType(tx))}>
                        {getTransactionType(tx)}
                      </span>
                    </div>

                    <div className="mobile-tx-row">
                      <span>ID</span>
                      <span>{getTransactionId(tx) || "-"}</span>
                    </div>

                    <div className="mobile-tx-row">
                      <span>Importo</span>
                      <span className="amount-cell">
                        €{getTransactionAmount(tx).toFixed(2)}
                      </span>
                    </div>

                    <div className="mobile-tx-row">
                      <span>GUFO</span>
                      <span>{getTransactionGufo(tx).toFixed(2)}</span>
                    </div>

                    <div className="mobile-tx-row">
                      <span>Partner ID</span>
                      <span>{getTransactionPartnerId(tx)}</span>
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
            <h2 className="section-title">Top Info</h2>
            <span className="pro-badge">PRO</span>
          </div>

          <div className="info-stack">
            <div className="info-card">
              <div className="info-icon info-icon-cyan" />
              <div className="info-copy">
                <div className="info-main">{activePartnerLabel}</div>
                <div className="info-sub">Partner attivo</div>
              </div>
              <div className="info-tag">NOW</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-pink" />
              <div className="info-copy">
                <div className="info-main">
                  €{avgTicket.toFixed(2)}
                </div>
                <div className="info-sub">Scontrino medio</div>
              </div>
              <div className="info-tag">AVG</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-gold" />
              <div className="info-copy">
                <div className="info-main">
                  {toNumberSafe(data?.total_gufo_distributed).toFixed(2)}
                </div>
                <div className="info-sub">GUFO distribuiti</div>
              </div>
              <div className="info-tag">GFO</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-green" />
              <div className="info-copy">
                <div className="info-main">{transactions.length}</div>
                <div className="info-sub">Movimenti caricati</div>
              </div>
              <div className="info-tag">LOG</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const partnerDashboardStyles = `
  * {
    box-sizing: border-box;
  }

  .partner-dashboard-premium-page {
    position: relative;
    min-height: 100%;
    color: #ffffff;
  }

  .partner-dashboard-premium-page::before {
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

  .partner-dashboard-premium-page > * {
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

  .dashboard-premium-hero {
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

  .hero-page-title {
    margin: 0 0 8px 0;
    font-size: 58px;
    line-height: 0.96;
    font-weight: 900;
    letter-spacing: -0.04em;
    text-shadow: 0 0 18px rgba(255,255,255,0.12);
    word-break: break-word;
  }

  .hero-page-subtitle {
    margin: 0;
    color: #d7e2f2;
    font-size: 15px;
    line-height: 1.6;
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

  .toolbar-row {
    margin-bottom: 22px;
  }

  .toolbar-card {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 22px;
  }

  .toolbar-left {
    display: flex;
    align-items: end;
    gap: 14px;
    flex-wrap: wrap;
    flex: 1;
    min-width: 0;
  }

  .field-inline {
    min-width: 240px;
    flex: 1;
  }

  .field-label {
    display: block;
    margin-bottom: 8px;
    color: #b9c6e3;
    font-size: 14px;
  }

  .field-input {
    width: 100%;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    padding: 14px 16px;
    color: white;
    outline: none;
    font-size: 14px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
  }

  .field-input:focus {
    border-color: rgba(56, 189, 248, 0.35);
    box-shadow:
      0 0 0 1px rgba(56, 189, 248, 0.16),
      0 0 18px rgba(56, 189, 248, 0.06);
  }

  .field-input option {
    background: #0f172a;
    color: #ffffff;
  }

  .partner-meta {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .partner-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 8px 12px;
    background: rgba(59, 130, 246, 0.16);
    border: 1px solid rgba(59, 130, 246, 0.28);
    color: #bfdbfe;
    font-size: 13px;
    font-weight: 700;
  }

  .partner-badge.light {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.10);
    color: #e7e5e4;
  }

  .refresh-button {
    border: none;
    border-radius: 16px;
    padding: 14px 16px;
    color: white;
    font-weight: 800;
    font-size: 15px;
    cursor: pointer;
    background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%);
    box-shadow:
      0 12px 24px rgba(14, 165, 233, 0.18),
      0 0 18px rgba(37, 99, 235, 0.10);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .refresh-button:hover {
    opacity: 0.97;
    transform: translateY(-1px);
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
    grid-template-columns: minmax(0, 1.45fr) 340px;
    gap: 20px;
  }

  .left-column,
  .right-column {
    padding: 22px;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
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

  .section-subtitle {
    margin: 6px 0 0 0;
    color: #d7e2f2;
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
    color: #cbd5e1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding: 12px 8px 12px 0;
    text-align: left;
    font-weight: 700;
    font-size: 13px;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  .transactions-table td {
    padding: 16px 8px 16px 0;
    color: #f4f7ff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 14px;
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

  @media (max-width: 1024px) {
    .stats-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 980px) {
    .hero-page-title {
      font-size: 42px;
    }
  }

  @media (max-width: 768px) {
    .dashboard-premium-hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-page-title {
      font-size: 34px;
    }

    .toolbar-card,
    .left-column,
    .right-column,
    .mini-stat {
      padding: 16px;
    }

    .toolbar-left {
      width: 100%;
      align-items: stretch;
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

  @media (max-width: 480px) {
    .hero-page-title {
      font-size: 30px;
    }

    .section-title {
      font-size: 20px;
    }

    .mini-stat-number {
      font-size: 26px;
    }
  }
`;