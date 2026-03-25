"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./wallet.module.css";

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

function formatLevel(level?: string) {
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
    "Partner GUFO"
  );
}

function getTransactionType(tx: any) {
  return tx?.type ?? tx?.tipo ?? tx?.raw?.type ?? tx?.raw?.tipo ?? "cashback";
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
  const [userName, setUserName] = useState("Utente GUFO");
  const [userInitial, setUserInitial] = useState("U");
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
          "Utente GUFO";

        if (isMounted) {
          setUserEmail(user.email || "");
          setUserName(fallbackName);
          setUserInitial(fallbackName.trim().charAt(0).toUpperCase() || "U");
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

  const recentTransactions = useMemo(() => {
    return walletData.transactions.slice(0, 8);
  }, [walletData.transactions]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <div className={styles.hero}>
          <div>
            <p className={styles.welcome}>Welcome back!</p>
            <h1 className={styles.userName}>Wallet</h1>
            <p className={styles.email}>Caricamento dati wallet...</p>
          </div>
        </div>

        <div className={styles.loadingBox}>Connessione al wallet in corso...</div>
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
            <p className={styles.welcome}>Welcome back!</p>
            <h1 className={styles.userName}>Wallet</h1>
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
          <p className={styles.welcome}>Welcome back!</p>
          <h1 className={styles.userName}>{userName}</h1>
          {userEmail ? (
            <p className={styles.email}>{userEmail}</p>
          ) : (
            <p className={styles.email}>Profilo wallet attivo</p>
          )}
        </div>

        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Balance</span>
          <h2 className={styles.balanceValue}>
            {walletData.balanceGufo.toFixed(2)} GUFO
          </h2>

          <div className={styles.balanceSubValue}>
            ≈ € {walletData.balanceEuro.toFixed(2)} convertibili
          </div>

          <div className={styles.balanceButtons}>
            <button type="button" className={styles.primaryBtn}>
              + Deposit
            </button>
            <button type="button" className={styles.secondaryBtn}>
              + Withdraw
            </button>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cyan}`}>
          <div>
            <div className={styles.statValue}>{walletData.totalTransactions}</div>
            <div className={styles.statLabel}>Active Transactions</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>↗</div>
            <div className={styles.statHint}>Live</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.purple}`}>
          <div>
            <div className={styles.statValue}>{formatLevel(walletData.level)}</div>
            <div className={styles.statLabel}>Membership Level</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>⬢</div>
            <div className={styles.statHint}>User tier</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.orange}`}>
          <div>
            <div className={styles.statValue}>{walletData.cashbackPercent}%</div>
            <div className={styles.statLabel}>Cashback Rate</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>⤴</div>
            <div className={styles.statHint}>Current</div>
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Recent Transactions</h3>
            <span>View All</span>
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
                    <tr key={tx.id || tx.transaction_id || `${getTransactionMerchant(tx)}-${index}`}>
                      <td className={styles.partnerCell}>{getTransactionMerchant(tx)}</td>
                      <td>{formatDate(tx.created_at)}</td>
                      <td>
                        <span className={styles.badge}>{getTransactionType(tx)}</span>
                      </td>
                      <td>€ {getTransactionAmount(tx).toFixed(2)}</td>
                      <td>{getTransactionGufo(tx).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {recentTransactions.map((tx, index) => (
              <div
                className={styles.mobileTxCard}
                key={tx.id || tx.transaction_id || `mobile-${index}`}
              >
                <div className={styles.mobileTxTop}>
                  <strong>{getTransactionMerchant(tx)}</strong>
                  <span className={styles.badge}>{getTransactionType(tx)}</span>
                </div>

                <div className={styles.mobileTxRow}>
                  <span>Data</span>
                  <span>{formatDate(tx.created_at)}</span>
                </div>

                <div className={styles.mobileTxRow}>
                  <span>Importo</span>
                  <span>€ {getTransactionAmount(tx).toFixed(2)}</span>
                </div>

                <div className={styles.mobileTxRow}>
                  <span>GUFO</span>
                  <span>{getTransactionGufo(tx).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Top Info</h3>
            <span>PRO</span>
          </div>

          <div className={styles.topList}>
            <div className={styles.topItem}>
              <div className={styles.avatar}>{userInitial}</div>
              <div>
                <strong>{userName}</strong>
                <p>Profilo attivo</p>
              </div>
              <span>{formatLevel(walletData.level)}</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>€</div>
              <div>
                <strong>€ {walletData.seasonSpent.toFixed(2)}</strong>
                <p>Spesa totale stagione</p>
              </div>
              <span>tot</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>G</div>
              <div>
                <strong>{walletData.totalGufoEarned.toFixed(2)}</strong>
                <p>GUFO guadagnati</p>
              </div>
              <span>earn</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>€</div>
              <div>
                <strong>€ {walletData.balanceEuro.toFixed(2)}</strong>
                <p>Saldo convertibile</p>
              </div>
              <span>eur</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>⟳</div>
              <div>
                <strong>
                  {walletData.lastSeasonReset
                    ? formatDate(walletData.lastSeasonReset)
                    : "Nessuno"}
                </strong>
                <p>Ultimo reset stagionale</p>
              </div>
              <span>reset</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}