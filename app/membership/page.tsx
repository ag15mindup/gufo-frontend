"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

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

  if (normalized === "basic") return "tone-basic";
  if (normalized === "bronze") return "tone-bronze";
  if (normalized === "silver") return "tone-silver";
  if (normalized === "gold") return "tone-gold";
  if (normalized === "platino") return "tone-platino";
  if (normalized === "vip") return "tone-vip";
  if (normalized === "elite") return "tone-elite";
  if (normalized === "diamond") return "tone-diamond";
  if (normalized === "millionaire") return "tone-millionaire";

  return "tone-basic";
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
      <div className="membership-premium-page">
        <style>{membershipStyles}</style>

        <div className="hero-line" />

        <div className="membership-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO MEMBERSHIP</div>
            <h1 className="hero-page-title">Membership</h1>
            <p className="hero-page-subtitle">
              Caricamento progressi membership in corso...
            </p>
          </div>
        </div>

        <div className="loading-box premium-card">
          <p>Recupero percorso membership premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="membership-premium-page">
        <style>{membershipStyles}</style>

        <div className="hero-line" />

        <div className="membership-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO MEMBERSHIP</div>
            <h1 className="hero-page-title">Membership</h1>
            <p className="hero-page-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="membership-premium-page">
      <style>{membershipStyles}</style>

      <div className="hero-line" />

      <div className="membership-premium-hero">
        <div>
          <div className="hero-eyebrow">GUFO MEMBERSHIP</div>
          <h1 className="hero-page-title">Membership GUFO</h1>
          <p className="hero-page-subtitle">
            Controlla il tuo livello attuale e i progressi per salire di status
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Status Active
        </div>
      </div>

      <div className="top-grid">
        <div className={`main-level-card premium-card ${getLevelTone(currentLevel)}`}>
          <div className="level-chip">{currentLevel}</div>

          <h2 className="main-level-title">Livello attuale: {currentLevel}</h2>
          <p className="main-level-text">
            Il tuo status si aggiorna in base alla spesa stagionale e al tuo utilizzo
            dell’ecosistema GUFO.
          </p>

          <div className="progress-shell">
            <div className="progress-top">
              <span>Progressi verso il prossimo livello</span>
              <span>{progressPercent.toFixed(0)}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {nextLevelData ? (
              <p className="progress-note">
                Prossimo livello: <strong>{nextLevelData.name}</strong> · Ti
                mancano <strong>€ {amountToNextLevel.toFixed(2)}</strong>
              </p>
            ) : (
              <p className="progress-note">Hai raggiunto il livello massimo.</p>
            )}
          </div>
        </div>

        <div className="side-stats-grid">
          <div className="mini-stat premium-card">
            <div className="mini-stat-number">{balanceGufo.toFixed(2)}</div>
            <div className="mini-stat-label">Saldo GUFO</div>
            <div className="mini-stat-side">Wallet</div>
          </div>

          <div className="mini-stat premium-card">
            <div className="mini-stat-number">€ {seasonSpent.toFixed(2)}</div>
            <div className="mini-stat-label">Spesa stagione</div>
            <div className="mini-stat-side">Season</div>
          </div>

          <div className="mini-stat premium-card">
            <div className="mini-stat-number">{cashbackPercent}%</div>
            <div className="mini-stat-label">Cashback attuale</div>
            <div className="mini-stat-side">Reward</div>
          </div>

          <div className="mini-stat premium-card">
            <div className="mini-stat-number">{transactions.length}</div>
            <div className="mini-stat-label">Transazioni</div>
            <div className="mini-stat-side">Activity</div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="levels-panel premium-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Il tuo percorso Membership</h2>
              <p className="section-subtitle">
                Tutti i livelli disponibili e lo stato del tuo avanzamento
              </p>
            </div>

            <div className="mini-pill">Levels Map</div>
          </div>

          <div className="levels-grid">
            {levels.map((level) => {
              const isCurrent =
                level.name.toLowerCase() === currentLevel.toLowerCase();
              const isCompleted = seasonSpent >= level.min;

              return (
                <div
                  key={level.name}
                  className={`level-card ${isCurrent ? "current" : ""} ${
                    isCompleted ? "completed" : ""
                  } ${getLevelTone(level.name)}`}
                >
                  <div className="level-top">
                    <h3 className="level-name">{level.name}</h3>
                    {isCurrent && <span className="level-badge">Attuale</span>}
                  </div>

                  <p className="level-threshold">
                    Soglia minima: <strong>€ {level.min}</strong>
                  </p>

                  <p className="level-next">
                    Soglia successiva:{" "}
                    <strong>
                      {level.next !== null ? `€ ${level.next}` : "Livello massimo"}
                    </strong>
                  </p>

                  <div className="level-status">
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

        <div className="insights-panel premium-card">
          <div className="section-header">
            <h2 className="section-title">Top Info</h2>
            <span className="pro-badge">PRO</span>
          </div>

          <div className="info-stack">
            <div className="info-card">
              <div className="info-icon info-icon-cyan" />
              <div className="info-copy">
                <div className="info-main">{currentLevel}</div>
                <div className="info-sub">Livello attuale</div>
              </div>
              <div className="info-tag">NOW</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-pink" />
              <div className="info-copy">
                <div className="info-main">{completedLevels}</div>
                <div className="info-sub">Livelli raggiunti</div>
              </div>
              <div className="info-tag">MAP</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-gold" />
              <div className="info-copy">
                <div className="info-main">
                  {nextLevelData ? nextLevelData.name : "Max"}
                </div>
                <div className="info-sub">Prossimo target</div>
              </div>
              <div className="info-tag">NEXT</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-green" />
              <div className="info-copy">
                <div className="info-main">€ {amountToNextLevel.toFixed(2)}</div>
                <div className="info-sub">Mancano al prossimo livello</div>
              </div>
              <div className="info-tag">GO</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const membershipStyles = `
  * {
    box-sizing: border-box;
  }

  .membership-premium-page {
    position: relative;
    min-height: 100%;
    color: #ffffff;
  }

  .membership-premium-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(6, 10, 20, 0.18), rgba(6, 10, 20, 0.34)),
      radial-gradient(circle at 18% 20%, rgba(56, 189, 248, 0.10), transparent 24%),
      radial-gradient(circle at 84% 18%, rgba(236, 72, 153, 0.10), transparent 24%),
      radial-gradient(circle at 18% 84%, rgba(34, 197, 94, 0.08), transparent 20%),
      radial-gradient(circle at 82% 80%, rgba(250, 204, 21, 0.08), transparent 22%);
    z-index: 0;
  }

  .membership-premium-page > * {
    position: relative;
    z-index: 1;
  }

  .hero-line {
    width: 100%;
    height: 3px;
    border-radius: 999px;
    margin-bottom: 22px;
    background: linear-gradient(
      90deg,
      rgba(34, 211, 238, 0.95),
      rgba(132, 204, 22, 0.9),
      rgba(250, 204, 21, 0.95),
      rgba(251, 113, 133, 0.95),
      rgba(196, 181, 253, 0.95)
    );
    box-shadow: 0 0 18px rgba(255,255,255,0.14);
  }

  .membership-premium-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 22px;
  }

  .hero-eyebrow {
    font-size: 13px;
    font-weight: 800;
    color: #f8fafc;
    margin-bottom: 10px;
  }

  .hero-page-title {
    margin: 0 0 8px 0;
    font-size: 58px;
    line-height: 0.96;
    font-weight: 900;
    letter-spacing: -0.04em;
    text-shadow: 0 0 18px rgba(255,255,255,0.12);
    word-break: break-word;
  }

  .hero-page-subtitle {
    margin: 0;
    color: #d7e2f2;
    font-size: 15px;
    line-height: 1.5;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    white-space: nowrap;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #eef2ff;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.06);
  }

  .hero-badge-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: linear-gradient(180deg, #4ade80, #22c55e);
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.55);
    flex-shrink: 0;
  }

  .premium-card {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.60),
      rgba(15, 23, 42, 0.48)
    );
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 24px;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow:
      0 16px 38px rgba(0,0,0,0.28),
      inset 0 1px 0 rgba(255,255,255,0.05),
      0 0 0 1px rgba(255,255,255,0.02);
  }

  .top-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.95fr);
    gap: 20px;
    margin-bottom: 22px;
    align-items: stretch;
  }

  .main-level-card {
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .main-level-card::after {
    content: "";
    position: absolute;
    right: -60px;
    top: -60px;
    width: 180px;
    height: 180px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255,255,255,0.10), transparent 70%);
    pointer-events: none;
  }

  .level-chip {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 900;
    margin-bottom: 14px;
    color: #0f172a;
    background: linear-gradient(
      90deg,
      rgba(244, 114, 182, 0.96),
      rgba(96, 165, 250, 0.96),
      rgba(74, 222, 128, 0.96),
      rgba(250, 204, 21, 0.96)
    );
  }

  .main-level-title {
    margin: 0 0 12px 0;
    font-size: 34px;
    line-height: 1.08;
    color: #ffffff;
    font-weight: 900;
  }

  .main-level-text {
    color: #dbe7fb;
    font-size: 15px;
    line-height: 1.7;
    margin: 0 0 20px 0;
    max-width: 760px;
  }

  .progress-shell {
    background: rgba(255, 255, 255, 0.04);
    border-radius: 18px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .progress-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    color: #dbe4f0;
    margin-bottom: 10px;
  }

  .progress-bar {
    width: 100%;
    height: 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
    margin-bottom: 12px;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      #f472b6 0%,
      #60a5fa 35%,
      #4ade80 70%,
      #facc15 100%
    );
    box-shadow:
      0 0 18px rgba(96, 165, 250, 0.14),
      0 0 22px rgba(244, 114, 182, 0.08);
  }

  .progress-note {
    margin: 0;
    color: #f4f7ff;
    font-size: 14px;
    line-height: 1.6;
  }

  .side-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .mini-stat {
    min-height: 150px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .mini-stat-number {
    font-size: 32px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.03em;
    color: #ffffff;
    word-break: break-word;
  }

  .mini-stat-label {
    color: #e8eefc;
    font-size: 15px;
    font-weight: 700;
  }

  .mini-stat-side {
    color: #dbe7fb;
    font-size: 14px;
    font-weight: 700;
    opacity: 0.92;
    align-self: flex-end;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) 340px;
    gap: 20px;
  }

  .levels-panel,
  .insights-panel {
    padding: 22px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
  }

  .section-title {
    margin: 0;
    font-size: 22px;
    font-weight: 900;
    color: #ffffff;
  }

  .section-subtitle {
    margin: 6px 0 0 0;
    color: #d7e2f2;
    font-size: 14px;
    line-height: 1.5;
  }

  .mini-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    white-space: nowrap;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #eef2ff;
    font-size: 12px;
    font-weight: 700;
  }

  .pro-badge {
    min-height: 32px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    color: #d1fae5;
    background: rgba(34, 197, 94, 0.14);
    border: 1px solid rgba(134, 239, 172, 0.20);
  }

  .levels-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .level-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 18px;
    padding: 18px;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .level-card:hover {
    transform: translateY(-2px);
  }

  .level-card.completed {
    border-color: rgba(74, 222, 128, 0.24);
  }

  .level-card.current {
    border-color: rgba(96, 165, 250, 0.52);
    box-shadow: 0 0 22px rgba(96, 165, 250, 0.08);
  }

  .level-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .level-name {
    margin: 0;
    font-size: 22px;
    line-height: 1.1;
    color: #ffffff;
  }

  .level-badge {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.18);
    border: 1px solid rgba(147, 197, 253, 0.24);
    color: #dbeafe;
    font-size: 12px;
    font-weight: 900;
    white-space: nowrap;
  }

  .level-threshold,
  .level-next {
    margin: 0 0 8px 0;
    color: #dbe4f0;
    font-size: 14px;
    line-height: 1.6;
  }

  .level-status {
    margin-top: 12px;
    color: #99a8c7;
    font-size: 13px;
    line-height: 1.5;
  }

  .info-stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .info-card {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
  }

  .info-icon {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    box-shadow: 0 0 18px rgba(255,255,255,0.10);
  }

  .info-icon-cyan {
    background: radial-gradient(circle at 30% 30%, #67e8f9, #2563eb);
  }

  .info-icon-pink {
    background: radial-gradient(circle at 30% 30%, #f9a8d4, #a855f7);
  }

  .info-icon-gold {
    background: radial-gradient(circle at 30% 30%, #fde68a, #f59e0b);
  }

  .info-icon-green {
    background: radial-gradient(circle at 30% 30%, #86efac, #16a34a);
  }

  .info-copy {
    min-width: 0;
  }

  .info-main {
    color: #ffffff;
    font-size: 18px;
    font-weight: 900;
    line-height: 1.1;
    word-break: break-word;
  }

  .info-sub {
    color: #dbe7fb;
    font-size: 13px;
    margin-top: 4px;
  }

  .info-tag {
    color: #dbeafe;
    font-size: 12px;
    font-weight: 900;
    opacity: 0.9;
  }

  .loading-box,
  .error-box {
    padding: 22px;
  }

  .loading-box p {
    margin: 0;
    color: #e2e8f0;
    font-size: 15px;
  }

  .error-box {
    color: #fecaca;
    background: rgba(127, 29, 29, 0.24);
    border: 1px solid rgba(248, 113, 113, 0.28);
    border-radius: 20px;
  }

  .tone-basic {
    box-shadow: 0 16px 38px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .tone-bronze {
    border-color: rgba(180, 120, 70, 0.28);
  }

  .tone-silver {
    border-color: rgba(203, 213, 225, 0.26);
  }

  .tone-gold {
    border-color: rgba(250, 204, 21, 0.30);
  }

  .tone-platino {
    border-color: rgba(125, 211, 252, 0.28);
  }

  .tone-vip {
    border-color: rgba(216, 180, 254, 0.30);
  }

  .tone-elite {
    border-color: rgba(74, 222, 128, 0.28);
  }

  .tone-diamond {
    border-color: rgba(147, 197, 253, 0.34);
  }

  .tone-millionaire {
    border-color: rgba(253, 224, 71, 0.36);
    box-shadow:
      0 16px 38px rgba(0,0,0,0.28),
      0 0 24px rgba(253, 224, 71, 0.08),
      inset 0 1px 0 rgba(255,255,255,0.05);
  }

  @media (max-width: 1200px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 1024px) {
    .top-grid {
      grid-template-columns: 1fr;
    }

    .levels-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .membership-premium-hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-page-title {
      font-size: 34px;
    }

    .main-level-title {
      font-size: 26px;
    }

    .main-level-card,
    .levels-panel,
    .insights-panel,
    .mini-stat {
      padding: 16px;
    }

    .progress-shell {
      padding: 16px;
    }

    .progress-top {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .side-stats-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .level-top {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }
`;