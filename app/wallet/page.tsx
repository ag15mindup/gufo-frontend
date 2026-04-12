"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import MissionCard from "@/app/components/Missioncard";
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
  if (!level) return "Bronze";
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
    case "convert":
      return "Conversione";
    case "giftcard":
      return "Gift Card";
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
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

export default function WalletPage() {
  const router = useRouter();

  const [walletData, setWalletData] = useState<WalletData>({
    balanceGufo: 0,
    balanceEuro: 0,
    seasonSpent: 0,
    level: "Bronze",
    cashbackPercent: 0,
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

  const loadWalletPage = useCallback(async () => {
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

      const fallbackName =
        user.user_metadata?.username ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Utente GUFO";

      setUserEmail(user.email || "");
      setUserName(fallbackName);
      setUserInitial(fallbackName.trim().charAt(0).toUpperCase() || "U");

      const [walletPayload, transactionsPayload] = await Promise.all([
        fetchJsonWithAuth<any>(`${API_URL}/wallet`, token),
        fetchJsonWithAuth<any>(`${API_URL}/transactions`, token),
      ]);

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

      setWalletData({
        balanceGufo: toNumberSafe(wallet?.balance_gufo),
        balanceEuro: toNumberSafe(wallet?.balance_eur),
        seasonSpent: toNumberSafe(wallet?.season_spent),
        level: String(wallet?.current_level ?? "Bronze"),
        cashbackPercent: toNumberSafe(wallet?.cashback_percent ?? 0),
        totalTransactions: normalizedTransactions.length,
        totalGufoEarned: Number(totalGufoEarned.toFixed(2)),
        transactions: normalizedTransactions,
        lastSeasonReset: String(wallet?.last_season_reset ?? ""),
      });
    } catch (err: any) {
      setError(err?.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletPage();
  }, [loadWalletPage]);

  const recentTransactions = useMemo(() => {
    return walletData.transactions.slice(0, 8);
  }, [walletData.transactions]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO PREMIUM WALLET</div>
            <p className={styles.eyebrow}>GUFO Wallet</p>
            <h1 className={styles.title}>Portafoglio digitale</h1>
            <p className={styles.subtitle}>Caricamento saldo e movimenti in corso...</p>
          </div>
        </div>

        <div className={styles.loadingBox}>Connessione al wallet in corso...</div>
      </div>
    );
  }

  if (error && !walletData.transactions.length && walletData.balanceGufo === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <div className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO PREMIUM WALLET</div>
            <p className={styles.eyebrow}>GUFO Wallet</p>
            <h1 className={styles.title}>Portafoglio digitale</h1>
            <p className={styles.subtitle}>Si è verificato un problema.</p>
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

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>GUFO PREMIUM WALLET</div>
          <p className={styles.eyebrow}>GUFO Wallet</p>
          <h1 className={styles.title}>I tuoi GUFO</h1>
          <p className={styles.subtitle}>
            {userEmail ? userEmail : "Portafoglio digitale attivo"}
          </p>

          <p className={styles.heroDescription}>
            Tieni sotto controllo saldo, guadagni, missioni e movimenti recenti
            in un’unica esperienza premium.
          </p>

          <div className={styles.heroButtons}>
            <button
              onClick={() => router.push("/buy-gufo")}
              className={styles.buyButton}
              type="button"
            >
              <span className={styles.buyButtonGlow} />
              <span className={styles.buyButtonLabel}>Acquista GUFO</span>
              <span className={styles.buyButtonArrow}>↗</span>
            </button>

            <button
              onClick={() => router.push("/customer-code")}
              className={styles.ghostButton}
              type="button"
            >
              Il mio codice
            </button>
          </div>

          {error ? <div className={styles.inlineError}>{error}</div> : null}
        </div>

        <div className={styles.walletHeroCard}>
          <div className={styles.walletGlow} />
          <div className={styles.walletTopRow}>
            <span className={styles.walletChip}>Saldo disponibile</span>
            <span className={styles.walletUser}>{userName}</span>
          </div>

          <div className={styles.walletAmount}>
            {walletData.balanceGufo.toFixed(2)} <span>GUFO</span>
          </div>

          <div className={styles.walletEuro}>
            Valore convertibile: € {walletData.balanceEuro.toFixed(2)}
          </div>

          <div className={styles.walletMeta}>
            <div className={styles.walletMetaItem}>
              <span>Livello</span>
              <strong>{formatLevel(walletData.level)}</strong>
            </div>

            <div className={styles.walletMetaItem}>
              <span>Movimenti</span>
              <strong>{walletData.totalTransactions}</strong>
            </div>

            <div className={styles.walletMetaItem}>
              <span>Guadagnati</span>
              <strong>{walletData.totalGufoEarned.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.walletStatsGrid}>
        <div className={`${styles.infoCard} ${styles.infoCardPrimary}`}>
          <p className={styles.infoLabel}>GUFO guadagnati</p>
          <h3 className={styles.infoValue}>{walletData.totalGufoEarned.toFixed(2)}</h3>
          <span className={styles.infoHint}>Totale accumulato dai tuoi movimenti</span>
        </div>

        <div className={styles.infoCard}>
          <p className={styles.infoLabel}>Spesa stagione</p>
          <h3 className={styles.infoValue}>€ {walletData.seasonSpent.toFixed(2)}</h3>
          <span className={styles.infoHint}>Volume speso nella stagione attuale</span>
        </div>

        <div className={styles.infoCard}>
          <p className={styles.infoLabel}>Cashback attuale</p>
          <h3 className={styles.infoValue}>
            {walletData.cashbackPercent > 0
              ? `${walletData.cashbackPercent}%`
              : "Variabile"}
          </h3>
          <span className={styles.infoHint}>Deciso dal partner in base all’acquisto</span>
        </div>
      </section>

      <MissionCard transactions={walletData.transactions} />

      <section className={styles.mainGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Wallet activity</p>
              <h3>Movimenti recenti</h3>
            </div>
            <span className={styles.panelBadge}>Ultimi 8</span>
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
                      Nessun movimento disponibile
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx, index) => (
                    <tr key={tx.id || tx.transaction_id || `${getTransactionMerchant(tx)}-${index}`}>
                      <td className={styles.partnerCell}>{getTransactionMerchant(tx)}</td>
                      <td>{formatDate(tx.created_at)}</td>
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

          <div className={styles.mobileList}>
            {recentTransactions.length === 0 ? (
              <div className={styles.emptyMobile}>Nessun movimento disponibile</div>
            ) : (
              recentTransactions.map((tx, index) => (
                <div
                  className={styles.mobileTxCard}
                  key={tx.id || tx.transaction_id || `mobile-${index}`}
                >
                  <div className={styles.mobileTxTop}>
                    <strong>{getTransactionMerchant(tx)}</strong>
                    <span className={styles.badge}>
                      {formatTransactionType(getTransactionType(tx))}
                    </span>
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
              ))
            )}
          </div>
        </div>

        <aside className={styles.sideColumn}>
          <div className={styles.sideCard}>
            <div className={styles.sideHeader}>
              <div className={styles.avatar}>{userInitial}</div>
              <div>
                <strong>{userName}</strong>
                <p>Profilo wallet attivo</p>
              </div>
            </div>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Livello attuale</p>
            <h4>{formatLevel(walletData.level)}</h4>
            <span>Stato membership corrente</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Saldo convertibile</p>
            <h4>€ {walletData.balanceEuro.toFixed(2)}</h4>
            <span>Valore equivalente del saldo GUFO</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Ultimo reset</p>
            <h4>
              {walletData.lastSeasonReset
                ? formatDate(walletData.lastSeasonReset)
                : "Nessuno"}
            </h4>
            <span>Ultimo reset stagionale registrato</span>
          </div>
        </aside>
      </section>
    </div>
  );
}