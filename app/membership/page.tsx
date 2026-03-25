"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./membership.module.css";

const supabase = createClient();

type WalletResponse = {
  balance_gufo?: number | string | null;
  balance?: number | string | null;
  balance_eur?: number | string | null;
  season_spent?: number | string | null;
  current_level?: string | null;
  level?: string | null;
  level_name?: string | null;
  cashback_percent?: number | string | null;
};

type Transaction = {
  id?: string | null;
  amount_euro?: number | string | null;
  amount?: number | string | null;
  importo?: number | string | null;
  raw?: unknown;
};

type DashboardResponse = {
  wallet?: WalletResponse;
  stats?: {
    total_spent?: number | string | null;
    season_spent?: number | string | null;
    level?: string | null;
    current_level?: string | null;
    level_name?: string | null;
    cashback_percent?: number | string | null;
    balance_gufo?: number | string | null;
  };
  transactions?: Transaction[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Basic";

  const normalized = String(level).toLowerCase().trim();

  if (normalized === "vip") return "VIP";
  if (normalized === "platino" || normalized === "platinum") return "Platino";
  if (normalized === "diamond") return "Diamond";
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

function getLevelTone(level: string) {
  const normalized = String(level).toLowerCase();

  if (normalized === "basic") return styles.toneBasic;
  if (normalized === "bronze") return styles.toneBronze;
  if (normalized === "silver") return styles.toneSilver;
  if (normalized === "gold") return styles.toneGold;
  if (normalized === "platino") return styles.tonePlatino;
  if (normalized === "vip") return styles.toneVip;
  if (normalized === "elite") return styles.toneElite;
  if (normalized === "diamond") return styles.toneDiamond;
  if (normalized === "millionaire") return styles.toneMillionaire;

  return styles.toneBasic;
}

export default function MembershipPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashbackPercent, setCashbackPercent] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const levels = useMemo(
    () => [
      { name: "Basic", min: 0, next: 100 },
      { name: "Bronze", min: 100, next: 500 },
      { name: "Silver", min: 500, next: 1000 },
      { name: "Gold", min: 1000, next: 2500 },
      { name: "Platino", min: 2500, next: 5000 },
      { name: "VIP", min: 5000, next: 10000 },
      { name: "Elite", min: 10000, next: 25000 },
      { name: "Diamond", min: 25000, next: 50000 },
      { name: "Millionaire", min: 50000, next: null },
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
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
          `${API_URL}/dashboard/${user.id}`
        );

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || "Errore nel caricamento membership");
        }

        const dashboard: DashboardResponse = data ?? {};
        const walletData = dashboard?.wallet ?? null;
        const stats = dashboard?.stats ?? {};
        const txs = Array.isArray(dashboard?.transactions)
          ? dashboard.transactions
          : [];

        if (!isMounted) return;

        setWallet(walletData);
        setTransactions(txs);
        setCashbackPercent(
          toNumberSafe(
            stats?.cashback_percent ?? walletData?.cashback_percent ?? 2
          )
        );
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Errore sconosciuto");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalSpentFromTransactions = transactions.reduce(
    (sum, t) => sum + getTransactionAmount(t),
    0
  );

  const seasonSpent = toNumberSafe(
    wallet?.season_spent ?? totalSpentFromTransactions
  );

  const balanceGufo = toNumberSafe(wallet?.balance_gufo ?? wallet?.balance);

  const currentLevelRaw = String(
    wallet?.level_name ?? wallet?.current_level ?? wallet?.level ?? "Basic"
  );

  const currentLevel = formatLevel(currentLevelRaw);

  const currentLevelIndex = levels.findIndex(
    (level) => level.name.toLowerCase() === currentLevel.toLowerCase()
  );

  const currentLevelData =
    currentLevelIndex >= 0 ? levels[currentLevelIndex] : levels[0];

  const nextLevelData =
    currentLevelIndex >= 0 && currentLevelIndex < levels.length - 1
      ? levels[currentLevelIndex + 1]
      : null;

  const amountToNextLevel = nextLevelData
    ? Math.max(nextLevelData.min - seasonSpent, 0)
    : 0;

  const progressPercent =
    nextLevelData && currentLevelData && nextLevelData.min > currentLevelData.min
      ? Math.max(
          0,
          Math.min(
            ((seasonSpent - currentLevelData.min) /
              (nextLevelData.min - currentLevelData.min)) *
              100,
            100
          )
        )
      : 100;

  const completedLevels = levels.filter((level) => seasonSpent >= level.min).length;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <div className={styles.hero}>
          <div>
            <p className={styles.welcome}>GUFO MEMBERSHIP</p>
            <h1 className={styles.userName}>Membership</h1>
            <p className={styles.email}>Caricamento progressi membership...</p>
          </div>
        </div>

        <div className={styles.loadingBox}>Recupero percorso membership...</div>
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
            <p className={styles.welcome}>GUFO MEMBERSHIP</p>
            <h1 className={styles.userName}>Membership</h1>
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
          <p className={styles.welcome}>GUFO MEMBERSHIP</p>
          <h1 className={styles.userName}>Membership GUFO</h1>
          <p className={styles.email}>
            Controlla il tuo livello attuale e i progressi per salire di status
          </p>
        </div>

        <div className={`${styles.balanceCard} ${getLevelTone(currentLevel)}`}>
          <span className={styles.balanceLabel}>Livello attuale</span>
          <h2 className={styles.balanceValue}>{currentLevel}</h2>
          <div className={styles.balanceSubValue}>
            Cashback attuale: {cashbackPercent}%
          </div>

          <div className={styles.balanceButtons}>
            <button type="button" className={styles.primaryBtn}>
              € {seasonSpent.toFixed(2)}
            </button>
            <button type="button" className={styles.secondaryBtn}>
              {balanceGufo.toFixed(2)} GUFO
            </button>
          </div>
        </div>
      </div>

      <section className={`${styles.membershipHeroCard} ${getLevelTone(currentLevel)}`}>
        <div className={styles.levelChip}>{currentLevel}</div>

        <h2 className={styles.mainLevelTitle}>Livello attuale: {currentLevel}</h2>
        <p className={styles.mainLevelText}>
          Il tuo status si aggiorna in base alla spesa stagionale e al tuo utilizzo
          dell’ecosistema GUFO.
        </p>

        <div className={styles.progressShell}>
          <div className={styles.progressTop}>
            <span>Progressi verso il prossimo livello</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {nextLevelData ? (
            <p className={styles.progressNote}>
              Prossimo livello: <strong>{nextLevelData.name}</strong> · Ti mancano{" "}
              <strong>€ {amountToNextLevel.toFixed(2)}</strong>
            </p>
          ) : (
            <p className={styles.progressNote}>Hai raggiunto il livello massimo.</p>
          )}
        </div>
      </section>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cyan}`}>
          <div>
            <div className={styles.statValue}>{balanceGufo.toFixed(2)}</div>
            <div className={styles.statLabel}>Saldo GUFO</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>G</div>
            <div className={styles.statHint}>Wallet</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.purple}`}>
          <div>
            <div className={styles.statValue}>€ {seasonSpent.toFixed(2)}</div>
            <div className={styles.statLabel}>Spesa stagione</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>€</div>
            <div className={styles.statHint}>Season</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.orange}`}>
          <div>
            <div className={styles.statValue}>{cashbackPercent}%</div>
            <div className={styles.statLabel}>Cashback attuale</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>%</div>
            <div className={styles.statHint}>Reward</div>
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Il tuo percorso Membership</h3>
              <p className={styles.panelSubtext}>
                Tutti i livelli disponibili e lo stato del tuo avanzamento
              </p>
            </div>
            <span>Levels Map</span>
          </div>

          <div className={styles.levelsGrid}>
            {levels.map((level) => {
              const isCurrent =
                level.name.toLowerCase() === currentLevel.toLowerCase();
              const isCompleted = seasonSpent >= level.min;

              return (
                <div
                  key={level.name}
                  className={`${styles.levelCard} ${getLevelTone(level.name)} ${
                    isCurrent ? styles.current : ""
                  } ${isCompleted ? styles.completed : ""}`}
                >
                  <div className={styles.levelTop}>
                    <h4 className={styles.levelName}>{level.name}</h4>
                    {isCurrent && <span className={styles.levelBadge}>Attuale</span>}
                  </div>

                  <p className={styles.levelThreshold}>
                    Soglia minima: <strong>€ {level.min}</strong>
                  </p>

                  <p className={styles.levelNext}>
                    Soglia successiva:{" "}
                    <strong>
                      {level.next !== null ? `€ ${level.next}` : "Livello massimo"}
                    </strong>
                  </p>

                  <div className={styles.levelStatus}>
                    {isCurrent
                      ? "Questo è il tuo livello attuale."
                      : isCompleted
                      ? "Livello già raggiunto."
                      : "Livello ancora da raggiungere."}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Top Info</h3>
            <span>PRO</span>
          </div>

          <div className={styles.topList}>
            <div className={styles.topItem}>
              <div className={styles.avatar}>L</div>
              <div>
                <strong>{currentLevel}</strong>
                <p>Livello attuale</p>
              </div>
              <span>now</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>#</div>
              <div>
                <strong>{completedLevels}</strong>
                <p>Livelli raggiunti</p>
              </div>
              <span>map</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>N</div>
              <div>
                <strong>{nextLevelData ? nextLevelData.name : "Max"}</strong>
                <p>Prossimo target</p>
              </div>
              <span>next</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>€</div>
              <div>
                <strong>€ {amountToNextLevel.toFixed(2)}</strong>
                <p>Mancano al prossimo livello</p>
              </div>
              <span>go</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>T</div>
              <div>
                <strong>{transactions.length}</strong>
                <p>Transazioni registrate</p>
              </div>
              <span>act</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}