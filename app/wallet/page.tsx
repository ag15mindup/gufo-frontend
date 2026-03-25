"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "../dashboard/dashboard.module.css";

const supabase = createClient();

type WalletResponse = {
  user_id?: string;
  balance_gufo?: number | string | null;
  balance_eur?: number | string | null;
  season_spent?: number | string | null;
  current_level?: string | null;
  cashback_percent?: number | string | null;
  last_season_reset?: string | null;
  success?: boolean;
  error?: string;
  data?: unknown;
};

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
  cashback?: number | string | null;
  cashback_percent?: number | string | null;
  created_at?: string | null;
  raw?: unknown;
};

type WalletData = {
  balanceGufo: number;
  balanceEuro: number;
  seasonSpent: number;
  level: string;
  cashbackPercent: number;
  totalTransactions: number;
  totalGufoEarned: number;
  transactions: Transaction[];
  lastSeasonReset: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Basic";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
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
    tx?.gufo_earned ?? tx?.gufo ?? tx?.raw?.gufo_earned ?? tx?.raw?.gufo
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
    "-"
  );
}

function getTransactionType(tx: any) {
  return tx?.type ?? tx?.tipo ?? tx?.raw?.type ?? tx?.raw?.tipo ?? "-";
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("it-IT");
}

function extractWallet(payload: any): WalletResponse {
  if (!payload) return {};
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
}

function extractTransactions(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  if (Array.isArray(payload?.data?.transactions)) return payload.data.transactions;
  return [];
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData>({
    balanceGufo: 0,
    balanceEuro: 0,
    seasonSpent: 0,
    level: "Basic",
    cashbackPercent: 2,
    totalTransactions: 0,
    totalGufoEarned: 0,
    transactions: [],
    lastSeasonReset: "",
  });

  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("GUFO User");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadWalletPage() {
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

        const fallbackName =
          user.user_metadata?.username ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "GUFO User";

        if (isMounted) {
          setUserEmail(user.email || "");
          setUserName(fallbackName);
        }

        const [walletRes, transactionsRes] = await Promise.all([
          safeJsonFetch(`${API_URL}/wallet/${user.id}`),
          safeJsonFetch(`${API_URL}/transactions/${user.id}`),
        ]);

        if (!walletRes.response.ok || walletRes.data?.success === false) {
          throw new Error(walletRes.data?.error || "Errore nel recupero wallet");
        }

        if (!transactionsRes.response.ok || transactionsRes.data?.success === false) {
          throw new Error(
            transactionsRes.data?.error || "Errore nel recupero transazioni"
          );
        }

        const walletPayload = walletRes.data ?? {};
        const transactionsPayload = transactionsRes.data ?? {};

        const wallet: WalletResponse = extractWallet(walletPayload);
        const rawTransactions = extractTransactions(transactionsPayload);

        const normalizedTransactions: Transaction[] = rawTransactions.map((tx: any) => ({
          id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id,
          transaction_id: tx?.transaction_id ?? tx?.id ?? tx?.raw?.transaction_id,
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
        }));

        const totalGufoEarned = normalizedTransactions.reduce(
          (sum, tx) => sum + getTransactionGufo(tx),
          0
        );

        if (!isMounted) return;

        setWalletData({
          balanceGufo: toNumberSafe(wallet?.balance_gufo),
          balanceEuro: toNumberSafe(wallet?.balance_eur),
          seasonSpent: toNumberSafe(wallet?.season_spent),
          level: String(wallet?.current_level ?? "Basic"),
          cashbackPercent: toNumberSafe(wallet?.cashback_percent ?? 2),
          totalTransactions: normalizedTransactions.length,
          totalGufoEarned: Number(totalGufoEarned.toFixed(2)),
          transactions: normalizedTransactions,
          lastSeasonReset: String(wallet?.last_season_reset ?? ""),
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

    loadWalletPage();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.heroLine} />
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>GUFO WALLET</div>
            <h1 className={styles.heroTitle}>Wallet</h1>
            <p className={styles.heroSubtitle}>
              Connessione al saldo, cashback e movimenti in corso...
            </p>
          </div>
        </div>

        <div className={`${styles.premiumCard} ${styles.loadingBox}`}>
          <p>Caricamento wallet premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.heroLine} />
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.heroEyebrow}>GUFO WALLET</div>
            <h1 className={styles.heroTitle}>Wallet</h1>
            <p className={styles.heroSubtitle}>Si è verificato un problema.</p>
          </div>
        </div>

        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.heroLine} />

      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroEyebrow}>Welcome back!</div>
          <h1 className={styles.heroTitle}>{userName}</h1>
          <p className={styles.heroSubtitle}>
            {userEmail || "Profilo wallet attivo"}
          </p>
        </div>

        <div className={`${styles.premiumCard} ${styles.balanceCard}`}>
          <div className={styles.balanceLabel}>Balance</div>
          <div className={styles.balanceValue}>
            {walletData.balanceGufo.toFixed(2)} GUFO
          </div>

          <div className={styles.balanceActions}>
            <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`} type="button">
              + Deposit
            </button>
            <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} type="button">
              + Withdraw
            </button>
          </div>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={`${styles.premiumCard} ${styles.miniStat}`}>
          <div className={styles.miniStatNumber}>{walletData.totalTransactions}</div>
          <div className={styles.miniStatLabel}>Active Transactions</div>
          <div className={styles.miniStatSide}>Live</div>
        </div>

        <div className={`${styles.premiumCard} ${styles.miniStat}`}>
          <div className={styles.miniStatNumber}>{formatLevel(walletData.level)}</div>
          <div className={styles.miniStatLabel}>Membership Level</div>
          <div className={styles.miniStatSide}>User tier</div>
        </div>

        <div className={`${styles.premiumCard} ${styles.miniStat}`}>
          <div className={styles.miniStatNumber}>{walletData.cashbackPercent}%</div>
          <div className={styles.miniStatLabel}>Cashback Rate</div>
          <div className={styles.miniStatSide}>Current</div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={`${styles.premiumCard} ${styles.leftColumn}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Transactions</h2>
            <span className={styles.sectionLink}>View All</span>
          </div>

          {walletData.transactions.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>Nessuna transazione disponibile</div>
              <div className={styles.emptyText}>
                Quando riceverai cashback o guadagni GUFO, li vedrai qui.
              </div>
            </div>
          ) : (
            <>
              <div className={styles.desktopOnly}>
                <div className={styles.tableWrap}>
                  <table className={styles.transactionsTable}>
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
                      {walletData.transactions.slice(0, 8).map((tx, index) => (
                        <tr key={tx.id || tx.transaction_id || index}>
                          <td>{getTransactionMerchant(tx)}</td>
                          <td>{formatDate(tx.created_at)}</td>
                          <td>
                            <span className={styles.typePill}>
                              {getTransactionType(tx)}
                            </span>
                          </td>
                          <td className={styles.amountCell}>
                            € {getTransactionAmount(tx).toFixed(2)}
                          </td>
                          <td>{getTransactionGufo(tx).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`${styles.mobileOnly} ${styles.mobileList}`}>
                {walletData.transactions.slice(0, 8).map((tx, index) => (
                  <div
                    className={styles.mobileTxCard}
                    key={tx.id || tx.transaction_id || index}
                  >
                    <div className={styles.mobileTxTop}>
                      <strong>{getTransactionMerchant(tx)}</strong>
                      <span className={styles.typePill}>
                        {getTransactionType(tx)}
                      </span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>Data</span>
                      <span>{formatDate(tx.created_at)}</span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>Importo</span>
                      <span className={styles.amountCell}>
                        € {getTransactionAmount(tx).toFixed(2)}
                      </span>
                    </div>

                    <div className={styles.mobileTxRow}>
                      <span>GUFO</span>
                      <span>{getTransactionGufo(tx).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className={`${styles.premiumCard} ${styles.rightColumn}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Top Info</h2>
            <span className={styles.proBadge}>PRO</span>
          </div>

          <div className={styles.infoStack}>
            <div className={styles.infoCard}>
              <div className={`${styles.infoIcon} ${styles.infoIconPink}`} />
              <div className={styles.infoCopy}>
                <div className={styles.infoMain}>{userName}</div>
                <div className={styles.infoSub}>Profilo attivo</div>
              </div>
              <div className={styles.infoTag}>
                {formatLevel(walletData.level).toUpperCase()}
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={`${styles.infoIcon} ${styles.infoIconCyan}`} />
              <div className={styles.infoCopy}>
                <div className={styles.infoMain}>
                  € {walletData.seasonSpent.toFixed(2)}
                </div>
                <div className={styles.infoSub}>Spesa totale stagione</div>
              </div>
              <div className={styles.infoTag}>TOT</div>
            </div>

            <div className={styles.infoCard}>
              <div className={`${styles.infoIcon} ${styles.infoIconGold}`} />
              <div className={styles.infoCopy}>
                <div className={styles.infoMain}>
                  {walletData.totalGufoEarned.toFixed(2)}
                </div>
                <div className={styles.infoSub}>GUFO guadagnati</div>
              </div>
              <div className={styles.infoTag}>EARN</div>
            </div>

            <div className={styles.infoCard}>
              <div className={`${styles.infoIcon} ${styles.infoIconGreen}`} />
              <div className={styles.infoCopy}>
                <div className={styles.infoMain}>
                  € {walletData.balanceEuro.toFixed(2)}
                </div>
                <div className={styles.infoSub}>Saldo convertibile</div>
              </div>
              <div className={styles.infoTag}>EUR</div>
            </div>

            <div className={styles.resetBox}>
              <div className={styles.resetLabel}>Ultimo reset stagionale</div>
              <div className={styles.resetValue}>
                {walletData.lastSeasonReset
                  ? formatDate(walletData.lastSeasonReset)
                  : "Nessuno"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}