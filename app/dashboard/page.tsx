"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./dashboard.module.css";
import { createClient } from "@/lib/supabase/client";
import MissionCard from "@/app/components/Missioncard";

const supabase = createClient();

type Transaction = {
  id?: string;
  transaction_id?: string;
  type?: string;
  tipo?: string;
  merchant_name?: string;
  benefit?: string;
  merchant?: string;
  amount_euro?: number | string | null;
  amount?: number | string | null;
  importo?: number | string | null;
  gufo_earned?: number | string | null;
  gufo?: number | string | null;
  created_at?: string | null;
  raw?: any;
};

type DashboardApiResponse = {
  wallet?: {
    balance_gufo?: number | string | null;
    cashback_percent?: number | string | null;
    current_level?: string | null;
    season_spent?: number | string | null;
  };
  stats?: {
    balance_gufo?: number | string | null;
    total_transactions?: number | string | null;
    season_spent?: number | string | null;
    gufo_earned?: number | string | null;
    level?: string | null;
    cashback_percent?: number | string | null;
    monthlyExpenses?: Array<number | string | null>;
    monthly_expenses?: Array<number | string | null>;
  };
  transactions?: Transaction[];
  profileName?: string;
  profileEmail?: string;
};

type ProfileApiResponse = {
  profile?: {
    full_name?: string | null;
    name?: string | null;
    username?: string | null;
    email?: string | null;
  };
};

type DashboardData = {
  balanceGufo: number;
  totalTransactions: number;
  totalSpent: number;
  totalGufoEarned: number;
  level: string;
  transactions: Transaction[];
  monthlyExpenses: number[];
  profileName: string;
  profileEmail: string;
  profileInitial: string;
  authUserId: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level?: string) {
  if (!level) return "Bronze";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getMonthLabel(index: number) {
  const months = [
    "Gen",
    "Feb",
    "Mar",
    "Apr",
    "Mag",
    "Giu",
    "Lug",
    "Ago",
    "Set",
    "Ott",
    "Nov",
    "Dic",
  ];
  return months[index] || "";
}

function getTransactionAmount(tx: Transaction) {
  return toNumberSafe(
    tx?.amount_euro ??
      tx?.amount ??
      tx?.importo ??
      tx?.raw?.amount_euro ??
      tx?.raw?.amount ??
      tx?.raw?.importo
  );
}

function getTransactionGufo(tx: Transaction) {
  return toNumberSafe(
    tx?.gufo_earned ??
      tx?.gufo ??
      tx?.raw?.gufo_earned ??
      tx?.raw?.gufo
  );
}

function getTransactionMerchant(tx: Transaction) {
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

function getTransactionType(tx: Transaction) {
  return tx?.type ?? tx?.tipo ?? tx?.raw?.type ?? tx?.raw?.tipo ?? "cashback";
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
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Errore richiesta: ${response.status}`);
  }

  return data as T;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balanceGufo: 0,
    totalTransactions: 0,
    totalSpent: 0,
    totalGufoEarned: 0,
    level: "Bronze",
    transactions: [],
    monthlyExpenses: Array(12).fill(0),
    profileName: "Utente GUFO",
    profileEmail: "",
    profileInitial: "U",
    authUserId: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
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

        const [dashboard, profilePayload] = await Promise.all([
          fetchJson<DashboardApiResponse>(`${API_URL}/dashboard/${user.id}`),
          fetchJson<ProfileApiResponse>(`${API_URL}/profile/${user.id}`),
        ]);

        const profile = profilePayload?.profile ?? {};
        const wallet = dashboard?.wallet ?? {};
        const stats = dashboard?.stats ?? {};
        const rawTransactions = Array.isArray(dashboard?.transactions)
          ? dashboard.transactions
          : [];

        const monthlyExpensesRaw = Array.isArray(stats?.monthlyExpenses)
          ? stats.monthlyExpenses
          : Array.isArray(stats?.monthly_expenses)
          ? stats.monthly_expenses
          : Array(12).fill(0);

        const monthlyExpenses = monthlyExpensesRaw.map((value) =>
          toNumberSafe(value)
        );

        const normalizedTransactions: Transaction[] = rawTransactions.map(
          (tx: Transaction) => ({
            id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id,
            type: getTransactionType(tx),
            merchant_name: getTransactionMerchant(tx),
            amount_euro: getTransactionAmount(tx),
            gufo_earned: getTransactionGufo(tx),
            created_at: tx?.created_at ?? tx?.raw?.created_at ?? null,
            raw: tx?.raw ?? tx,
          })
        );

        const profileName =
          profile?.full_name ??
          profile?.name ??
          profile?.username ??
          dashboard?.profileName ??
          user.email?.split("@")[0] ??
          "Utente GUFO";

        const profileEmail =
          profile?.email ?? dashboard?.profileEmail ?? user.email ?? "";

        const profileInitial =
          profileName.trim().charAt(0).toUpperCase() || "U";

        if (!isMounted) return;

        setDashboardData({
          balanceGufo: toNumberSafe(
            wallet?.balance_gufo ?? stats?.balance_gufo ?? 0
          ),
          totalTransactions: toNumberSafe(
            stats?.total_transactions ?? normalizedTransactions.length
          ),
          totalSpent: toNumberSafe(
            wallet?.season_spent ?? stats?.season_spent ?? 0
          ),
          totalGufoEarned: toNumberSafe(
            stats?.gufo_earned ?? wallet?.balance_gufo ?? 0
          ),
          level: String(wallet?.current_level ?? stats?.level ?? "bronze"),
          transactions: normalizedTransactions,
          monthlyExpenses:
            monthlyExpenses.length === 12
              ? monthlyExpenses
              : Array(12).fill(0),
          profileName,
          profileEmail,
          profileInitial,
          authUserId: user.id,
        });
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Errore sconosciuto");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const recentTransactions = useMemo(() => {
    return dashboardData.transactions.slice(0, 8);
  }, [dashboardData.transactions]);

  const maxMonthlyValue = Math.max(...dashboardData.monthlyExpenses, 1);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <div className={styles.hero}>
          <div>
            <p className={styles.welcome}>Bentornato 👋</p>
            <h1 className={styles.userName}>Dashboard</h1>
            <p className={styles.email}>Caricamento dati account...</p>
          </div>
        </div>

        <div className={styles.loadingBox}>Connessione ai dati in corso...</div>
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
            <p className={styles.welcome}>Bentornato 👋</p>
            <h1 className={styles.userName}>Dashboard</h1>
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
  <div className={styles.heroContent}>
    <div className={styles.heroBadge}>GUFO PREMIUM DASHBOARD</div>
    <p className={styles.welcome}>Bentornato 👋</p>
    <h1 className={styles.userName}>{dashboardData.profileName}</h1>

    {dashboardData.profileEmail ? (
      <p className={styles.email}>{dashboardData.profileEmail}</p>
    ) : null}

    <p className={styles.heroDescription}>
      Monitora saldo, transazioni, missioni e andamento delle tue spese in un’unica esperienza premium.
    </p>
  </div>

  <div className={styles.balanceCard}>
    <div className={styles.balanceGlow} />
    <span className={styles.balanceLabel}>Saldo disponibile</span>
    <h2 className={styles.balanceValue}>
      {dashboardData.balanceGufo.toFixed(2)} GUFO
    </h2>

    <div className={styles.balanceMetaRow}>
      <div className={styles.balanceMetaBox}>
        <span>Livello</span>
        <strong>{formatLevel(dashboardData.level)}</strong>
      </div>
      <div className={styles.balanceMetaBox}>
        <span>Stagione</span>
        <strong>Attiva</strong>
      </div>
    </div>

    <div className={styles.balanceButtons}>
      <Link href="/customer-code" className={styles.primaryBtn}>
        Il mio codice
      </Link>
      <Link href="/wallet" className={styles.secondaryBtn}>
        Wallet
      </Link>
    </div>
  </div>
</div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cyan}`}>
          <div>
            <div className={styles.statValue}>
              {dashboardData.totalTransactions}
            </div>
            <div className={styles.statLabel}>Transazioni</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>↗</div>
            <div className={styles.statHint}>Attive</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.purple}`}>
          <div>
            <div className={styles.statValue}>
              {formatLevel(dashboardData.level)}
            </div>
            <div className={styles.statLabel}>Livello</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>⬢</div>
            <div className={styles.statHint}>Stagionale</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.orange}`}>
          <div>
            <div className={styles.statValue}>Variabile</div>
            <div className={styles.statLabel}>Cashback</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>%</div>
            <div className={styles.statHint}>Deciso dai partner</div>
          </div>
        </div>
      </div>

      <MissionCard transactions={dashboardData.transactions} />

      <section className={styles.panel} style={{ marginTop: "24px" }}>
        <div className={styles.panelHeader}>
          <h3>Spese mensili</h3>
          <span>Ultimi 12 mesi</span>
        </div>

        <div className={styles.chartWrap}>
  {dashboardData.monthlyExpenses.map((value, index) => {
    const safeHeight = Math.max((value / maxMonthlyValue) * 160, 10);

    return (
      <div
        key={`${getMonthLabel(index)}-${index}`}
        className={styles.chartItem}
      >
        <span className={styles.chartValue}>€ {value.toFixed(0)}</span>

        <div className={styles.chartBarShell}>
          <div
            className={styles.chartBar}
            style={{ height: `${safeHeight}px` }}
          />
        </div>

        <span className={styles.chartLabel}>{getMonthLabel(index)}</span>
      </div>
    );
  })}
</div>
      </section>

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Transazioni recenti</h3>
            <span>Ultime</span>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Importo</th>
                  <th>GUFO</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyRow}>
                      Nessuna transazione
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx, index) => (
                    <tr key={tx.id || `${getTransactionMerchant(tx)}-${index}`}>
                      <td className={styles.partnerCell}>
                        {getTransactionMerchant(tx)}
                      </td>
                      <td>
                        {tx.created_at
                          ? new Date(tx.created_at).toLocaleDateString("it-IT")
                          : "-"}
                      </td>
                      <td>
                        <span className={styles.badge}>
                          {formatTransactionType(getTransactionType(tx))}
                        </span>
                      </td>
                      <td>€ {getTransactionAmount(tx).toFixed(2)}</td>
                      <td>{getTransactionGufo(tx).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Riepilogo</h3>
            <span>GUFO</span>
          </div>

          <div className={styles.topList}>
            <div className={styles.topItem}>
              <div className={styles.avatar}>{dashboardData.profileInitial}</div>
              <div>
                <strong>{dashboardData.profileName}</strong>
                <p>Profilo attivo</p>
              </div>
              <span>{formatLevel(dashboardData.level)}</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>€</div>
              <div>
                <strong>€ {dashboardData.totalSpent.toFixed(2)}</strong>
                <p>Spesa stagione</p>
              </div>
              <span>spesa</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>G</div>
              <div>
                <strong>{dashboardData.totalGufoEarned.toFixed(2)}</strong>
                <p>GUFO guadagnati</p>
              </div>
              <span>reward</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}