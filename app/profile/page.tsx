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

  return date.toLocaleDateString("it-IT");
}

function getTypeClass(type: string) {
  const normalized = String(type).toLowerCase();

  if (normalized.includes("cashback")) return "type-pill type-cashback";
  if (normalized.includes("bonus")) return "type-pill type-bonus";
  if (normalized.includes("payment")) return "type-pill type-payment";
  if (normalized.includes("withdraw")) return "type-pill type-withdraw";

  return "type-pill";
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
      <div className="profile-premium-page">
        <style>{profileStyles}</style>

        <div className="hero-line" />

        <div className="profile-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO PROFILE</div>
            <h1 className="hero-page-title">Profilo</h1>
            <p className="hero-page-subtitle">
              Caricamento dati account in corso...
            </p>
          </div>
        </div>

        <div className="loading-box premium-card">
          <p>Recupero profilo premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-premium-page">
        <style>{profileStyles}</style>

        <div className="hero-line" />

        <div className="profile-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO PROFILE</div>
            <h1 className="hero-page-title">Profilo</h1>
            <p className="hero-page-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  const profileInitial = profileData.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="profile-premium-page">
      <style>{profileStyles}</style>

      <div className="hero-line" />

      <div className="profile-premium-hero">
        <div>
          <div className="hero-eyebrow">GUFO PROFILE</div>
          <h1 className="hero-page-title">Profilo</h1>
          <p className="hero-page-subtitle">
            Panoramica account, livello, cashback e ultime attività
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Identity Active
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-main-card premium-card">
          <div className="avatar">{profileInitial}</div>

          <div className="profile-kicker">Account utente</div>
          <h2 className="profile-name">{profileData.name}</h2>
          <p className="profile-email">{profileData.email}</p>

          <div className="profile-meta-grid">
            <div className="meta-box">
              <span className="meta-label">Livello</span>
              <strong className="meta-value">{profileData.level}</strong>
            </div>

            <div className="meta-box">
              <span className="meta-label">Cashback</span>
              <strong className="meta-value">{profileData.cashbackPercent}%</strong>
            </div>

            <div className="meta-box">
              <span className="meta-label">Saldo GUFO</span>
              <strong className="meta-value">{profileData.balanceGufo.toFixed(2)}</strong>
            </div>

            <div className="meta-box">
              <span className="meta-label">Spesa stagione</span>
              <strong className="meta-value">€ {profileData.totalSpent.toFixed(2)}</strong>
            </div>
          </div>

          <div className="level-pill">{profileData.level}</div>
        </div>

        <div className="profile-content">
          <div className="stats-row">
            <div className="mini-stat premium-card">
              <div className="mini-stat-number">{profileData.balanceGufo.toFixed(2)}</div>
              <div className="mini-stat-label">Saldo GUFO</div>
              <div className="mini-stat-side">Wallet</div>
            </div>

            <div className="mini-stat premium-card">
              <div className="mini-stat-number">{profileData.cashbackPercent}%</div>
              <div className="mini-stat-label">Cashback attuale</div>
              <div className="mini-stat-side">Reward</div>
            </div>

            <div className="mini-stat premium-card">
              <div className="mini-stat-number">€ {profileData.totalSpent.toFixed(2)}</div>
              <div className="mini-stat-label">Spesa stagione</div>
              <div className="mini-stat-side">Season</div>
            </div>
          </div>

          <div className="content-grid">
            <div className="left-column premium-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Transazioni recenti</h2>
                  <p className="section-subtitle">
                    Ultimi movimenti associati al tuo profilo
                  </p>
                </div>

                <div className="mini-pill">
                  {Math.min(profileData.transactions.length, 5)} recenti
                </div>
              </div>

              {profileData.transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-title">Nessuna transazione trovata</div>
                  <div className="empty-text">
                    Le tue attività recenti compariranno qui appena inizierai a usare GUFO.
                  </div>
                </div>
              ) : (
                <>
                  <div className="desktop-only">
                    <div className="transactions-table-wrap">
                      <table className="transactions-table">
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Merchant</th>
                            <th>Importo</th>
                            <th>GUFO</th>
                            <th>Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profileData.transactions.slice(0, 5).map((transaction, index) => (
                            <tr
                              key={transaction.transaction_id ?? transaction.id ?? index}
                            >
                              <td>
                                <span className={getTypeClass(getTransactionType(transaction))}>
                                  {getTransactionType(transaction)}
                                </span>
                              </td>
                              <td>{getTransactionMerchant(transaction)}</td>
                              <td className="amount-cell">
                                € {getTransactionAmount(transaction).toFixed(2)}
                              </td>
                              <td>{getTransactionGufo(transaction).toFixed(2)}</td>
                              <td>{formatDate(transaction.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mobile-only mobile-list">
                    {profileData.transactions.slice(0, 5).map((transaction, index) => (
                      <div
                        key={transaction.transaction_id ?? transaction.id ?? index}
                        className="mobile-tx-card"
                      >
                        <div className="mobile-tx-top">
                          <strong>{getTransactionMerchant(transaction)}</strong>
                          <span className={getTypeClass(getTransactionType(transaction))}>
                            {getTransactionType(transaction)}
                          </span>
                        </div>

                        <div className="mobile-tx-row">
                          <span>Importo</span>
                          <span className="amount-cell">
                            € {getTransactionAmount(transaction).toFixed(2)}
                          </span>
                        </div>

                        <div className="mobile-tx-row">
                          <span>GUFO</span>
                          <span>{getTransactionGufo(transaction).toFixed(2)}</span>
                        </div>

                        <div className="mobile-tx-row">
                          <span>Data</span>
                          <span>{formatDate(transaction.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="right-column premium-card">
              <div className="section-header">
                <h2 className="section-title">Top Info</h2>
                <span className="pro-badge">PRO</span>
              </div>

              <div className="info-stack">
                <div className="info-card">
                  <div className="info-icon info-icon-pink" />
                  <div className="info-copy">
                    <div className="info-main">{profileData.name}</div>
                    <div className="info-sub">Profilo attivo</div>
                  </div>
                  <div className="info-tag">{profileData.level.toUpperCase()}</div>
                </div>

                <div className="info-card">
                  <div className="info-icon info-icon-cyan" />
                  <div className="info-copy">
                    <div className="info-main">€ {profileData.totalSpent.toFixed(2)}</div>
                    <div className="info-sub">Spesa totale stagione</div>
                  </div>
                  <div className="info-tag">TOT</div>
                </div>

                <div className="info-card">
                  <div className="info-icon info-icon-gold" />
                  <div className="info-copy">
                    <div className="info-main">{profileData.balanceGufo.toFixed(2)}</div>
                    <div className="info-sub">GUFO disponibili</div>
                  </div>
                  <div className="info-tag">BAL</div>
                </div>

                <div className="info-card">
                  <div className="info-icon info-icon-green" />
                  <div className="info-copy">
                    <div className="info-main">{profileData.transactions.length}</div>
                    <div className="info-sub">Movimenti registrati</div>
                  </div>
                  <div className="info-tag">LOG</div>
                </div>
              </div>
            </div>
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

  .profile-premium-page {
    position: relative;
    min-height: 100%;
    color: #ffffff;
  }

  .profile-premium-page::before {
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

  .profile-premium-page > * {
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

  .profile-premium-hero {
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

  .profile-layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .profile-main-card {
    padding: 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: sticky;
    top: 20px;
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
    margin: 0 auto 4px auto;
    box-shadow:
      0 0 22px rgba(96, 165, 250, 0.18),
      0 0 30px rgba(236, 72, 153, 0.10);
    flex-shrink: 0;
  }

  .profile-kicker {
    color: #9fb0d3;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .profile-name {
    font-size: 30px;
    font-weight: 900;
    margin: 0;
    line-height: 1.05;
    word-break: break-word;
    color: #ffffff;
  }

  .profile-email {
    color: #b9c6e3;
    margin: 0;
    word-break: break-word;
    font-size: 14px;
  }

  .profile-meta-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 4px;
  }

  .meta-box {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 18px;
    padding: 14px;
    text-align: left;
  }

  .meta-label {
    display: block;
    color: #b9c6e3;
    font-size: 12px;
    margin-bottom: 6px;
  }

  .meta-value {
    color: #ffffff;
    font-size: 18px;
    font-weight: 900;
    word-break: break-word;
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
  }

  .profile-content {
    min-width: 0;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 20px;
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

  .left-column,
  .right-column {
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

  .transactions-table-wrap {
    width: 100%;
    overflow-x: auto;
  }

  .transactions-table {
    width: 100%;
    border-collapse: collapse;
  }

  .transactions-table th {
    text-align: left;
    padding: 12px 0;
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 700;
    border-bottom: 1px solid rgba(255,255,255,0.12);
  }

  .transactions-table td {
    padding: 16px 0;
    color: #ffffff;
    font-size: 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    vertical-align: middle;
  }

  .type-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.10);
    color: #eaf2ff;
    font-size: 12px;
    font-weight: 700;
  }

  .type-cashback {
    background: rgba(34, 197, 94, 0.14);
    border-color: rgba(134, 239, 172, 0.22);
    color: #dcfce7;
  }

  .type-bonus {
    background: rgba(168, 85, 247, 0.16);
    border-color: rgba(216, 180, 254, 0.22);
    color: #f3e8ff;
  }

  .type-payment {
    background: rgba(59, 130, 246, 0.16);
    border-color: rgba(147, 197, 253, 0.22);
    color: #dbeafe;
  }

  .type-withdraw {
    background: rgba(251, 146, 60, 0.16);
    border-color: rgba(253, 186, 116, 0.24);
    color: #ffedd5;
  }

  .amount-cell {
    color: #d1fae5;
    font-weight: 800;
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

  .info-icon-pink {
    background: radial-gradient(circle at 30% 30%, #f9a8d4, #a855f7);
  }

  .info-icon-cyan {
    background: radial-gradient(circle at 30% 30%, #67e8f9, #2563eb);
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

  .empty-state {
    padding: 28px 12px 10px 0;
  }

  .empty-title {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    margin-bottom: 8px;
  }

  .empty-text {
    color: #dbe7fb;
    font-size: 14px;
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

  .desktop-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }

  .mobile-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mobile-tx-card {
    padding: 14px;
    border-radius: 18px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.10);
  }

  .mobile-tx-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .mobile-tx-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 0;
    color: #e2e8f0;
    font-size: 13px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }

  .mobile-tx-row:last-child {
    border-bottom: none;
  }

  @media (max-width: 1200px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 1024px) {
    .profile-layout {
      grid-template-columns: 1fr;
    }

    .profile-main-card {
      position: static;
    }
  }

  @media (max-width: 980px) {
    .stats-row {
      grid-template-columns: 1fr;
    }

    .hero-page-title {
      font-size: 42px;
    }
  }

  @media (max-width: 768px) {
    .profile-premium-hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-page-title {
      font-size: 34px;
    }

    .profile-main-card,
    .left-column,
    .right-column,
    .mini-stat {
      padding: 16px;
    }

    .avatar {
      width: 76px;
      height: 76px;
      border-radius: 22px;
      font-size: 30px;
    }

    .profile-name {
      font-size: 24px;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .desktop-only {
      display: none;
    }

    .mobile-only {
      display: block;
    }
  }
`;