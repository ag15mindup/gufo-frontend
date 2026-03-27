"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./transactions.module.css";

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
    "Partner GUFO"
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

function getTypeTone(type: string) {
  const normalized = String(type).toLowerCase();

  if (normalized.includes("cashback")) return styles.greenBadge;
  if (normalized.includes("bonus")) return styles.purpleBadge;
  if (normalized.includes("payment")) return styles.blueBadge;
  if (normalized.includes("withdraw")) return styles.orangeBadge;

  return "";
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
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <p className={styles.eyebrow}>GUFO Ledger</p>
          <h1 className={styles.title}>Transazioni</h1>
          <p className={styles.subtitle}>Caricamento storico movimenti...</p>
        </section>

        <div className={styles.loadingBox}>Recupero transazioni in corso...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <p className={styles.eyebrow}>GUFO Ledger</p>
          <h1 className={styles.title}>Transazioni</h1>
          <p className={styles.subtitle}>Si è verificato un problema.</p>
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
        <div>
          <p className={styles.eyebrow}>GUFO Ledger</p>
          <h1 className={styles.title}>Storico transazioni</h1>
          <p className={styles.subtitle}>
            Archivio completo dei movimenti con ricerca e filtri in tempo reale.
          </p>
        </div>
      </section>

      <section className={styles.filterPanel}>
        <div className={styles.filterPanelHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Search & Filter</p>
            <h3>Filtri transazioni</h3>
          </div>
          <span className={styles.filterCount}>
            {filteredTransactions.length} risultati
          </span>
        </div>

        <div className={styles.filtersGrid}>
          <div>
            <label className={styles.inputLabel}>Tipo transazione</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={styles.inputControl}
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
            <label className={styles.inputLabel}>Cerca merchant</label>
            <input
              type="text"
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
              className={styles.inputControl}
              placeholder="Es. Coop, Eni, Adidas"
            />
          </div>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Movimenti visibili</p>
          <h3 className={styles.metricValue}>{filteredTransactions.length}</h3>
          <span className={styles.metricHint}>Totale righe filtrate</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Importo totale</p>
          <h3 className={styles.metricValue}>€ {totalAmount.toFixed(2)}</h3>
          <span className={styles.metricHint}>Volume dei movimenti selezionati</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>GUFO generati</p>
          <h3 className={styles.metricValue}>{totalGufo.toFixed(2)}</h3>
          <span className={styles.metricHint}>Rewards tracciate nello storico</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Cashback registrati</p>
          <h3 className={styles.metricValue}>{cashbackTransactions}</h3>
          <span className={styles.metricHint}>Movimenti di tipo cashback</span>
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Full history</p>
              <h3>Tutte le transazioni</h3>
            </div>
            <span className={styles.panelBadge}>Ordinamento recente</span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>Nessuna transazione trovata</div>
              <div className={styles.emptyText}>
                Quando userai GUFO, qui vedrai tutti i movimenti filtrabili per tipo e merchant.
              </div>
            </div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
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
                        <td>{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.mobileList}>
                {filteredTransactions.map((tx, index) => (
                  <div
                    className={styles.mobileTxCard}
                    key={tx.id || tx.transaction_id || index}
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
                      <span>Importo</span>
                      <span>€ {getTransactionAmount(tx).toFixed(2)}</span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>GUFO</span>
                      <span>{getTransactionGufo(tx).toFixed(2)}</span>
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
            <p className={styles.sideLabel}>Movimenti visibili</p>
            <h4>{filteredTransactions.length}</h4>
            <span>Risultati correnti dopo i filtri</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Volume filtrato</p>
            <h4>€ {totalAmount.toFixed(2)}</h4>
            <span>Somma degli importi selezionati</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>GUFO rewards</p>
            <h4>{totalGufo.toFixed(2)}</h4>
            <span>Totale rewards generate</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Cashback count</p>
            <h4>{cashbackTransactions}</h4>
            <span>Numero movimenti cashback</span>
          </div>
        </aside>
      </section>
    </div>
  );
}