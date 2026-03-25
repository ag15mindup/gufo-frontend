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

        <div className={styles.hero}>
          <div>
            <p className={styles.welcome}>GUFO LEDGER</p>
            <h1 className={styles.userName}>Transazioni</h1>
            <p className={styles.email}>Caricamento storico movimenti...</p>
          </div>
        </div>

        <div className={styles.loadingBox}>Recupero transazioni in corso...</div>
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
            <p className={styles.welcome}>GUFO LEDGER</p>
            <h1 className={styles.userName}>Transazioni</h1>
            <p className={styles.email}>Si è verificato un problema.</p>
          </div>
        </div>

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
          <p className={styles.welcome}>GUFO LEDGER</p>
          <h1 className={styles.userName}>Transazioni</h1>
          <p className={styles.email}>
            Storico completo dei movimenti utente con filtro live
          </p>
        </div>

        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Ledger Active</span>
          <h2 className={styles.balanceValue}>{filteredTransactions.length}</h2>
          <div className={styles.balanceSubValue}>movimenti filtrati visibili</div>

          <div className={styles.balanceButtons}>
            <button type="button" className={styles.primaryBtn}>
              € {totalAmount.toFixed(2)}
            </button>
            <button type="button" className={styles.secondaryBtn}>
              {totalGufo.toFixed(2)} GUFO
            </button>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cyan}`}>
          <div>
            <div className={styles.statValue}>{filteredTransactions.length}</div>
            <div className={styles.statLabel}>Transazioni filtrate</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>↗</div>
            <div className={styles.statHint}>Live</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.purple}`}>
          <div>
            <div className={styles.statValue}>€ {totalAmount.toFixed(2)}</div>
            <div className={styles.statLabel}>Importo totale</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>€</div>
            <div className={styles.statHint}>Amount</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.orange}`}>
          <div>
            <div className={styles.statValue}>{totalGufo.toFixed(2)}</div>
            <div className={styles.statLabel}>GUFO totali</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>G</div>
            <div className={styles.statHint}>Rewards</div>
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Tutte le transazioni</h3>
              <p className={styles.panelSubtext}>
                Storico completo filtrato in tempo reale
              </p>
            </div>
            <span>Totale: {filteredTransactions.length}</span>
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
                  <div className={styles.mobileTxCard} key={tx.id || tx.transaction_id || index}>
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
        </section>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Insights</h3>
            <span>PRO</span>
          </div>

          <div className={styles.topList}>
            <div className={styles.topItem}>
              <div className={styles.avatar}>L</div>
              <div>
                <strong>{filteredTransactions.length}</strong>
                <p>Movimenti visibili</p>
              </div>
              <span>live</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>€</div>
              <div>
                <strong>€ {totalAmount.toFixed(2)}</strong>
                <p>Volume filtrato</p>
              </div>
              <span>tot</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>G</div>
              <div>
                <strong>{totalGufo.toFixed(2)}</strong>
                <p>GUFO generati</p>
              </div>
              <span>earn</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>C</div>
              <div>
                <strong>{cashbackTransactions}</strong>
                <p>Cashback registrati</p>
              </div>
              <span>cb</span>
            </div>
          </div>
        </aside>
      </div>

      <section className={styles.filterPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Filtri</h3>
            <p className={styles.panelSubtext}>
              Seleziona tipo transazione o cerca per merchant
            </p>
          </div>
          <span>Search & Filter</span>
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
    </div>
  );
}