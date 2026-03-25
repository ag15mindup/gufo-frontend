"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import styles from "./partner-dashboard.module.css";

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

function getTypeTone(type: string) {
  const normalized = String(type).toLowerCase();

  if (normalized.includes("cashback")) return styles.greenBadge;
  if (normalized.includes("bonus")) return styles.purpleBadge;
  if (normalized.includes("payment")) return styles.blueBadge;
  if (normalized.includes("withdraw")) return styles.orangeBadge;

  return "";
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
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <div className={styles.hero}>
          <div>
            <p className={styles.welcome}>GUFO PARTNER ANALYTICS</p>
            <h1 className={styles.userName}>Partner Dashboard</h1>
            <p className={styles.email}>Caricamento statistiche...</p>
          </div>
        </div>

        <div className={styles.loadingBox}>Recupero analytics partner...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <div className={styles.hero}>
          <div>
            <p className={styles.welcome}>GUFO PARTNER ANALYTICS</p>
            <h1 className={styles.userName}>Partner Dashboard</h1>
            <p className={styles.email}>Si è verificato un problema.</p>
          </div>
        </div>

        <section className={styles.filterPanel}>
          <div className={styles.filtersGrid}>
            <div>
              <label className={styles.inputLabel}>Partner</label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                className={styles.inputControl}
              >
                {PARTNER_OPTIONS.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.label} (ID {partner.id})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.buttonWrap}>
              <button
                type="button"
                onClick={() => loadStats(selectedPartnerId)}
                className={styles.primaryBtn}
              >
                Ricarica
              </button>
            </div>
          </div>
        </section>

        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgOverlay} />
      <div className={styles.rainbowLine} />

      <div className={styles.hero}>
        <div>
          <p className={styles.welcome}>GUFO PARTNER ANALYTICS</p>
          <h1 className={styles.userName}>Partner Dashboard</h1>
          <p className={styles.email}>
            Panoramica partner con statistiche e ultime transazioni
          </p>
        </div>

        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Partner attivo</span>
          <h2 className={styles.balanceValue}>{activePartnerLabel}</h2>
          <div className={styles.balanceSubValue}>
            partner_id: {selectedPartnerId}
          </div>

          <div className={styles.balanceButtons}>
            <button type="button" className={styles.primaryBtn}>
              € {toNumberSafe(data?.total_amount).toFixed(2)}
            </button>
            <button type="button" className={styles.secondaryBtn}>
              {toNumberSafe(data?.total_gufo_distributed).toFixed(2)} GUFO
            </button>
          </div>
        </div>
      </div>

      <section className={styles.filterPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Selezione partner</h3>
            <p className={styles.panelSubtext}>
              Cambia partner e aggiorna le statistiche live
            </p>
          </div>
          <span>Analytics Active</span>
        </div>

        <div className={styles.filtersGrid}>
          <div>
            <label className={styles.inputLabel}>Partner</label>
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
              className={styles.inputControl}
            >
              {PARTNER_OPTIONS.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.label} (ID {partner.id})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.buttonWrap}>
            <button
              type="button"
              onClick={() => loadStats(selectedPartnerId)}
              className={styles.primaryBtn}
            >
              Ricarica
            </button>
          </div>
        </div>
      </section>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cyan}`}>
          <div>
            <div className={styles.statValue}>
              {toNumberSafe(data?.total_transactions)}
            </div>
            <div className={styles.statLabel}>Totale transazioni</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>#</div>
            <div className={styles.statHint}>Ops</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.purple}`}>
          <div>
            <div className={styles.statValue}>
              € {toNumberSafe(data?.total_amount).toFixed(2)}
            </div>
            <div className={styles.statLabel}>Totale importi</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>€</div>
            <div className={styles.statHint}>Volume</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.orange}`}>
          <div>
            <div className={styles.statValue}>
              {toNumberSafe(data?.total_gufo_distributed).toFixed(2)}
            </div>
            <div className={styles.statLabel}>GUFO distribuiti</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>G</div>
            <div className={styles.statHint}>Reward</div>
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Ultime transazioni</h3>
              <p className={styles.panelSubtext}>
                Storico recente del partner selezionato
              </p>
            </div>
            <span>{transactions.length} record</span>
          </div>

          {transactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>Nessuna transazione trovata</div>
              <div className={styles.emptyText}>
                Le transazioni partner appariranno qui appena disponibili.
              </div>
            </div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
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
                        <td className={styles.partnerCell}>
                          {getTransactionMerchant(tx)}
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${getTypeTone(
                              getTransactionType(tx)
                            )}`}
                          >
                            {getTransactionType(tx)}
                          </span>
                        </td>
                        <td>€ {getTransactionAmount(tx).toFixed(2)}</td>
                        <td>{getTransactionGufo(tx).toFixed(2)}</td>
                        <td>{getTransactionPartnerId(tx)}</td>
                        <td>{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.mobileList}>
                {transactions.map((tx, index) => (
                  <div
                    className={styles.mobileTxCard}
                    key={tx.id || tx.transaction_id || tx.Transaction_id || index}
                  >
                    <div className={styles.mobileTxTop}>
                      <strong>{getTransactionMerchant(tx)}</strong>
                      <span
                        className={`${styles.badge} ${getTypeTone(
                          getTransactionType(tx)
                        )}`}
                      >
                        {getTransactionType(tx)}
                      </span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>ID</span>
                      <span>{getTransactionId(tx) || "-"}</span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>Importo</span>
                      <span>€ {getTransactionAmount(tx).toFixed(2)}</span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>GUFO</span>
                      <span>{getTransactionGufo(tx).toFixed(2)}</span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>Partner ID</span>
                      <span>{getTransactionPartnerId(tx)}</span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>Data</span>
                      <span>{formatDate(tx.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Top Info</h3>
            <span>PRO</span>
          </div>

          <div className={styles.topList}>
            <div className={styles.topItem}>
              <div className={styles.avatar}>P</div>
              <div>
                <strong>{activePartnerLabel}</strong>
                <p>Partner attivo</p>
              </div>
              <span>now</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>€</div>
              <div>
                <strong>€ {avgTicket.toFixed(2)}</strong>
                <p>Scontrino medio</p>
              </div>
              <span>avg</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>G</div>
              <div>
                <strong>
                  {toNumberSafe(data?.total_gufo_distributed).toFixed(2)}
                </strong>
                <p>GUFO distribuiti</p>
              </div>
              <span>gfo</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>#</div>
              <div>
                <strong>{transactions.length}</strong>
                <p>Movimenti caricati</p>
              </div>
              <span>log</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}