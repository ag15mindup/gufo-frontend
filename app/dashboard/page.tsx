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
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatLevel(level?: string | null): string {
  if (!level) return "Bronze";
  const normalized = String(level).trim().toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getMonthLabel(index: number): string {
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

function getTransactionAmount(tx: Transaction): number {
  return toNumberSafe(
    tx?.amount_euro ??
      tx?.amount ??
      tx?.importo ??
      tx?.raw?.amount_euro ??
      tx?.raw?.amount ??
      tx?.raw?.importo
  );
}

function getTransactionGufo(tx: Transaction): number {
  return toNumberSafe(
    tx?.gufo_earned ??
      tx?.gufo ??
      tx?.raw?.gufo_earned ??
      tx?.raw?.gufo
  );
}

function getTransactionMerchant(tx: Transaction): string {
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

function getTransactionType(tx: Transaction): string {
  return (
    tx?.type ??
    tx?.tipo ??
    tx?.raw?.type ??
    tx?.raw?.tipo ??
    "cashback"
  );
}

function formatTransactionType(type?: string): string {
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
    case "convert":
      return "Conversione";
    case "giftcard":
      return "Gift Card";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function formatCurrency(value: number): string {
  return `€ ${value.toFixed(2)}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || `Errore richiesta: ${response.status}`);
  }

  return payload as T;
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
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw new Error(authError.message || "Errore recupero utente");
        }

        if (!user) {
          throw new Error("Utente non autenticato");
        }

        const [dashboard, profilePayload] = await Promise.all([
          fetchJson<DashboardApiResponse>(`${API_URL}/dashboard/${user.id}`),
          fetchJson<ProfileApiResponse>(`${API_URL}/profile/${user.id}`),
        ]);

        const wallet = dashboard?.wallet ?? {};
        const stats = dashboard?.stats ?? {};
        const profile = profilePayload?.profile ?? {};
        const rawTransactions = Array.isArray(dashboard?.transactions)
          ? dashboard.transactions
          : [];

        const monthlySource = Array.isArray(stats?.monthlyExpenses)
          ? stats.monthlyExpenses
          : Array.isArray(stats?.monthly_expenses)
          ? stats.monthly_expenses
          : Array(12).fill(0);

        const normalizedMonthlyExpenses = Array.from({ length: 12 }, (_, index) =>
          toNumberSafe(monthlySource[index] ?? 0)
        );

        const normalizedTransactions: Transaction[] = rawTransactions.map((tx) => ({
          id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id ?? undefined,
          type: getTransactionType(tx),
          merchant_name: getTransactionMerchant(tx),
          amount_euro: getTransactionAmount(tx),
          gufo_earned: getTransactionGufo(tx),
          created_at: tx?.created_at ?? tx?.raw?.created_at ?? null,
          raw: tx?.raw ?? tx,
        }));

        const profileName =
          profile?.full_name?.trim() ||
          profile?.name?.trim() ||
          profile?.username?.trim() ||
          dashboard?.profileName?.trim() ||
          user.email?.split("@")[0] ||
          "Utente GUFO";

        const profileEmail =
          profile?.email?.trim() ||
          dashboard?.profileEmail?.trim() ||
          user.email ||
          "";

        if (!active) return;

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
          level: formatLevel(wallet?.current_level ?? stats?.level ?? "Bronze"),
          transactions: normalizedTransactions,
          monthlyExpenses: normalizedMonthlyExpenses,
          profileName,
          profileEmail,
          profileInitial: profileName.charAt(0).toUpperCase() || "U",
        });
      } catch (err: any) {
        if (!active) return;
        setError(err?.message || "Errore sconosciuto");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const recentTransactions = useMemo(() => {
    return dashboardData.transactions.slice(0, 8);
  }, [dashboardData.transactions]);

  const maxMonthlyValue = useMemo(() => {
    return Math.max(...dashboardData.monthlyExpenses, 1);
  }, [dashboardData.monthlyExpenses]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <div className={styles.orbC} />

        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <div className={styles.kicker}>GUFO CONTROL PANEL</div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Caricamento ecosistema premium...</p>
          </div>
        </section>

        <div className={styles.statusBox}>Connessione ai dati in corso...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.orbA} />
        <div className={styles.orbB} />
        <div className={styles.orbC} />

        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <div className={styles.kicker}>GUFO CONTROL PANEL</div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Errore di caricamento</p>
          </div>
        </section>

        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.orbA} />
      <div className={styles.orbB} />
      <div className={styles.orbC} />
      <div className={styles.scanLine} />

      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.kicker}>GUFO PREMIUM OS</div>

          <p className={styles.welcome}>Bentornato 👋</p>
          <h1 className={styles.title}>{dashboardData.profileName}</h1>

          {dashboardData.profileEmail ? (
            <p className={styles.email}>{dashboardData.profileEmail}</p>
          ) : null}

          <p className={styles.subtitle}>
            Una dashboard più cinematica, futuristica e pronta per stupire in demo.
          </p>

          <div className={styles.heroActions}>
            <Link href="/customer-code" className={styles.primaryBtn}>
              Apri QR Code
            </Link>
            <Link href="/wallet" className={styles.secondaryBtn}>
              Apri Wallet
            </Link>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.visualRing} />
          <div className={styles.visualRing2} />
          <div className={styles.visualCore}>
            <div className={styles.visualDisc} />
            <div className={styles.visualOwl}>🦉</div>
          </div>

          <div className={styles.visualInfo}>
            <span className={styles.visualLabel}>Saldo GUFO</span>
            <strong className={styles.visualValue}>
              {dashboardData.balanceGufo.toFixed(2)}
            </strong>
            <span className={styles.visualSub}>Livello {dashboardData.level}</span>
          </div>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCyan}`}>
          <span className={styles.metricTopLabel}>Transazioni</span>
          <strong className={styles.metricValue}>
            {dashboardData.totalTransactions}
          </strong>
          <span className={styles.metricBottom}>Attività registrata</span>
        </div>

        <div className={`${styles.metricCard} ${styles.metricViolet}`}>
          <span className={styles.metricTopLabel}>Livello attuale</span>
          <strong className={styles.metricValue}>{dashboardData.level}</strong>
          <span className={styles.metricBottom}>Progressione stagionale</span>
        </div>

        <div className={`${styles.metricCard} ${styles.metricOrange}`}>
          <span className={styles.metricTopLabel}>Spesa stagione</span>
          <strong className={styles.metricValue}>
            {formatCurrency(dashboardData.totalSpent)}
          </strong>
          <span className={styles.metricBottom}>Volume spesa</span>
        </div>

        <div className={`${styles.metricCard} ${styles.metricPink}`}>
          <span className={styles.metricTopLabel}>GUFO ottenuti</span>
          <strong className={styles.metricValue}>
            {dashboardData.totalGufoEarned.toFixed(2)}
          </strong>
          <span className={styles.metricBottom}>Reward accumulati</span>
        </div>
      </section>

      <div className={styles.commandGrid}>
        <section className={`${styles.panel} ${styles.analyticsPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Radar spese</h3>
              <p>Ultimi 12 mesi</p>
            </div>
            <div className={styles.panelChip}>Analytics</div>
          </div>

          <div className={styles.chartScroll}>
            <div className={styles.chartWrap}>
              {dashboardData.monthlyExpenses.map((value, index) => {
                const safeHeight = Math.max((value / maxMonthlyValue) * 180, 10);

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
          </div>
        </section>

        <aside className={`${styles.panel} ${styles.identityPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Identità account</h3>
              <p>Layer personale</p>
            </div>
            <div className={styles.panelChip}>Profile</div>
          </div>

          <div className={styles.identityCore}>
            <div className={styles.identityAvatar}>{dashboardData.profileInitial}</div>
            <div className={styles.identityText}>
              <strong>{dashboardData.profileName}</strong>
              <span>{dashboardData.profileEmail || "Profilo GUFO attivo"}</span>
            </div>
          </div>

          <div className={styles.identityStats}>
            <div className={styles.identityBox}>
              <span>Saldo</span>
              <strong>{dashboardData.balanceGufo.toFixed(2)} GUFO</strong>
            </div>
            <div className={styles.identityBox}>
              <span>Livello</span>
              <strong>{dashboardData.level}</strong>
            </div>
            <div className={styles.identityBox}>
              <span>Stagione</span>
              <strong>Attiva</strong>
            </div>
            <div className={styles.identityBox}>
              <span>Reward</span>
              <strong>{dashboardData.totalGufoEarned.toFixed(2)}</strong>
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.missionWrap}>
        <MissionCard transactions={dashboardData.transactions} />
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Transazioni recenti</h3>
            <p>Ultime 8 operazioni</p>
          </div>
          <div className={styles.panelChip}>Live</div>
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
                    Nessuna transazione disponibile
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx, index) => (
                  <tr key={tx.id || `${getTransactionMerchant(tx)}-${index}`}>
                    <td className={styles.partnerCell}>{getTransactionMerchant(tx)}</td>
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
                    <td>{formatCurrency(getTransactionAmount(tx))}</td>
                    <td>{getTransactionGufo(tx).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.mobileTransactions}>
          {recentTransactions.length === 0 ? (
            <div className={styles.mobileEmpty}>Nessuna transazione</div>
          ) : (
            recentTransactions.map((tx, index) => (
              <div
                key={tx.id || `${getTransactionMerchant(tx)}-mobile-${index}`}
                className={styles.mobileTransactionCard}
              >
                <div className={styles.mobileTransactionTop}>
                  <strong className={styles.mobileMerchant}>
                    {getTransactionMerchant(tx)}
                  </strong>
                  <span className={styles.badge}>
                    {formatTransactionType(getTransactionType(tx))}
                  </span>
                </div>

                <div className={styles.mobileTransactionMeta}>
                  <div className={styles.mobileMetaItem}>
                    <span>Data</span>
                    <strong>
                      {tx.created_at
                        ? new Date(tx.created_at).toLocaleDateString("it-IT")
                        : "-"}
                    </strong>
                  </div>

                  <div className={styles.mobileMetaItem}>
                    <span>Importo</span>
                    <strong>{formatCurrency(getTransactionAmount(tx))}</strong>
                  </div>

                  <div className={styles.mobileMetaItem}>
                    <span>GUFO</span>
                    <strong>{getTransactionGufo(tx).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}