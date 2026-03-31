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

function formatTransactionType(type?: string) {
  const value = String(type || "-").toLowerCase();

  switch (value) {
    case "cashback":
      return "Cashback";
    case "payment":
      return "Pagamento";
    case "bonus":
      return "Bonus";
    case "buy":
      return "Acquisto";
    case "acquisto":
      return "Acquisto";
    case "withdraw":
      return "Prelievo";
    default:
      return value === "-" ? "-" : value.charAt(0).toUpperCase() + value.slice(1);
  }
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
  if (normalized.includes("buy") || normalized.includes("acquisto"))
    return styles.cyanBadge;

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

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO MERCHANT ANALYTICS</div>
            <p className={styles.eyebrow}>GUFO Merchant Analytics</p>
            <h1 className={styles.title}>Partner dashboard</h1>
            <p className={styles.subtitle}>Caricamento statistiche partner...</p>
          </div>
        </section>

        <div className={styles.loadingBox}>Recupero analytics partner...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO MERCHANT ANALYTICS</div>
            <p className={styles.eyebrow}>GUFO Merchant Analytics</p>
            <h1 className={styles.title}>Partner dashboard</h1>
            <p className={styles.subtitle}>Si è verificato un problema.</p>
          </div>
        </section>

        <section className={styles.filterPanel}>
          <div className={styles.filterPanelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Partner Selection</p>
              <h3>Seleziona partner</h3>
            </div>
            <span className={styles.panelBadge}>Analytics</span>
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

        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgOverlay} />
      <div className={styles.rainbowLine} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>GUFO MERCHANT ANALYTICS</div>
          <p className={styles.eyebrow}>GUFO Merchant Analytics</p>
          <h1 className={styles.title}>Performance partner</h1>
          <p className={styles.subtitle}>
            Panoramica operativa del partner con statistiche principali e
            transazioni recenti.
          </p>
          <p className={styles.heroDescription}>
            Una dashboard merchant pensata per leggere rapidamente volume,
            reward distribuite e attività recente del punto vendita.
          </p>
        </div>
      </section>

      <section className={styles.operatorCard}>
        <div className={styles.operatorCardLeft}>
          <div className={styles.operatorTopRow}>
            <span className={styles.operatorChip}>Partner attivo</span>
            <span className={styles.operatorStatus}>Live data</span>
          </div>

          <p className={styles.operatorLabel}>Merchant selezionato</p>
          <h2 className={styles.operatorValue}>{activePartnerLabel}</h2>
          <p className={styles.operatorNote}>
            Analytics riferite al partner con ID {selectedPartnerId},
            comprensive di volumi, reward e attività recente.
          </p>
        </div>

        <div className={styles.operatorCardRight}>
          <div className={styles.operatorMiniCard}>
            <span>Partner ID</span>
            <strong>{selectedPartnerId}</strong>
          </div>

          <div className={styles.operatorMiniCard}>
            <span>Volume totale</span>
            <strong>€ {toNumberSafe(data?.total_amount).toFixed(2)}</strong>
          </div>

          <div className={styles.operatorMiniCard}>
            <span>GUFO distribuiti</span>
            <strong>{toNumberSafe(data?.total_gufo_distributed).toFixed(2)}</strong>
          </div>
        </div>
      </section>

      <section className={styles.filterPanel}>
        <div className={styles.filterPanelHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Partner Selection</p>
            <h3>Selezione partner</h3>
          </div>
          <span className={styles.panelBadge}>Analytics Active</span>
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

      <section className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
          <p className={styles.metricLabel}>Totale transazioni</p>
          <h3 className={styles.metricValue}>
            {toNumberSafe(data?.total_transactions)}
          </h3>
          <span className={styles.metricHint}>Operazioni registrate</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Volume totale</p>
          <h3 className={styles.metricValue}>
            € {toNumberSafe(data?.total_amount).toFixed(2)}
          </h3>
          <span className={styles.metricHint}>Importo complessivo delle vendite</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>GUFO distribuiti</p>
          <h3 className={styles.metricValue}>
            {toNumberSafe(data?.total_gufo_distributed).toFixed(2)}
          </h3>
          <span className={styles.metricHint}>Reward erogate dal partner</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Scontrino medio</p>
          <h3 className={styles.metricValue}>€ {avgTicket.toFixed(2)}</h3>
          <span className={styles.metricHint}>Valore medio per transazione</span>
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Recent activity</p>
              <h3>Ultime transazioni</h3>
            </div>
            <span className={styles.panelBadge}>{transactions.length} record</span>
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
                            {formatTransactionType(getTransactionType(tx))}
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
                        {formatTransactionType(getTransactionType(tx))}
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
        </div>

        <aside className={styles.sideColumn}>
          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Partner attivo</p>
            <h4>{activePartnerLabel}</h4>
            <span>Merchant selezionato nella dashboard</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Scontrino medio</p>
            <h4>€ {avgTicket.toFixed(2)}</h4>
            <span>Valore medio per operazione</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>GUFO distribuiti</p>
            <h4>{toNumberSafe(data?.total_gufo_distributed).toFixed(2)}</h4>
            <span>Reward totali erogate</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Movimenti caricati</p>
            <h4>{transactions.length}</h4>
            <span>Record visibili nello storico</span>
          </div>
        </aside>
      </section>
    </div>
  );
}