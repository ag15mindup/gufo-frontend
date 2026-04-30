"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./partner-dashboard.module.css";

const supabase = createClient();

type ProfileRow = {
  id: string;
  role?: string | null;
};

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
  user_id?: string | null;
  customer_id?: string | null;
  raw?: any;
};

type PartnerStatsResponse = {
  success?: boolean;
  total_transactions?: number | string | null;
  total_amount?: number | string | null;
  total_gufo_distributed?: number | string | null;
  total_customers?: number | string | null;
  current_default_cashback_percent?: number | string | null;
  recent_transactions?: Transaction[];
  partner_id?: number | string | null;
  partner_name?: string | null;
  error?: string;
};

const API_URL =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "https://gufo-backend1.onrender.com";

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
    tx?.gufo_earned ?? tx?.gufo ?? tx?.raw?.gufo_earned ?? tx?.raw?.gufo
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("it-IT");
}

function getTypeTone(type: string, stylesObj: any) {
  const normalized = String(type).toLowerCase();

  if (normalized.includes("cashback")) return stylesObj.greenBadge;
  if (normalized.includes("bonus")) return stylesObj.purpleBadge;
  if (normalized.includes("payment")) return stylesObj.blueBadge;
  if (normalized.includes("withdraw")) return stylesObj.orangeBadge;
  if (normalized.includes("buy") || normalized.includes("acquisto")) {
    return stylesObj.cyanBadge;
  }

  return "";
}

function isToday(dateValue?: string | null) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();

  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function getCustomerId(tx: any) {
  return (
    tx?.user_id ??
    tx?.raw?.user_id ??
    tx?.customer_id ??
    tx?.raw?.customer_id ??
    null
  );
}

export default function PartnerDashboardPage() {
  const router = useRouter();

  const [partnerUserId, setPartnerUserId] = useState<string>("");
  const [data, setData] = useState<PartnerStatsResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
const [cancelMessage, setCancelMessage] = useState("");
  async function loadPartnerStats(userId: string) {
    try {
      setLoading(true);
      setError("");

      const result = await safeJsonFetch(
        `${API_URL}/partner/stats/me?user_id=${encodeURIComponent(userId)}`
      );

      console.log("API_URL:", API_URL);
      console.log("RESULT:", result);

      const response = result?.response;
      const payload = result?.data as PartnerStatsResponse | undefined;

      if (!response || !response.ok || !payload || payload.success === false) {
        throw new Error(payload?.error || "Errore nel caricamento statistiche partner");
      }

      const rawTransactions = Array.isArray(payload.recent_transactions)
        ? payload.recent_transactions
        : [];

      setData(payload);
      setTransactions(rawTransactions);
    } catch (err: any) {
      console.error("Partner stats error:", err);

      setError(
        err?.message || err?.error || err?.toString?.() || "Errore sconosciuto"
      );

      setData(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>();

        if (profileError) {
          throw new Error(profileError.message || "Errore controllo profilo");
        }

        const role = String(profile?.role || "user").toLowerCase();

        if (role !== "partner") {
          router.push("/dashboard");
          return;
        }

        setPartnerUserId(user.id);
        await loadPartnerStats(user.id);
        setAuthChecked(true);
      } catch (err: any) {
        setError(err?.message || "Errore sconosciuto");
        setData(null);
        setTransactions([]);
        setAuthChecked(true);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  function canCancelTransaction(tx: Transaction) {
  const type = String(getTransactionType(tx)).toLowerCase();
  const status = String(tx?.raw?.status || "").toLowerCase();

  if (type !== "payment") return false;
  if (status && status !== "completed") return false;
  if (!tx.created_at) return false;

  const createdAt = new Date(tx.created_at);
  if (Number.isNaN(createdAt.getTime())) return false;

  const diffMinutes = (Date.now() - createdAt.getTime()) / 1000 / 60;

  return diffMinutes <= 5;
}

async function handleCancelTransaction(tx: Transaction) {
  const paymentId = getTransactionId(tx);

  if (!paymentId) {
    setCancelMessage("ID pagamento non trovato.");
    return;
  }

  try {
    setCancelLoadingId(String(paymentId));
    setCancelMessage("");
    setError("");

    const { response, data } = await safeJsonFetch(
      `${API_URL}/partner/transaction/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partner_user_id: partnerUserId,
          payment_transaction_id: paymentId,
        }),
      }
    );

    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || "Errore annullamento pagamento");
    }

    setCancelMessage("Pagamento annullato correttamente ✅");
    await loadPartnerStats(partnerUserId);
  } catch (err: any) {
    setCancelMessage(err?.message || "Errore durante annullamento");
  } finally {
    setCancelLoadingId(null);
  }
}

  const avgTicket = useMemo(() => {
    const totalTransactions = toNumberSafe(data?.total_transactions);
    const totalAmount = toNumberSafe(data?.total_amount);

    if (totalTransactions <= 0) return 0;
    return totalAmount / totalTransactions;
  }, [data]);

  const latestDate = transactions.length > 0 ? transactions[0]?.created_at : null;

  const paymentTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const type = String(getTransactionType(tx)).toLowerCase();
      return type === "payment";
    });
  }, [transactions]);

  const todayCustomers = useMemo(() => {
    const ids = new Set<string>();

    paymentTransactions.forEach((tx) => {
      if (isToday(tx?.created_at)) {
        const customerId = getCustomerId(tx);
        if (customerId) ids.add(String(customerId));
      }
    });

    return ids.size;
  }, [paymentTransactions]);

  const returnedCustomers = useMemo(() => {
    const counts = new Map<string, number>();

    paymentTransactions.forEach((tx) => {
      const customerId = getCustomerId(tx);
      if (!customerId) return;

      const key = String(customerId);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    let returned = 0;

    counts.forEach((count) => {
      if (count >= 2) returned += 1;
    });

    return returned;
  }, [paymentTransactions]);

  const returnRate = useMemo(() => {
    const totalCustomers = toNumberSafe(data?.total_customers);
    if (totalCustomers <= 0) return 0;
    return (returnedCustomers / totalCustomers) * 100;
  }, [data, returnedCustomers]);

  const latestRevenue = useMemo(() => {
    const latestPayment = paymentTransactions[0];
    return latestPayment ? getTransactionAmount(latestPayment) : 0;
  }, [paymentTransactions]);

  if (loading || !authChecked) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO PARTNER ANALYTICS</div>
            <p className={styles.eyebrow}>GUFO Partner Analytics</p>
            <h1 className={styles.title}>Partner dashboard</h1>
            <p className={styles.subtitle}>Controllo accesso partner...</p>
          </div>
        </section>

        <div className={styles.loadingBox}>Verifica autorizzazione...</div>
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
            <div className={styles.heroBadge}>GUFO PARTNER ANALYTICS</div>
            <p className={styles.eyebrow}>GUFO Partner Analytics</p>
            <h1 className={styles.title}>Partner dashboard</h1>
            <p className={styles.subtitle}>Si è verificato un problema.</p>
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
          <div className={styles.heroBadge}>GUFO PARTNER ANALYTICS</div>
          <p className={styles.eyebrow}>GUFO Partner Analytics</p>
          <h1 className={styles.title}>Controllo partner</h1>
          <p className={styles.subtitle}>
            Dashboard automatica del partner loggato con volumi, clienti attivi,
            GUFO distribuiti e attività recente.
          </p>
          <p className={styles.heroDescription}>
            Il partner viene collegato automaticamente all’utente autenticato.
          </p>
        </div>
      </section>

      <section className={styles.actionBar}>
        <div className={styles.actionCard}>
          <div className={styles.actionLeft}>
            <span className={styles.actionBadge}>Azioni rapide</span>
            <h3 className={styles.actionTitle}>Controllo operativo partner</h3>
            <p className={styles.actionSubtitle}>
              Registra pagamenti, scansiona clienti e gestisci cashback in tempo
              reale.
            </p>
          </div>

          <div className={styles.actionButtons}>
            <Link
              href="/partner-console"
              className={`${styles.actionBtn} ${styles.primaryAction} ${styles.actionLink}`}
            >
              💳 Registra pagamento
            </Link>

            <Link
              href="/partner-scan"
              className={`${styles.actionBtn} ${styles.secondaryAction} ${styles.actionLink}`}
            >
              📷 Scansiona cliente
            </Link>

<Link
  href="/partner-console"
  className={`${styles.actionBtn} ${styles.secondaryAction} ${styles.actionLink}`}
>
  🎟️ Scansiona voucher
</Link>

          <Link
  href="/partner-settings"
  className={`${styles.actionBtn} ${styles.secondaryAction} ${styles.actionLink}`}
>
  ⚙️ Impostazioni partner
</Link>
          </div>
        </div>
      </section>

      <section className={styles.operatorCard}>
        <div className={styles.operatorCardLeft}>
          <div className={styles.operatorTopRow}>
            <span className={styles.operatorChip}>Dati recenti</span>
            <span className={styles.operatorStatus}>Partner attivo</span>
          </div>

          <p className={styles.operatorLabel}>Merchant riconosciuto</p>
          <h2 className={styles.operatorValue}>{data?.partner_name || "--"}</h2>
          <p className={styles.operatorNote}>
            Il partner viene collegato automaticamente all’utente autenticato.
          </p>
        </div>

        <div className={styles.operatorCardRight}>
          <div className={styles.operatorMiniCard}>
            <span>Partner ID</span>
            <strong>{toNumberSafe(data?.partner_id)}</strong>
          </div>

          <div className={styles.operatorMiniCard}>
            <span>Cashback base</span>
            <strong>
              {toNumberSafe(data?.current_default_cashback_percent).toFixed(2)}%
            </strong>
          </div>

          <div className={styles.operatorMiniCard}>
            <span>Ultima attività</span>
            <strong>{latestDate ? formatDateTime(latestDate) : "-"}</strong>
          </div>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
          <p className={styles.metricLabel}>Pagamenti registrati</p>
          <h3 className={styles.metricValue}>
            {toNumberSafe(data?.total_transactions)}
          </h3>
          <span className={styles.metricHint}>Operazioni gestite dal partner</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Volume totale</p>
          <h3 className={styles.metricValue}>
            € {toNumberSafe(data?.total_amount).toFixed(2)}
          </h3>
          <span className={styles.metricHint}>Importo complessivo registrato</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>GUFO distribuiti</p>
          <h3 className={styles.metricValue}>
            {toNumberSafe(data?.total_gufo_distributed).toFixed(2)}
          </h3>
          <span className={styles.metricHint}>Reward accreditate ai clienti</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Clienti unici</p>
          <h3 className={styles.metricValue}>
            {toNumberSafe(data?.total_customers)}
          </h3>
          <span className={styles.metricHint}>Persone servite dal partner</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Scontrino medio</p>
          <h3 className={styles.metricValue}>€ {avgTicket.toFixed(2)}</h3>
          <span className={styles.metricHint}>Valore medio per pagamento</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Clienti tornati</p>
          <h3 className={styles.metricValue}>{returnedCustomers}</h3>
          <span className={styles.metricHint}>Clienti con almeno 2 pagamenti</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Tasso di ritorno</p>
          <h3 className={styles.metricValue}>{returnRate.toFixed(1)}%</h3>
          <span className={styles.metricHint}>Ritorno clienti / clienti unici</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Clienti oggi</p>
          <h3 className={styles.metricValue}>{todayCustomers}</h3>
          <span className={styles.metricHint}>Utenti serviti nella giornata</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Ultimo incasso</p>
          <h3 className={styles.metricValue}>€ {latestRevenue.toFixed(2)}</h3>
          <span className={styles.metricHint}>Ultima transazione payment</span>
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Recent activity</p>
              <h3>Ultime operazioni</h3>
            </div>
{cancelMessage && (
  <div className={styles.cancelMessage}>{cancelMessage}</div>
)}
            <span className={styles.panelBadge}>{transactions.length} record</span>
          </div>

          {transactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>Nessuna operazione trovata</div>
              <div className={styles.emptyText}>
                Le operazioni del partner appariranno qui appena disponibili.
              </div>
            </div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Operazione</th>
                      <th>Merchant</th>
                      <th>Tipo</th>
                      <th>Importo</th>
                      <th>GUFO</th>
                      <th>Data</th>
                      <th>Azione</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr key={tx.id || tx.transaction_id || tx.Transaction_id || index}>
                        <td>{getTransactionId(tx) || "-"}</td>

                        <td className={styles.partnerCell}>
                          {getTransactionMerchant(tx)}
                        </td>

                        <td>
                          <span
                            className={`${styles.badge} ${getTypeTone(
                              getTransactionType(tx),
                              styles
                            )}`}
                          >
                            {formatTransactionType(getTransactionType(tx))}
                          </span>
                        </td>

                        <td>€ {getTransactionAmount(tx).toFixed(2)}</td>
                        <td>{getTransactionGufo(tx).toFixed(2)}</td>
                        <td>{formatDateTime(tx.created_at)}</td>
                        <td>
  {canCancelTransaction(tx) ? (
    <button
      type="button"
      className={styles.cancelTxBtn}
      onClick={() => handleCancelTransaction(tx)}
      disabled={cancelLoadingId === String(getTransactionId(tx))}
    >
      {cancelLoadingId === String(getTransactionId(tx))
        ? "Annullamento..."
        : "Annulla"}
    </button>
  ) : (
    <span className={styles.cancelUnavailable}>-</span>
  )}
</td>
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
                          getTransactionType(tx),
                          styles
                        )}`}
                      >
                        {formatTransactionType(getTransactionType(tx))}
                      </span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>Operazione</span>
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
                      <span>Data</span>
                      <span>{formatDateTime(tx.created_at)}</span>
                      {canCancelTransaction(tx) && (
  <button
    type="button"
    className={styles.cancelTxBtn}
    onClick={() => handleCancelTransaction(tx)}
    disabled={cancelLoadingId === String(getTransactionId(tx))}
  >
    {cancelLoadingId === String(getTransactionId(tx))
      ? "Annullamento..."
      : "↩️ Annulla pagamento"}
  </button>
)}
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
            <h4>{data?.partner_name || "--"}</h4>
            <span>Merchant collegato al profilo loggato</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Cashback base</p>
            <h4>
              {toNumberSafe(data?.current_default_cashback_percent).toFixed(2)}%
            </h4>
            <span>Valore di riferimento del partner</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Clienti serviti</p>
            <h4>{toNumberSafe(data?.total_customers)}</h4>
            <span>Numero clienti unici coinvolti</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Clienti tornati</p>
            <h4>{returnedCustomers}</h4>
            <span>Clienti che hanno comprato almeno due volte</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Tasso di ritorno</p>
            <h4>{returnRate.toFixed(1)}%</h4>
            <span>Quanto il cashback aiuta a far tornare i clienti</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Utente partner</p>
            <h4>{partnerUserId ? "Connesso" : "Non connesso"}</h4>
            <span>Riconoscimento automatico via login</span>
          </div>
        </aside>
      </section>
    </div>
  );
}