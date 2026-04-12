"use client";

import { useEffect, useMemo, useState } from "react";
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
  cashback_percent?: number | string | null;
  created_at?: string | null;
  raw?: unknown;
};

type ProfileResponse = {
  success?: boolean;
  error?: string;
  profile?: {
    full_name?: string | null;
    name?: string | null;
    username?: string | null;
    email?: string | null;
  };
  wallet?: {
    balance_gufo?: number | string | null;
    season_spent?: number | string | null;
    cashback_percent?: number | string | null;
    current_level?: string | null;
  };
  stats?: {
    balance_gufo?: number | string | null;
    season_spent?: number | string | null;
    cashback_percent?: number | string | null;
    level?: string | null;
  };
  transactions?: Transaction[];
  data?: {
    profile?: {
      full_name?: string | null;
      name?: string | null;
      username?: string | null;
      email?: string | null;
    };
    wallet?: {
      balance_gufo?: number | string | null;
      season_spent?: number | string | null;
      cashback_percent?: number | string | null;
      current_level?: string | null;
    };
    stats?: {
      balance_gufo?: number | string | null;
      season_spent?: number | string | null;
      cashback_percent?: number | string | null;
      level?: string | null;
    };
    transactions?: Transaction[];
  };
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

function formatTransactionType(type?: string) {
  const value = String(type || "cashback").toLowerCase();

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
    case "convert":
      return "Conversione";
    case "giftcard":
      return "Gift Card";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
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
  if (normalized.includes("buy") || normalized.includes("acquisto"))
    return styles.cyanBadge;
  if (normalized.includes("convert")) return styles.orangeBadge;
  if (normalized.includes("gift")) return styles.purpleBadge;

  return "";
}

function normalizeProfilePayload(payload: ProfileResponse) {
  const root = payload?.data && typeof payload.data === "object" ? payload.data : payload;

  return {
    profile: root?.profile ?? {},
    wallet: root?.wallet ?? {},
    stats: root?.stats ?? {},
    transactions: Array.isArray(root?.transactions) ? root.transactions : [],
  };
}

async function fetchJsonWithAuth<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || `Errore richiesta: ${response.status}`);
  }

  return payload as T;
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

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message || "Errore recupero sessione");
        }

        const token = session?.access_token;

        if (!token) {
          throw new Error("Token non disponibile");
        }

        const payload = await fetchJsonWithAuth<ProfileResponse>(
          `${API_URL}/profile`,
          token
        );

        const { profile, wallet, stats, transactions: rawTransactions } =
          normalizeProfilePayload(payload);

        const transactions = sortTransactions(
          rawTransactions.map((tx: any) => ({
            id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id,
            transaction_id:
              tx?.transaction_id ?? tx?.id ?? tx?.raw?.transaction_id,
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
            cashback:
              tx?.cashback ??
              tx?.cashback_percent ??
              tx?.raw?.cashback ??
              tx?.raw?.cashback_percent,
            cashback_percent:
              tx?.cashback_percent ??
              tx?.cashback ??
              tx?.raw?.cashback_percent ??
              tx?.raw?.cashback,
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
          profile?.full_name?.trim() ??
          profile?.name?.trim() ??
          profile?.username?.trim() ??
          user.email?.split("@")[0] ??
          "Utente GUFO";

        const email = profile?.email?.trim() ?? user.email ?? "";

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
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO PREMIUM PROFILE</div>
            <p className={styles.eyebrow}>GUFO Profile</p>
            <h1 className={styles.title}>Identità account</h1>
            <p className={styles.subtitle}>Caricamento dati account...</p>
          </div>
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
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO PREMIUM PROFILE</div>
            <p className={styles.eyebrow}>GUFO Profile</p>
            <h1 className={styles.title}>Identità account</h1>
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
          <div className={styles.heroBadge}>GUFO PREMIUM PROFILE</div>
          <p className={styles.eyebrow}>GUFO Profile</p>
          <h1 className={styles.title}>Il tuo account</h1>
          <p className={styles.subtitle}>
            Dati profilo, stato membership e ultime attività collegate al tuo
            account.
          </p>
          <p className={styles.heroDescription}>
            Un’unica vista per controllare identità, wallet, livello e attività
            recenti nell’ecosistema GUFO.
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
        <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
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
            <span className={styles.panelBadge}>
              {recentTransactions.length} recenti
            </span>
          </div>

          {recentTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>Nessuna transazione trovata</div>
              <div className={styles.emptyText}>
                Le tue attività recenti compariranno qui appena inizierai a usare
                GUFO.
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
                            {formatTransactionType(getTransactionType(transaction))}
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
                        {formatTransactionType(getTransactionType(transaction))}
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