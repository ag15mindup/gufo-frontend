"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Transaction = {
  transaction_id?: string;
  id?: string;
  tipo?: string;
  type?: string;
  merchant_name?: string;
  benefit?: string;
  merchant?: string;
  amount_euro?: number | string | null;
  amount?: number | string | null;
  importo?: number | string | null;
  gufo?: number | string | null;
  gufo_earned?: number | string | null;
  cashback?: number | string | null;
  created_at?: string | null;
  raw?: unknown;
};

type ProfileData = {
  name: string;
  email: string;
  balanceGufo: number;
  totalSpent: number;
  cashbackPercent: number;
  level: string;
  transactions: Transaction[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Basic";

  const normalized = String(level).toLowerCase();

  if (normalized === "vip") return "VIP";
  if (normalized === "platino") return "Platino";
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

function getTransactionGufo(tx: any) {
  return toNumberSafe(
    tx?.gufo_earned ??
      tx?.gufo ??
      tx?.raw?.gufo_earned ??
      tx?.raw?.gufo
  );
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
  return tx?.type ?? tx?.tipo ?? tx?.raw?.type ?? tx?.raw?.tipo ?? "cashback";
}

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("it-IT");
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "Utente GUFO",
    email: "",
    balanceGufo: 0,
    totalSpent: 0,
    cashbackPercent: 2,
    level: "Basic",
    transactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
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
          `${API_URL}/profile/${user.id}`
        );

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || "Errore nel recupero profilo");
        }

        const profile = data?.profile ?? {};
        const wallet = data?.wallet ?? {};
        const stats = data?.stats ?? {};
        const rawTransactions: Transaction[] = Array.isArray(data?.transactions)
          ? data.transactions
          : [];

        const transactions = sortTransactions(
          rawTransactions.map((tx: any) => ({
            id: tx?.id ?? tx?.transaction_id ?? tx?.raw?.id,
            transaction_id: tx?.transaction_id ?? tx?.id,
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
            cashback: tx?.cashback ?? tx?.raw?.cashback,
            created_at: tx?.created_at ?? tx?.raw?.created_at,
            raw: tx?.raw ?? tx,
          }))
        );

        const totalSpent = toNumberSafe(
          stats?.season_spent ?? wallet?.season_spent ?? 0
        );

        const balanceGufo = toNumberSafe(
          stats?.balance_gufo ?? wallet?.balance_gufo ?? 0
        );

        const cashbackPercent = toNumberSafe(
          stats?.cashback_percent ?? wallet?.cashback_percent ?? 2
        );

        const level = formatLevel(
          String(stats?.level ?? wallet?.current_level ?? "basic")
        );

        const name =
          profile?.full_name ??
          profile?.name ??
          profile?.username ??
          user.email?.split("@")[0] ??
          "Utente GUFO";

        const email = profile?.email ?? user.email ?? "";

        if (!isMounted) return;

        setProfileData({
          name,
          email,
          balanceGufo,
          totalSpent,
          cashbackPercent,
          level,
          transactions,
        });
      } catch (err: unknown) {
        console.error("Errore caricamento profilo:", err);
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Errore recupero profilo");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="profile-page">
        <style>{profileStyles}</style>

        <div className="profile-hero">
          <div>
            <div className="eyebrow">GUFO PROFILE CENTER</div>
            <h1 className="page-title">Profilo</h1>
            <p className="page-subtitle">Caricamento profilo...</p>
          </div>
        </div>

        <div className="loading-shell neon-card">
          <div className="loading-glow" />
          <p className="loading-text">Recupero dati account in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <style>{profileStyles}</style>

        <div className="profile-hero">
          <div>
            <div className="eyebrow">GUFO PROFILE CENTER</div>
            <h1 className="page-title">Profilo</h1>
            <p className="page-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  const profileInitial = profileData.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="profile-page">
      <style>{profileStyles}</style>

      <div className="profile-hero">
        <div>
          <div className="eyebrow">GUFO PROFILE CENTER</div>
          <h1 className="page-title">Profilo</h1>
          <p className="page-subtitle">
            Panoramica account, livello, cashback e ultime attività
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Identity Active
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-card neon-card">
          <div className="card-orb orb-cyan" />
          <div className="card-orb orb-pink" />

          <div className="avatar">{profileInitial}</div>

          <div className="profile-kicker">Account utente</div>
          <h2 className="profile-name">{profileData.name}</h2>
          <p className="profile-email">{profileData.email}</p>

          <div className="profile-stats">
            <div className="profile-stat-row">
              <span>Livello</span>
              <strong>{profileData.level}</strong>
            </div>

            <div className="profile-stat-row">
              <span>Cashback</span>
              <strong>{profileData.cashbackPercent}%</strong>
            </div>

            <div className="profile-stat-row">
              <span>Saldo GUFO</span>
              <strong>{profileData.balanceGufo.toFixed(2)}</strong>
            </div>
          </div>

          <div className="level-pill">{profileData.level}</div>
        </div>

        <div className="content-area">
          <div className="panel neon-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Riepilogo account</h2>
                <p className="panel-subtitle">
                  Stato attuale del profilo e metriche principali
                </p>
              </div>

              <div className="mini-pill">Overview</div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-topline">Wallet</div>
                <div className="stat-label">Saldo GUFO</div>
                <div className="stat-value">
                  {profileData.balanceGufo.toFixed(2)}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-topline">Membership</div>
                <div className="stat-label">Cashback</div>
                <div className="stat-value">
                  {profileData.cashbackPercent}%
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-topline">Season</div>
                <div className="stat-label">Spesa stagione</div>
                <div className="stat-value smaller-value">
                  € {profileData.totalSpent.toFixed(2)}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-topline">Level</div>
                <div className="stat-label">Livello</div>
                <div className="stat-value">{profileData.level}</div>
              </div>
            </div>
          </div>

          <div className="panel neon-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Transazioni recenti</h2>
                <p className="panel-subtitle">
                  Ultimi movimenti associati al tuo profilo
                </p>
              </div>

              <div className="mini-pill">
                {Math.min(profileData.transactions.length, 5)} recenti
              </div>
            </div>

            {profileData.transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◎</div>
                <p className="empty-title">Nessuna transazione trovata</p>
                <p className="empty-text">
                  Le tue attività recenti compariranno qui appena inizierai a usare GUFO.
                </p>
              </div>
            ) : (
              <div className="transactions-list">
                {profileData.transactions.slice(0, 5).map((transaction, index) => (
                  <div
                    key={transaction.transaction_id ?? transaction.id ?? index}
                    className="transaction-card"
                  >
                    <div className="transaction-left">
                      <p className="transaction-type">
                        {getTransactionType(transaction)}
                      </p>
                      <p className="transaction-merchant">
                        {getTransactionMerchant(transaction)}
                      </p>
                      <p className="transaction-date">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>

                    <div className="transaction-right">
                      <p className="transaction-amount">
                        €{getTransactionAmount(transaction).toFixed(2)}
                      </p>
                      <p className="transaction-gufo">
                        GUFO {getTransactionGufo(transaction).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const profileStyles = `
  * {
    box-sizing: border-box;
  }

  .profile-page {
    width: 100%;
    min-height: 100%;
    color: #ffffff;
    position: relative;
  }

  .profile-page::before {
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

  .profile-hero,
  .profile-layout,
  .error-box,
  .loading-shell {
    position: relative;
    z-index: 1;
  }

  .profile-hero {
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
    margin: 0;
    color: #b9c6e3;
    font-size: 16px;
    line-height: 1.55;
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

  .profile-layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
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

  .profile-card {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 18px;
  }

  .avatar {
    width: 96px;
    height: 96px;
    border-radius: 26px;
    background: linear-gradient(
      135deg,
      #f472b6 0%,
      #60a5fa 35%,
      #4ade80 70%,
      #facc15 100%
    );
    color: #111827;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-weight: 900;
    margin-bottom: 4px;
    box-shadow:
      0 0 22px rgba(96, 165, 250, 0.18),
      0 0 30px rgba(236, 72, 153, 0.10);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .profile-kicker {
    position: relative;
    z-index: 1;
    color: #9fb0d3;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-top: -2px;
  }

  .profile-name {
    font-size: 34px;
    font-weight: 800;
    margin: 0;
    line-height: 1.05;
    word-break: break-word;
    color: #ffffff;
    position: relative;
    z-index: 1;
  }

  .profile-email {
    color: #b9c6e3;
    margin: 0;
    word-break: break-word;
    position: relative;
    z-index: 1;
  }

  .profile-stats {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    position: relative;
    z-index: 1;
    margin-top: 8px;
  }

  .profile-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: #dbe4f0;
    font-size: 14px;
  }

  .profile-stat-row strong {
    color: #ffffff;
  }

  .level-pill {
    margin-top: auto;
    min-height: 50px;
    width: 100%;
    border-radius: 999px;
    font-weight: 800;
    color: #111827;
    background: linear-gradient(
      90deg,
      rgba(244, 114, 182, 0.96),
      rgba(96, 165, 250, 0.96),
      rgba(74, 222, 128, 0.96),
      rgba(250, 204, 21, 0.96)
    );
    box-shadow:
      0 0 20px rgba(250, 204, 21, 0.12),
      0 0 30px rgba(56, 189, 248, 0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
  }

  .content-area {
    min-width: 0;
  }

  .panel {
    margin-bottom: 24px;
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
    position: relative;
    z-index: 1;
  }

  .panel-title {
    margin: 0 0 6px 0;
    font-size: 30px;
    line-height: 1.05;
    font-weight: 800;
    color: #ffffff;
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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
    position: relative;
    z-index: 1;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 18px;
    padding: 22px;
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
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
    font-size: 36px;
    font-weight: 800;
    line-height: 1.05;
    word-break: break-word;
    color: #ffffff;
  }

  .smaller-value {
    font-size: 30px;
  }

  .transactions-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    z-index: 1;
  }

  .transaction-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 16px;
  }

  .transaction-left,
  .transaction-right {
    min-width: 0;
  }

  .transaction-left {
    flex: 1;
  }

  .transaction-right {
    text-align: right;
    flex-shrink: 0;
  }

  .transaction-type {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 800;
    text-transform: capitalize;
    color: #ffffff;
  }

  .transaction-merchant {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: #b9c6e3;
    word-break: break-word;
  }

  .transaction-date {
    margin: 0;
    font-size: 13px;
    color: #99a8c7;
    word-break: break-word;
  }

  .transaction-amount {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 800;
    color: #bbf7d0;
  }

  .transaction-gufo {
    margin: 0;
    font-size: 13px;
    color: #dbe4f0;
  }

  .empty-state {
    position: relative;
    z-index: 1;
    border-radius: 24px;
    padding: 36px 20px;
    text-align: center;
    background:
      radial-gradient(circle at center, rgba(56, 189, 248, 0.06), transparent 38%),
      rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.12);
  }

  .empty-icon {
    font-size: 34px;
    margin-bottom: 12px;
    color: #dbe4f0;
  }

  .empty-title {
    margin: 0 0 8px 0;
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
  }

  .empty-text {
    margin: 0;
    color: #b9c6e3;
    font-size: 16px;
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
    .profile-layout {
      grid-template-columns: 1fr;
    }

    .profile-card {
      min-height: auto;
    }
  }

  @media (max-width: 768px) {
    .profile-hero {
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

    .avatar {
      width: 76px;
      height: 76px;
      border-radius: 22px;
      font-size: 30px;
    }

    .profile-name {
      font-size: 26px;
    }

    .panel-title {
      font-size: 22px;
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
      font-size: 30px;
    }

    .smaller-value {
      font-size: 26px;
    }

    .panel-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .transaction-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 14px;
    }

    .transaction-right {
      text-align: left;
      flex-shrink: 1;
    }

    .transaction-type {
      font-size: 15px;
    }

    .transaction-merchant,
    .transaction-date,
    .transaction-gufo {
      font-size: 13px;
    }

    .transaction-amount {
      font-size: 15px;
    }
  }

  @media (max-width: 480px) {
    .page-title {
      font-size: 32px;
    }

    .profile-name {
      font-size: 22px;
    }

    .stat-value {
      font-size: 26px;
    }

    .smaller-value {
      font-size: 22px;
    }

    .empty-title {
      font-size: 18px;
    }

    .empty-text {
      font-size: 14px;
    }
  }
`;