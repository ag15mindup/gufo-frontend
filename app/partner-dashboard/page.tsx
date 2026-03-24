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

  return date.toLocaleString("it-IT");
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

  if (loading) {
    return (
      <div className="partner-dashboard-page">
        <style>{partnerDashboardStyles}</style>

        <div className="dashboard-hero">
          <div>
            <div className="eyebrow">GUFO PARTNER ANALYTICS</div>
            <h1 className="page-title">Partner Dashboard</h1>
            <p className="page-subtitle">Caricamento statistiche...</p>
          </div>
        </div>

        <div className="loading-shell neon-card">
          <div className="loading-glow" />
          <p className="loading-text">Recupero analytics partner in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="partner-dashboard-page">
        <style>{partnerDashboardStyles}</style>

        <div className="dashboard-hero">
          <div>
            <div className="eyebrow">GUFO PARTNER ANALYTICS</div>
            <h1 className="page-title">Partner Dashboard</h1>
            <p className="page-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="toolbar-row">
          <div className="toolbar-card neon-card">
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
    <div className="partner-dashboard-page">
      <style>{partnerDashboardStyles}</style>

      <div className="dashboard-hero">
        <div>
          <div className="eyebrow">GUFO PARTNER ANALYTICS</div>
          <h1 className="page-title">Partner Dashboard</h1>
          <p className="page-subtitle">
            Panoramica partner con statistiche e ultime transazioni
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Analytics Active
        </div>
      </div>

      <div className="toolbar-row">
        <div className="toolbar-card neon-card">
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

      <div className="stats-grid">
        <div className="stat-card neon-card">
          <div className="card-orb orb-cyan" />
          <div className="stat-topline">Operations</div>
          <p className="stat-label">Totale transazioni</p>
          <p className="stat-value">
            {toNumberSafe(data?.total_transactions)}
          </p>
        </div>

        <div className="stat-card neon-card">
          <div className="card-orb orb-pink" />
          <div className="stat-topline">Volume</div>
          <p className="stat-label">Totale importi</p>
          <p className="stat-value smaller-value">
            €{toNumberSafe(data?.total_amount).toFixed(2)}
          </p>
        </div>

        <div className="stat-card neon-card">
          <div className="stat-topline">Rewards</div>
          <p className="stat-label">GUFO distribuiti</p>
          <p className="stat-value">
            {toNumberSafe(data?.total_gufo_distributed).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="panel neon-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Ultime transazioni</h2>
            <p className="panel-subtitle">
              Storico recente del partner selezionato
            </p>
          </div>

          <div className="panel-count">{transactions.length} record</div>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p className="empty-title">Nessuna transazione trovata</p>
            <p className="empty-text">
              Le transazioni partner appariranno qui appena disponibili.
            </p>
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
                      <td>{getTransactionType(tx)}</td>
                      <td className="amount-green">
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

            <div className="mobile-transactions mobile-only">
              {transactions.map((tx, index) => (
                <div
                  className="tx-card"
                  key={
                    tx.id || tx.transaction_id || tx.Transaction_id || index
                  }
                >
                  <div className="tx-row">
                    <span className="tx-label">ID</span>
                    <span className="tx-value">{getTransactionId(tx) || "-"}</span>
                  </div>

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
                    <span className="tx-label">Partner ID</span>
                    <span className="tx-value">{getTransactionPartnerId(tx)}</span>
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
    width: 100%;
    color: #ffffff;
    min-height: 100%;
    position: relative;
  }

  .partner-dashboard-page::before {
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

  .dashboard-hero,
  .toolbar-row,
  .stats-grid,
  .panel,
  .error-box,
  .loading-shell {
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

  .toolbar-row {
    margin-bottom: 24px;
  }

  .toolbar-card {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
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

  .stat-card > * {
    position: relative;
    z-index: 1;
  }

  .stat-topline {
    margin: 0 0 10px 0;
    color: #9fb0d3;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .stat-label {
    margin: 0 0 12px 0;
    color: #d8e2f4;
    font-size: 14px;
  }

  .stat-value {
    margin: 0;
    font-size: 34px;
    font-weight: 900;
    line-height: 1.05;
    word-break: break-word;
    color: #ffffff;
  }

  .smaller-value {
    font-size: 30px;
  }

  .panel {
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }

  .panel-title {
    margin: 0 0 6px 0;
    font-size: 28px;
    line-height: 1.05;
    color: #ffffff;
    font-weight: 800;
  }

  .panel-subtitle {
    margin: 0;
    color: #b9c6e3;
    font-size: 14px;
    line-height: 1.5;
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
    margin: 0;
    color: #b9c6e3;
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
    .dashboard-hero {
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

    .toolbar-card {
      align-items: stretch;
    }

    .toolbar-left {
      width: 100%;
      align-items: stretch;
    }

    .stat-value {
      font-size: 28px;
    }

    .smaller-value {
      font-size: 26px;
    }

    .panel-header {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .panel-title {
      font-size: 22px;
      margin-bottom: 0;
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
      font-size: 24px;
    }

    .smaller-value {
      font-size: 22px;
    }

    .tx-label,
    .tx-value {
      font-size: 12px;
    }
  }
`;