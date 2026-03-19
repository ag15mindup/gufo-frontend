"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase/client";

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
  raw?: any;
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

const API_URL = "https://gufo-backend1.onrender.com";

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
  return (
    tx?.type ??
    tx?.tipo ??
    tx?.raw?.type ??
    tx?.raw?.tipo ??
    "cashback"
  );
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
            transaction_id: tx?.transaction_id,
            type: getTransactionType(tx),
            tipo: tx?.tipo ?? tx?.raw?.tipo,
            merchant_name: getTransactionMerchant(tx),
            amount_euro: getTransactionAmount(tx),
            amount: getTransactionAmount(tx),
            gufo_earned: getTransactionGufo(tx),
            gufo: getTransactionGufo(tx),
            cashback: tx?.cashback ?? tx?.raw?.cashback,
            created_at: tx?.created_at ?? tx?.raw?.created_at,
            raw: tx?.raw ?? tx,
          }))
        );

        const totalSpent = toNumberSafe(stats?.season_spent);
        const balanceGufo = toNumberSafe(
          stats?.balance_gufo ?? wallet?.balance_gufo
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
        setError(err instanceof Error ? err.message : "Errore recupero profilo");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-page">
        <style>{profileStyles}</style>
        <h1 className="page-title">Il tuo profilo</h1>
        <p className="page-subtitle">Caricamento profilo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <style>{profileStyles}</style>
        <h1 className="page-title">Il tuo profilo</h1>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <style>{profileStyles}</style>

      <h1 className="page-title">Il tuo profilo</h1>
      <p className="page-subtitle">
        Panoramica account, livello e ultime attività.
      </p>

      <div className="profile-layout">
        <div className="profile-card">
          <div className="avatar">
            {profileData.name.charAt(0).toUpperCase()}
          </div>

          <h2 className="profile-name">{profileData.name}</h2>
          <p className="profile-email">{profileData.email}</p>

          <span className="level-badge">{profileData.level}</span>
        </div>

        <div className="content-area">
          <div className="panel">
            <h2 className="panel-title">Riepilogo account</h2>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Saldo GUFO</div>
                <div className="stat-value">
                  {profileData.balanceGufo.toFixed(2)}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Cashback</div>
                <div className="stat-value">
                  {profileData.cashbackPercent}%
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Spesa stagione</div>
                <div className="stat-value">
                  € {profileData.totalSpent.toFixed(2)}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-label">Livello</div>
                <div className="stat-value">{profileData.level}</div>
              </div>
            </div>
          </div>

          <div className="panel">
            <h2 className="panel-title">Transazioni recenti</h2>

            {profileData.transactions.length === 0 ? (
              <p className="empty-text">Nessuna transazione trovata.</p>
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

  .profile-layout {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  .profile-card {
    background: #1e293b;
    border-radius: 22px;
    padding: 28px 22px;
    min-height: 360px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: 1px solid rgba(148, 163, 184, 0.08);
  }

  .avatar {
    width: 96px;
    height: 96px;
    border-radius: 999px;
    background: #facc15;
    color: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    font-weight: 700;
    margin-bottom: 22px;
  }

  .profile-name {
    font-size: 34px;
    font-weight: 700;
    margin: 0 0 8px 0;
    line-height: 1.1;
    word-break: break-word;
  }

  .profile-email {
    color: #cbd5e1;
    margin: 0 0 18px 0;
    word-break: break-word;
  }

  .level-badge {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 999px;
    background: #22c55e;
    color: white;
    font-weight: 700;
    font-size: 14px;
  }

  .content-area {
    min-width: 0;
  }

  .panel {
    background: #1e293b;
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.08);
  }

  .panel-title {
    margin: 0 0 20px 0;
    font-size: 30px;
    line-height: 1.1;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
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
    font-size: 36px;
    font-weight: 700;
    line-height: 1.1;
    word-break: break-word;
  }

  .transactions-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .transaction-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 16px;
  }

  .transaction-left,
  .transaction-right {
    min-width: 0;
  }

  .transaction-right {
    text-align: right;
    flex-shrink: 0;
  }

  .transaction-type {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 700;
    text-transform: capitalize;
    color: white;
  }

  .transaction-merchant {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: #cbd5e1;
    word-break: break-word;
  }

  .transaction-date {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
    word-break: break-word;
  }

  .transaction-amount {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 700;
    color: #86efac;
  }

  .transaction-gufo {
    margin: 0;
    font-size: 13px;
    color: #cbd5e1;
  }

  .empty-text {
    margin: 0;
    color: #94a3b8;
  }

  .error-box {
    border: 1px solid rgba(248, 113, 113, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
    padding: 16px;
    border-radius: 16px;
  }

  @media (max-width: 1024px) {
    .profile-layout {
      grid-template-columns: 1fr;
    }

    .profile-card {
      min-height: auto;
      padding: 24px 20px;
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

    .profile-card {
      border-radius: 18px;
      padding: 22px 16px;
    }

    .avatar {
      width: 76px;
      height: 76px;
      font-size: 30px;
      margin-bottom: 16px;
    }

    .profile-name {
      font-size: 26px;
    }

    .panel {
      padding: 18px 14px;
      border-radius: 16px;
      margin-bottom: 18px;
    }

    .panel-title {
      font-size: 22px;
      margin-bottom: 16px;
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
      font-size: 28px;
    }

    .profile-name {
      font-size: 22px;
    }

    .stat-value {
      font-size: 26px;
    }
  }
`;