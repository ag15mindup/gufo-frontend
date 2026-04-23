"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./dashboard.module.css";
import { createClient } from "@/lib/supabase/client";
import DashboardMissions from "@/app/components/DashboardMissions";

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
    balance_eur?: number | string | null;
    cashback_percent?: number | string | null;
    current_level?: string | null;
    season_spent?: number | string | null;
    total_spent?: number | string | null;
    total_gufo_earned?: number | string | null;
    membership_id?: number | string | null;
  };
  stats?: {
    balance_gufo?: number | string | null;
    balance_eur?: number | string | null;
    total_transactions?: number | string | null;
    season_spent?: number | string | null;
    total_spent?: number | string | null;
    gufo_earned?: number | string | null;
    level?: string | null;
    cashback_percent?: number | string | null;
    monthly_expenses?: number[];
    membership_id?: number | string | null;
  };
  transactions?: Transaction[];
  profile?: {
    full_name?: string | null;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    customer_code?: string | null;
  };
  profileName?: string;
  profileEmail?: string;
};

type ProfileApiResponse = {
  profile?: {
    full_name?: string | null;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    customer_code?: string | null;
  };
};

type DashboardData = {
  balanceGufo: number;
  balanceEur: number;
  totalTransactions: number;
  seasonSpent: number;
  totalSpent: number;
  totalGufoEarned: number;
  level: string;
  membershipId: number;
  transactions: Transaction[];
  profileName: string;
  profileEmail: string;
  profileInitial: string;
  customerCode: string;
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
    case "mission_reward":
      return "Reward missione";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function formatCurrency(value: number): string {
  return `€ ${value.toFixed(2)}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildInviteLink(customerCode: string, name: string): string {
  const base = customerCode?.trim();
  if (base) return `https://invita.gufo.app/${base.toLowerCase()}`;

  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);

  return `https://invita.gufo.app/${slug || "utente"}`;
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

function getSignedAmountLabel(tx: Transaction): string {
  const type = String(getTransactionType(tx)).toLowerCase();
  const amount = getTransactionAmount(tx);

  if (type === "payment" || type === "giftcard" || type === "convert") {
    return `€ ${amount.toFixed(2)}`;
  }

  return `€ ${amount.toFixed(2)}`;
}

function getSignedGufoLabel(tx: Transaction): string {
  const type = String(getTransactionType(tx)).toLowerCase();
  const gufo = getTransactionGufo(tx);

  if (type === "cashback" || type === "bonus" || type === "mission_reward") {
    return `+${gufo.toFixed(2)}`;
  }

  return gufo.toFixed(2);
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    balanceGufo: 0,
    balanceEur: 0,
    totalTransactions: 0,
    seasonSpent: 0,
    totalSpent: 0,
    totalGufoEarned: 0,
    level: "Bronze",
    membershipId: 1,
    transactions: [],
    profileName: "Utente GUFO",
    profileEmail: "",
    profileInitial: "U",
    customerCode: "",
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

        const [dashboard, profilePayload] = await Promise.all([
          fetchJsonWithAuth<DashboardApiResponse>(`${API_URL}/dashboard`, token),
          fetchJsonWithAuth<ProfileApiResponse>(`${API_URL}/profile`, token),
        ]);

        const wallet = dashboard?.wallet ?? {};
        const stats = dashboard?.stats ?? {};
        const dashboardProfile = dashboard?.profile ?? {};
        const profile = profilePayload?.profile ?? {};
        const rawTransactions = Array.isArray(dashboard?.transactions)
          ? dashboard.transactions
          : [];

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
          dashboardProfile?.full_name?.trim() ||
          dashboardProfile?.name?.trim() ||
          dashboardProfile?.username?.trim() ||
          dashboard?.profileName?.trim() ||
          user.email?.split("@")[0] ||
          "Utente GUFO";

        const profileEmail =
          profile?.email?.trim() ||
          dashboardProfile?.email?.trim() ||
          dashboard?.profileEmail?.trim() ||
          user.email ||
          "";

        const customerCode =
          profile?.customer_code?.trim() ||
          dashboardProfile?.customer_code?.trim() ||
          "";

        if (!active) return;

        setDashboardData({
          balanceGufo: toNumberSafe(wallet?.balance_gufo ?? stats?.balance_gufo ?? 0),
          balanceEur: toNumberSafe(wallet?.balance_eur ?? stats?.balance_eur ?? 0),
          totalTransactions: toNumberSafe(
            stats?.total_transactions ?? normalizedTransactions.length
          ),
          seasonSpent: toNumberSafe(
            wallet?.season_spent ?? stats?.season_spent ?? 0
          ),
          totalSpent: toNumberSafe(
            wallet?.total_spent ?? stats?.total_spent ?? 0
          ),
          totalGufoEarned: toNumberSafe(
            wallet?.total_gufo_earned ?? stats?.gufo_earned ?? 0
          ),
          level: formatLevel(wallet?.current_level ?? stats?.level ?? "Bronze"),
          membershipId: toNumberSafe(
            wallet?.membership_id ?? stats?.membership_id ?? 1
          ),
          transactions: normalizedTransactions,
          profileName,
          profileEmail,
          profileInitial: profileName.charAt(0).toUpperCase() || "U",
          customerCode,
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
    return dashboardData.transactions.slice(0, 6);
  }, [dashboardData.transactions]);

  const inviteLink = useMemo(() => {
    return buildInviteLink(dashboardData.customerCode, dashboardData.profileName);
  }, [dashboardData.customerCode, dashboardData.profileName]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgNoise} />
        <div className={styles.bgGlowA} />
        <div className={styles.bgGlowB} />
        <div className={styles.bgGlowC} />
        <div className={styles.bgGlowD} />
        <div className={styles.shell}>
          <div className={styles.loadingBox}>Caricamento dashboard GUFO...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.bgNoise} />
        <div className={styles.bgGlowA} />
        <div className={styles.bgGlowB} />
        <div className={styles.bgGlowC} />
        <div className={styles.bgGlowD} />
        <div className={styles.shell}>
          <div className={styles.errorBox}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgOverlay} />
      <div className={styles.bgNoise} />
      <div className={styles.bgGlowA} />
      <div className={styles.bgGlowB} />
      <div className={styles.bgGlowC} />
      <div className={styles.bgGlowD} />
      <div className={styles.rainbowBeam} />

      <div className={styles.topPill}>
        <span className={styles.topPillPlus}>+</span>
        <span>{dashboardData.balanceGufo.toFixed(2)} GUFO</span>
      </div>

      <div className={styles.shell}>
        <div className={styles.topRail}>
          <div className={styles.owlDock}>
            <div className={styles.owlHalo} />
            <div className={styles.owlDisc} />
            <span>🦉</span>
          </div>
          <div className={styles.topLine} />
        </div>

        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <div className={styles.kickerRow}>
              <div className={styles.welcomeBadge}>Bentornato</div>
              <div className={styles.liveChip}>
                <span className={styles.liveDot} />
                Profilo attivo
              </div>
            </div>

            <h1 className={styles.userName}>{dashboardData.profileName}</h1>

            <div className={styles.userSubline}>
              <span className={styles.userSubIcon}>⦿</span>
              <span className={styles.userSubText}>
                {dashboardData.profileEmail || "Profilo GUFO attivo"}
              </span>
            </div>

            <div className={styles.inviteCard}>
              <div className={styles.inviteIcon}>↗</div>
              <div className={styles.inviteText}>
                <span>Link rapido GUFO</span>
                <strong>{inviteLink}</strong>
              </div>
            </div>

            <div className={styles.balanceActions}>
              <Link href="/customer-code" className={styles.primaryBtn}>
                Il mio codice
              </Link>
              <Link href="/wallet" className={styles.secondaryBtn}>
                Wallet
              </Link>
              <Link href="/rewards" className={styles.secondaryBtn}>
                Rewards
              </Link>
              <Link href="/membership" className={styles.secondaryBtn}>
                Membership
              </Link>
            </div>
          </div>

          <div className={styles.balancePanel}>
            <div className={styles.balanceCard}>
              <div className={styles.balanceCardGlow} />
              <span className={styles.balanceLabel}>Saldo disponibile</span>
              <h2 className={styles.balanceValue}>
                {dashboardData.balanceGufo.toFixed(2)} GUFO
              </h2>

              <div className={styles.summaryCards}>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryItemIcon}>€</div>
                  <div className={styles.summaryItemText}>
                    <strong>{formatCurrency(dashboardData.balanceEur)}</strong>
                    <span>Saldo EUR</span>
                  </div>
                  <div className={styles.summaryItemTag}>EUR</div>
                </div>

                <div className={styles.summaryItem}>
                  <div className={styles.summaryItemIcon}>#</div>
                  <div className={styles.summaryItemText}>
                    <strong>{dashboardData.customerCode || "Non disponibile"}</strong>
                    <span>Customer code</span>
                  </div>
                  <div className={styles.summaryItemTag}>ID</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statBlue}`}>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{dashboardData.totalTransactions}</div>
              <div className={styles.statLabel}>Transazioni</div>
            </div>

            <div className={styles.statMeta}>
              <div className={styles.statIcon}>↗</div>
              <div className={styles.statHint}>Attività</div>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statPurple}`}>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{dashboardData.level}</div>
              <div className={styles.statLabel}>Livello</div>
            </div>

            <div className={styles.statMeta}>
              <div className={styles.statIcon}>⬒</div>
              <div className={styles.statHint}>Membership #{dashboardData.membershipId}</div>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statPink}`}>
            <div className={styles.statContent}>
              <div className={styles.statValue}>
                +{dashboardData.totalGufoEarned.toFixed(2)}
              </div>
              <div className={styles.statLabel}>GUFO guadagnati</div>
            </div>

            <div className={styles.statMeta}>
              <div className={styles.statIcon}>✦</div>
              <div className={styles.statHint}>Totale reward</div>
            </div>
          </div>
        </section>

        <section className={styles.missionSection}>
          <DashboardMissions />
        </section>

        <section className={styles.contentGrid}>
          <div className={styles.transactionsPanel}>
            <div className={styles.panelHeader}>
              <h3>Transazioni recenti</h3>
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
                        <td>{formatDate(tx.created_at)}</td>
                        <td>
                          <span className={styles.badge}>
                            {formatTransactionType(getTransactionType(tx))}
                          </span>
                        </td>
                        <td>{getSignedAmountLabel(tx)}</td>
                        <td>{getSignedGufoLabel(tx)}</td>
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

                    <div className={styles.mobileMetaItem}>
                      <span>Data</span>
                      <strong>{formatDate(tx.created_at)}</strong>
                    </div>

                    <div className={styles.mobileMetaItem}>
                      <span>Importo</span>
                      <strong>{getSignedAmountLabel(tx)}</strong>
                    </div>

                    <div className={styles.mobileMetaItem}>
                      <span>GUFO</span>
                      <strong>{getSignedGufoLabel(tx)}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.panelFooter}>
              <Link href="/transactions" className={styles.detailBtn}>
                Vedi tutte →
              </Link>
            </div>
          </div>

          <aside className={styles.summaryPanel}>
            <div className={styles.panelHeader}>
              <h3>Riepilogo</h3>
              <span className={styles.summaryBrand}>GUFO</span>
            </div>

            <div className={styles.summaryProfile}>
              <div className={styles.summaryAvatar}>{dashboardData.profileInitial}</div>

              <div className={styles.summaryProfileText}>
                <strong>{dashboardData.profileName}</strong>
                <span>{dashboardData.level}</span>
              </div>

              <div className={styles.summaryLevel}>
                {dashboardData.level.toUpperCase()}
              </div>
            </div>

            <div className={styles.summaryMainValue}>
              + {dashboardData.balanceGufo.toFixed(2)} GUFO
            </div>

            <div className={styles.summaryCards}>
              <div className={styles.summaryItem}>
                <div className={styles.summaryItemIcon}>✦</div>
                <div className={styles.summaryItemText}>
                  <strong>+{dashboardData.totalGufoEarned.toFixed(2)} GUFO</strong>
                  <span>GUFO guadagnati</span>
                </div>
                <div className={styles.summaryItemTag}>GUFO</div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryItemIcon}>◌</div>
                <div className={styles.summaryItemText}>
                  <strong>{formatCurrency(dashboardData.seasonSpent)}</strong>
                  <span>Spesa stagione</span>
                </div>
                <div className={styles.summaryItemTag}>SEASON</div>
              </div>

              <div className={styles.summaryItem}>
                <div className={styles.summaryItemIcon}>◎</div>
                <div className={styles.summaryItemText}>
                  <strong>{formatCurrency(dashboardData.totalSpent)}</strong>
                  <span>Spesa totale</span>
                </div>
                <div className={styles.summaryItemTag}>TOTAL</div>
              </div>
            </div>

            <Link href="/wallet" className={styles.detailWideBtn}>
              Vedi dettagli →
            </Link>
          </aside>
        </section>
      </div>
    </div>
  );
}