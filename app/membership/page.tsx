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
  if (!level) return "Bronze";

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

  if (normalized === "bronze") return styles.toneBronze;
  if (normalized === "silver") return styles.toneSilver;
  if (normalized === "gold") return styles.toneGold;
  if (normalized === "vip") return styles.toneVip;
  if (normalized === "elite") return styles.toneElite;

  return styles.toneBronze;
}

export default function MembershipPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashbackPercent, setCashbackPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({});

  const levels = useMemo(
    () => [
      { name: "Bronze", min: 0, next: 300 },
      { name: "Silver", min: 300, next: 1000 },
      { name: "Gold", min: 1000, next: 2500 },
      { name: "VIP", min: 2500, next: 6000 },
      { name: "Elite", min: 6000, next: null },
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message || "Errore utente");
    }

    if (!user) {
      throw new Error("Utente non autenticato");
    }

    // 🔐 prendi sessione per token
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(sessionError.message || "Errore sessione");
    }

    if (!session?.access_token) {
      throw new Error("Sessione non valida");
    }

    // ✅ CHIAMATA CORRETTA (senza user.id)
    const { response, data } = await safeJsonFetch(
      `${API_URL}/dashboard`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || "Errore nel fetch dashboard");
    }

    const dashboard = data;

    const walletData = dashboard?.wallet ?? null;
    const stats = dashboard?.stats ?? {};
    const txs = Array.isArray(dashboard?.transactions)
      ? dashboard.transactions
      : [];

    setWallet(walletData);
    setStats(stats);
    setTransactions(txs);
  } catch (err) {
    console.error("Errore fetchDashboard:", err);
    setError(
      err instanceof Error
        ? err.message
        : "Errore nel caricamento dashboard"
    );
  } finally {
    setLoading(false);
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
    wallet?.level_name ?? wallet?.current_level ?? wallet?.level ?? "Bronze"
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
    nextLevelData && nextLevelData.min > currentLevelData.min
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

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO PREMIUM MEMBERSHIP</div>
            <p className={styles.eyebrow}>GUFO Membership</p>
            <h1 className={styles.title}>Status e progressione</h1>
            <p className={styles.subtitle}>Caricamento progressi membership...</p>
          </div>
        </section>

        <div className={styles.loadingBox}>Recupero percorso membership...</div>
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
            <div className={styles.heroBadge}>GUFO PREMIUM MEMBERSHIP</div>
            <p className={styles.eyebrow}>GUFO Membership</p>
            <h1 className={styles.title}>Status e progressione</h1>
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
          <div className={styles.heroBadge}>GUFO PREMIUM MEMBERSHIP</div>
          <p className={styles.eyebrow}>GUFO Membership</p>
          <h1 className={styles.title}>Il tuo percorso status</h1>
          <p className={styles.subtitle}>
            Controlla il livello attuale, i progressi stagionali e quanto manca
            al prossimo traguardo.
          </p>
          <p className={styles.heroDescription}>
            La membership GUFO evolve in base alla tua attività nell’ecosistema:
            più spesa stagionale, più crescita, più valore nel tempo.
          </p>
        </div>
      </section>

      <section className={`${styles.statusHeroCard} ${getLevelTone(currentLevel)}`}>
        <div className={styles.levelChip}>{currentLevel}</div>

        <div className={styles.statusGrid}>
          <div>
            <p className={styles.heroLabel}>Livello attuale</p>
            <h2 className={styles.mainLevelTitle}>{currentLevel}</h2>
            <p className={styles.mainLevelText}>
              Il tuo status si aggiorna in base alla spesa stagionale registrata
              dentro l’ecosistema GUFO.
            </p>
          </div>

          <div className={styles.statusSideInfo}>
            <div className={styles.sideMiniCard}>
              <span>Spesa stagione</span>
              <strong>€ {seasonSpent.toFixed(2)}</strong>
            </div>

            <div className={styles.sideMiniCard}>
              <span>Saldo GUFO</span>
              <strong>{balanceGufo.toFixed(2)}</strong>
            </div>

            <div className={styles.sideMiniCard}>
              <span>Cashback attuale</span>
              <strong>
                {cashbackPercent > 0 ? `${cashbackPercent}%` : "Variabile"}
              </strong>
            </div>
          </div>
        </div>

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
              Prossimo livello: <strong>{nextLevelData.name}</strong> · Mancano{" "}
              <strong>€ {amountToNextLevel.toFixed(2)}</strong>
            </p>
          ) : (
            <p className={styles.progressNote}>
              Hai raggiunto il livello massimo disponibile.
            </p>
          )}
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
          <p className={styles.metricLabel}>Livello attuale</p>
          <h3 className={styles.metricValue}>{currentLevel}</h3>
          <span className={styles.metricHint}>Status membership corrente</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Spesa stagione</p>
          <h3 className={styles.metricValue}>€ {seasonSpent.toFixed(2)}</h3>
          <span className={styles.metricHint}>Volume valido per la progressione</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Livelli raggiunti</p>
          <h3 className={styles.metricValue}>{completedLevels}</h3>
          <span className={styles.metricHint}>Step già sbloccati nel percorso</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Prossimo target</p>
          <h3 className={styles.metricValue}>
            {nextLevelData ? nextLevelData.name : "MAX"}
          </h3>
          <span className={styles.metricHint}>Obiettivo successivo</span>
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Levels Map</p>
              <h3>Il tuo percorso Membership</h3>
            </div>
            <span className={styles.panelBadge}>Progressione</span>
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
                    Prossimo step:{" "}
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
        </div>

        <aside className={styles.sideColumn}>
          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Livello attuale</p>
            <h4>{currentLevel}</h4>
            <span>Status membership corrente</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Prossimo livello</p>
            <h4>{nextLevelData ? nextLevelData.name : "MAX"}</h4>
            <span>Target successivo del percorso</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Mancano</p>
            <h4>€ {amountToNextLevel.toFixed(2)}</h4>
            <span>Spesa necessaria per salire</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Transazioni registrate</p>
            <h4>{transactions.length}</h4>
            <span>Movimenti considerati nello storico</span>
          </div>
        </aside>
      </section>
    </div>
  );
}