"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./profile.module.css";

const supabase = createClient();

type Transaction = {
  transaction_id?: string;
  id?: string;
  tipo?: string;
  type?: string;
  merchant_name?: string;
  benefit?: string;
  merchant?: string;
  amount_euro?: number | string | null;
  amount?: number | string | null;
  importo?: number | string | null;
  gufo?: number | string | null;
  gufo_earned?: number | string | null;
  cashback?: number | string | null;
  created_at?: string | null;
  raw?: unknown;
};

type ProfileData = {
  name: string;
  email: string;
  balanceGufo: number;
  totalSpent: number;
  cashbackPercent: number;
  level: string;
  transactions: Transaction[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Bronze";

  const normalized = String(level).toLowerCase();

  if (normalized === "vip") return "VIP";
  if (normalized === "platino") return "Platino";
  if (normalized === "millionaire") return "Millionaire";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

function getTransactionMerchant(tx: any) {
  return (
    tx?.merchant_name ??
    tx?.benefit ??
    tx?.merchant ??
    tx?.raw?.merchant_name ??
    tx?.raw?.benefit ??
    tx?.raw?.merchant ??
    "Partner GUFO"
  );
}

function getTransactionType(tx: any) {
  return tx?.type ?? tx?.tipo ?? tx?.raw?.type ?? tx?.raw?.tipo ?? "cashback";
}

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  });
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

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "Utente GUFO",
    email: "",
    balanceGufo: 0,
    totalSpent: 0,
    cashbackPercent: 0,
    level: "Bronze",
    transactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
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
          `${API_URL}/profile/${user.id}`
        );

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || "Errore nel recupero profilo");
        }

        const profile = data?.profile ?? {};
        const wallet = data?.wallet ?? {};
        const stats = data?.stats ?? {};
        const rawTransactions: Transaction[] = Array.isArray(data?.transactions)
          ? data.transactions
          : [];

        const transactions = sortTransactions(
          rawTransactions.map((tx: any) => ({
            id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id,
            transaction_id: tx?.transaction_id ?? tx?.id,
            type: getTransactionType(tx),
            tipo: tx?.tipo ?? tx?.raw?.tipo,
            merchant_name: getTransactionMerchant(tx),
            benefit: tx?.benefit ?? tx?.raw?.benefit,
            merchant: tx?.merchant ?? tx?.raw?.merchant,
            amount_euro: getTransactionAmount(tx),
            amount: getTransactionAmount(tx),
            importo: tx?.importo ?? tx?.raw?.importo,
            gufo_earned: getTransactionGufo(tx),
            gufo: getTransactionGufo(tx),
            cashback: tx?.cashback ?? tx?.raw?.cashback,
            created_at: tx?.created_at ?? tx?.raw?.created_at,
            raw: tx?.raw ?? tx,
          }))
        );

        const totalSpent = toNumberSafe(
          stats?.season_spent ?? wallet?.season_spent ?? 0
        );

        const balanceGufo = toNumberSafe(
          stats?.balance_gufo ?? wallet?.balance_gufo ?? 0
        );

        const cashbackPercent = toNumberSafe(
          stats?.cashback_percent ?? wallet?.cashback_percent ?? 0
        );

        const level = formatLevel(
          String(stats?.level ?? wallet?.current_level ?? "bronze")
        );

        const name =
          profile?.full_name ??
          profile?.name ??
          profile?.username ??
          user.email?.split("@")[0] ??
          "Utente GUFO";

        const email = profile?.email ?? user.email ?? "";

        if (!isMounted) return;

        setProfileData({
          name,
          email,
          balanceGufo,
          totalSpent,
          cashbackPercent,
          level,
          transactions,
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Errore recupero profilo");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const recentTransactions = useMemo(() => {
    return profileData.transactions.slice(0, 5);
  }, [profileData.transactions]);

  const profileInitial = profileData.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <p className={styles.eyebrow}>GUFO Profile</p>
          <h1 className={styles.title}>Identità account</h1>
          <p className={styles.subtitle}>Caricamento dati account...</p>
        </section>

        <div className={styles.loadingBox}>Recupero profilo in corso...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <p className={styles.eyebrow}>GUFO Profile</p>
          <h1 className={styles.title}>Identità account</h1>
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
          <p className={styles.eyebrow}>GUFO Profile</p>
          <h1 className={styles.title}>Il tuo account</h1>
          <p className={styles.subtitle}>
            Dati profilo, stato membership e ultime attività collegate al tuo account.
          </p>
        </div>
      </section>

      <section className={styles.profileHeroCard}>
        <div className={styles.profileHeroLeft}>
          <div className={styles.avatarLarge}>{profileInitial}</div>

          <div>
            <p className={styles.profileLabel}>Profilo utente</p>
            <h2 className={styles.profileName}>{profileData.name}</h2>
            <p className={styles.profileEmail}>
              {profileData.email || "Email non disponibile"}
            </p>

            <div className={styles.profileTags}>
              <span className={styles.profileTag}>{profileData.level}</span>
              <span className={styles.profileTag}>
                {profileData.transactions.length} movimenti
              </span>
            </div>
          </div>
        </div>

        <div className={styles.profileHeroRight}>
          <div className={styles.miniInfoCard}>
            <span>Saldo GUFO</span>
            <strong>{profileData.balanceGufo.toFixed(2)}</strong>
          </div>

          <div className={styles.miniInfoCard}>
            <span>Spesa stagione</span>
            <strong>€ {profileData.totalSpent.toFixed(2)}</strong>
          </div>

          <div className={styles.miniInfoCard}>
            <span>Cashback attuale</span>
            <strong>
              {profileData.cashbackPercent > 0
                ? `${profileData.cashbackPercent}%`
                : "Variabile"}
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Livello attuale</p>
          <h3 className={styles.metricValue}>{profileData.level}</h3>
          <span className={styles.metricHint}>Status membership corrente</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Saldo GUFO</p>
          <h3 className={styles.metricValue}>
            {profileData.balanceGufo.toFixed(2)}
          </h3>
          <span className={styles.metricHint}>Disponibilità wallet attuale</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Spesa stagione</p>
          <h3 className={styles.metricValue}>
            € {profileData.totalSpent.toFixed(2)}
          </h3>
          <span className={styles.metricHint}>Totale registrato nel periodo</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Cashback</p>
          <h3 className={styles.metricValue}>
            {profileData.cashbackPercent > 0
              ? `${profileData.cashbackPercent}%`
              : "Var."}
          </h3>
          <span className={styles.metricHint}>Valore reward corrente</span>
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Recent activity</p>
              <h3>Transazioni recenti</h3>
            </div>
            <span className={styles.panelBadge}>{recentTransactions.length} recenti</span>
          </div>

          {recentTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>Nessuna transazione trovata</div>
              <div className={styles.emptyText}>
                Le tue attività recenti compariranno qui appena inizierai a usare GUFO.
              </div>
            </div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Merchant</th>
                      <th>Importo</th>
                      <th>GUFO</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction, index) => (
                      <tr
                        key={transaction.transaction_id ?? transaction.id ?? index}
                      >
                        <td>
                          <span
                            className={`${styles.badge} ${getTypeTone(
                              getTransactionType(transaction)
                            )}`}
                          >
                            {getTransactionType(transaction)}
                          </span>
                        </td>
                        <td className={styles.partnerCell}>
                          {getTransactionMerchant(transaction)}
                        </td>
                        <td>€ {getTransactionAmount(transaction).toFixed(2)}</td>
                        <td>{getTransactionGufo(transaction).toFixed(2)}</td>
                        <td>{formatDate(transaction.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.mobileList}>
                {recentTransactions.map((transaction, index) => (
                  <div
                    key={transaction.transaction_id ?? transaction.id ?? index}
                    className={styles.mobileTxCard}
                  >
                    <div className={styles.mobileTxTop}>
                      <strong>{getTransactionMerchant(transaction)}</strong>
                      <span
                        className={`${styles.badge} ${getTypeTone(
                          getTransactionType(transaction)
                        )}`}
                      >
                        {getTransactionType(transaction)}
                      </span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>Importo</span>
                      <span>€ {getTransactionAmount(transaction).toFixed(2)}</span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>GUFO</span>
                      <span>{getTransactionGufo(transaction).toFixed(2)}</span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>Data</span>
                      <span>{formatDate(transaction.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className={styles.sideColumn}>
          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Nome account</p>
            <h4>{profileData.name}</h4>
            <span>Identità principale del profilo</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Livello</p>
            <h4>{profileData.level}</h4>
            <span>Stato membership corrente</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Movimenti registrati</p>
            <h4>{profileData.transactions.length}</h4>
            <span>Attività disponibili nello storico</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Cashback attuale</p>
            <h4>
              {profileData.cashbackPercent > 0
                ? `${profileData.cashbackPercent}%`
                : "Variabile"}
            </h4>
            <span>Valore reward collegato all’account</span>
          </div>
        </aside>
      </section>
    </div>
  );
}