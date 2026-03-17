"use client";

import { useEffect, useMemo, useState } from "react";

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
  raw?: any;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const USER_ID = "1f49b570-08ea-4151-9999-825fa0c77d6e";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Basic";

  const normalized = String(level).toLowerCase().trim();

  if (normalized === "vip") return "VIP";
  if (normalized === "platino" || normalized === "platinum") return "Platino";
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

async function safeJsonFetch(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `L'API non ha restituito JSON. Controlla NEXT_PUBLIC_API_URL: ${API_URL}`
    );
  }

  const data = text ? JSON.parse(text) : {};
  return { response, data };
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
      { name: "Elite", min: 10000, next: 50000 },
      { name: "Millionaire", min: 50000, next: null },
    ],
    []
  );

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError("");

        const { response, data } = await safeJsonFetch(
          `${API_URL}/dashboard/${USER_ID}`
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

        setWallet(walletData);
        setTransactions(txs);
        setCashbackPercent(
          toNumberSafe(
            stats?.cashback_percent ?? walletData?.cashback_percent ?? 2
          )
        );
      } catch (err: any) {
        setError(err?.message || "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
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
        <h1 className="page-title">Membership GUFO</h1>
        <p className="page-subtitle">Caricamento membership...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="membership-page">
        <style>{membershipStyles}</style>
        <h1 className="page-title">Membership GUFO</h1>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="membership-page">
      <style>{membershipStyles}</style>

      <h1 className="page-title">Membership GUFO</h1>
      <p className="page-subtitle">
        Controlla il tuo livello attuale e i progressi per salire di status.
      </p>

      <div className="top-grid">
        <div className="hero-card">
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
          <div className="stat-card">
            <div className="stat-label">Saldo GUFO</div>
            <div className="stat-value">{balanceGufo.toFixed(2)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Spesa stagione</div>
            <div className="stat-value">€ {seasonSpent.toFixed(2)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Cashback attuale</div>
            <div className="stat-value">{cashbackPercent}%</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Transazioni</div>
            <div className="stat-value">{transactions.length}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Il tuo percorso Membership</h2>

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
    color: white;
    width: 100%;
  }

  .page-title {
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 10px 0;
    line-height: 1.1;
  }

  .page-subtitle {
    color: #cbd5e1;
    margin: 0 0 30px 0;
    font-size: 16px;
  }

  .top-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
    align-items: stretch;
  }

  .hero-card {
    background: #1e293b;
    border-radius: 20px;
    padding: 24px;
    border: 1px solid rgba(148, 163, 184, 0.08);
  }

  .badge {
    display: inline-block;
    margin-bottom: 16px;
    padding: 8px 14px;
    border-radius: 999px;
    background: #22c55e;
    color: white;
    font-weight: 700;
    font-size: 14px;
  }

  .hero-title {
    font-size: 32px;
    margin: 0 0 12px 0;
    line-height: 1.15;
  }

  .hero-text {
    color: #cbd5e1;
    font-size: 16px;
    line-height: 1.7;
    margin: 0 0 22px 0;
  }

  .progress-block {
    background: #0f172a;
    border-radius: 16px;
    padding: 18px;
    border: 1px solid #334155;
  }

  .progress-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    color: #cbd5e1;
    margin-bottom: 10px;
  }

  .progress-bar {
    width: 100%;
    height: 12px;
    border-radius: 999px;
    background: #334155;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #3b82f6 0%, #22c55e 100%);
  }

  .progress-note {
    margin: 0;
    color: #e2e8f0;
    font-size: 14px;
    line-height: 1.6;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .stat-card {
    background: #334155;
    border-radius: 18px;
    padding: 22px;
    min-width: 0;
  }

  .stat-label {
    color: #e2e8f0;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .stat-value {
    font-size: 34px;
    font-weight: 700;
    line-height: 1.1;
    word-break: break-word;
  }

  .panel {
    background: #1e293b;
    border-radius: 20px;
    padding: 24px;
    overflow: hidden;
  }

  .panel-title {
    margin: 0 0 20px 0;
    font-size: 28px;
    line-height: 1.1;
  }

  .levels-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .level-card {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 18px;
    padding: 18px;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .level-card.completed {
    border-color: rgba(34, 197, 94, 0.35);
  }

  .level-card.current {
    border-color: #3b82f6;
    background: linear-gradient(180deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%);
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
  }

  .level-badge {
    display: inline-block;
    padding: 6px 10px;
    border-radius: 999px;
    background: #3b82f6;
    color: white;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .level-threshold,
  .level-next {
    margin: 0 0 8px 0;
    color: #cbd5e1;
    font-size: 14px;
    line-height: 1.6;
  }

  .level-status {
    margin-top: 12px;
    color: #94a3b8;
    font-size: 13px;
    line-height: 1.5;
  }

  .error-box {
    border: 1px solid rgba(248, 113, 113, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
    padding: 16px;
    border-radius: 16px;
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
    .page-title {
      font-size: 32px;
    }

    .page-subtitle {
      font-size: 14px;
      margin-bottom: 22px;
    }

    .hero-card {
      padding: 18px 16px;
      border-radius: 16px;
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
      border-radius: 14px;
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

    .stat-card {
      padding: 18px;
      border-radius: 16px;
    }

    .stat-value {
      font-size: 28px;
    }

    .panel {
      padding: 18px 14px;
      border-radius: 16px;
    }

    .panel-title {
      font-size: 22px;
      margin-bottom: 16px;
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
      font-size: 28px;
    }

    .hero-title {
      font-size: 22px;
    }

    .stat-value {
      font-size: 24px;
    }

    .level-name {
      font-size: 18px;
    }
  }
`;