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

  if (loading) {
    return (
      <div className="membership-page">
        <style>{membershipStyles}</style>

        <div className="membership-hero">
          <div>
            <div className="eyebrow">GUFO MEMBERSHIP SYSTEM</div>
            <h1 className="page-title">Membership GUFO</h1>
            <p className="page-subtitle">Caricamento membership...</p>
          </div>
        </div>

        <div className="loading-shell neon-card">
          <div className="loading-glow" />
          <p className="loading-text">Recupero progressi membership in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="membership-page">
        <style>{membershipStyles}</style>

        <div className="membership-hero">
          <div>
            <div className="eyebrow">GUFO MEMBERSHIP SYSTEM</div>
            <h1 className="page-title">Membership GUFO</h1>
            <p className="page-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="membership-page">
      <style>{membershipStyles}</style>

      <div className="membership-hero">
        <div>
          <div className="eyebrow">GUFO MEMBERSHIP SYSTEM</div>
          <h1 className="page-title">Membership GUFO</h1>
          <p className="page-subtitle">
            Controlla il tuo livello attuale e i progressi per salire di status
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Status Active
        </div>
      </div>

      <div className="top-grid">
        <div className="hero-card neon-card">
          <div className="card-orb orb-cyan" />
          <div className="card-orb orb-pink" />

          <div className="badge">{currentLevel}</div>
          <h2 className="hero-title">Livello attuale: {currentLevel}</h2>
          <p className="hero-text">
            Il tuo status si aggiorna in base alla spesa accumulata e al tuo
            utilizzo dell’ecosistema GUFO.
          </p>

          <div className="progress-block">
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
              <p className="progress-note">
                Hai raggiunto il livello massimo.
              </p>
            )}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card neon-card">
            <div className="stat-topline">Wallet</div>
            <div className="stat-label">Saldo GUFO</div>
            <div className="stat-value">{balanceGufo.toFixed(2)}</div>
          </div>

          <div className="stat-card neon-card">
            <div className="stat-topline">Season</div>
            <div className="stat-label">Spesa stagione</div>
            <div className="stat-value smaller-value">
              € {seasonSpent.toFixed(2)}
            </div>
          </div>

          <div className="stat-card neon-card">
            <div className="stat-topline">Rewards</div>
            <div className="stat-label">Cashback attuale</div>
            <div className="stat-value">{cashbackPercent}%</div>
          </div>

          <div className="stat-card neon-card">
            <div className="stat-topline">Activity</div>
            <div className="stat-label">Transazioni</div>
            <div className="stat-value">{transactions.length}</div>
          </div>
        </div>
      </div>

      <div className="panel neon-card">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Il tuo percorso Membership</h2>
            <p className="panel-subtitle">
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
                }`}
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
    </div>
  );
}

const membershipStyles = `
  * {
    box-sizing: border-box;
  }

  .membership-page {
    width: 100%;
    color: #ffffff;
    min-height: 100%;
    position: relative;
  }

  .membership-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.10), transparent 20%),
      radial-gradient(circle at 80% 18%, rgba(236, 72, 153, 0.10), transparent 22%),
      radial-gradient(circle at 18% 85%, rgba(34, 197, 94, 0.08), transparent 18%),
      radial-gradient(circle at 82% 80%, rgba(250, 204, 21, 0.08), transparent 18%);
    z-index: 0;
  }

  .membership-hero,
  .top-grid,
  .panel,
  .error-box,
  .loading-shell {
    position: relative;
    z-index: 1;
  }

  .membership-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 28px;
  }

  .eyebrow {
    display: inline-block;
    margin-bottom: 10px;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #dbeafe;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.04),
      0 0 18px rgba(56, 189, 248, 0.08);
  }

  .page-title {
    margin: 0 0 8px 0;
    font-size: 60px;
    font-weight: 900;
    line-height: 0.98;
    letter-spacing: -0.04em;
    color: #ffffff;
    text-shadow:
      0 0 18px rgba(56, 189, 248, 0.16),
      0 0 28px rgba(139, 92, 246, 0.10);
  }

  .page-subtitle {
    color: #b9c6e3;
    margin: 0;
    font-size: 16px;
    line-height: 1.6;
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

  .top-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
    align-items: stretch;
  }

  .neon-card {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    padding: 22px;
    background:
      linear-gradient(180deg, rgba(10, 16, 32, 0.82), rgba(15, 23, 42, 0.78));
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.30),
      0 0 22px rgba(56, 189, 248, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .neon-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 1.2px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.92),
      rgba(56, 189, 248, 0.92),
      rgba(34, 197, 94, 0.86),
      rgba(250, 204, 21, 0.86),
      rgba(168, 85, 247, 0.92)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.9;
  }

  .card-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(18px);
    pointer-events: none;
    opacity: 0.72;
  }

  .orb-cyan {
    top: -22px;
    right: -18px;
    width: 110px;
    height: 110px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.22), transparent 70%);
  }

  .orb-pink {
    bottom: -34px;
    left: -16px;
    width: 118px;
    height: 118px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.16), transparent 72%);
  }

  .hero-title,
  .hero-text,
  .progress-block,
  .badge,
  .stat-topline,
  .stat-label,
  .stat-value,
  .panel-title,
  .panel-subtitle,
  .levels-grid {
    position: relative;
    z-index: 1;
  }

  .badge {
    display: inline-block;
    margin-bottom: 16px;
    padding: 8px 14px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(244, 114, 182, 0.96),
      rgba(96, 165, 250, 0.96),
      rgba(74, 222, 128, 0.96),
      rgba(250, 204, 21, 0.96)
    );
    color: #111827;
    font-weight: 800;
    font-size: 14px;
    box-shadow:
      0 0 20px rgba(96, 165, 250, 0.12),
      0 0 28px rgba(236, 72, 153, 0.08);
  }

  .hero-title {
    font-size: 32px;
    margin: 0 0 12px 0;
    line-height: 1.15;
    color: #ffffff;
  }

  .hero-text {
    color: #b9c6e3;
    font-size: 16px;
    line-height: 1.7;
    margin: 0 0 22px 0;
  }

  .progress-block {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 18px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .stat-card {
    min-width: 0;
  }

  .stat-topline {
    margin-bottom: 10px;
    color: #9fb0d3;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .stat-label {
    color: #d8e2f4;
    margin-bottom: 12px;
    font-size: 14px;
  }

  .stat-value {
    font-size: 34px;
    font-weight: 900;
    line-height: 1.05;
    word-break: break-word;
    color: #ffffff;
  }

  .smaller-value {
    font-size: 30px;
  }

  .panel {
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    position: relative;
    z-index: 1;
  }

  .panel-title {
    margin: 0 0 6px 0;
    font-size: 28px;
    line-height: 1.05;
    color: #ffffff;
    font-weight: 800;
  }

  .panel-subtitle {
    margin: 0;
    color: #b9c6e3;
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

  .levels-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .level-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 18px;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .level-card.completed {
    border-color: rgba(74, 222, 128, 0.35);
  }

  .level-card.current {
    border-color: rgba(96, 165, 250, 0.7);
    background:
      linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
    box-shadow:
      0 0 20px rgba(96, 165, 250, 0.10),
      inset 0 1px 0 rgba(255,255,255,0.03);
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
    display: inline-block;
    padding: 6px 10px;
    border-radius: 999px;
    background: #3b82f6;
    color: white;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    box-shadow: 0 0 14px rgba(59, 130, 246, 0.18);
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

  .loading-shell {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 180px;
  }

  .loading-glow {
    position: absolute;
    width: 180px;
    height: 180px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%);
    filter: blur(20px);
    pointer-events: none;
  }

  .loading-text {
    position: relative;
    z-index: 1;
    margin: 0;
    font-size: 15px;
    color: #dbe4f0;
  }

  .error-box {
    border: 1px solid rgba(248, 113, 113, 0.3);
    background: rgba(239, 68, 68, 0.10);
    color: #fca5a5;
    padding: 16px 18px;
    border-radius: 18px;
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
    .membership-hero {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 22px;
    }

    .page-title {
      font-size: 40px;
    }

    .page-subtitle {
      font-size: 14px;
    }

    .neon-card {
      padding: 18px 14px;
      border-radius: 20px;
    }

    .neon-card::before {
      border-radius: 20px;
    }

    .hero-title {
      font-size: 26px;
    }

    .hero-text {
      font-size: 15px;
      margin-bottom: 18px;
    }

    .progress-block {
      padding: 16px;
      border-radius: 16px;
    }

    .progress-top {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 14px;
    }

    .stat-value {
      font-size: 28px;
    }

    .smaller-value {
      font-size: 26px;
    }

    .panel-header {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .panel-title {
      font-size: 22px;
      margin-bottom: 0;
    }

    .level-card {
      padding: 16px;
      border-radius: 16px;
    }

    .level-top {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .level-name {
      font-size: 20px;
    }
  }

  @media (max-width: 480px) {
    .page-title {
      font-size: 32px;
    }

    .hero-title {
      font-size: 22px;
    }

    .stat-value {
      font-size: 24px;
    }

    .smaller-value {
      font-size: 22px;
    }

    .level-name {
      font-size: 18px;
    }
  }
`;