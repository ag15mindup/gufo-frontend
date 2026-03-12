"use client";

import { useEffect, useState } from "react";

type Transaction = {
  transaction_id?: string;
  id?: string;
  tipo?: string;
  type?: string;
  merchant_name?: string;
  benefit?: string;
  amount_euro?: number | string | null;
  amount?: number | string | null;
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

const USER_ID = "1f49b570-08ea-4151-9999-825fa0c77d6e";

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

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "Utente GUFO",
    email: "email@gufo.app",
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

        const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/profile/${USER_ID}`,
  {
    cache: "no-store",
  }
);

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

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
        const level = formatLevel(String(stats?.level ?? wallet?.current_level ?? "basic"));

        setProfileData({
          name: "Utente GUFO",
          email: "email@gufo.app",
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
      <main className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
        <h1 className="text-4xl font-bold mb-6">Il tuo profilo</h1>
        <div className="text-slate-300">Caricamento profilo...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
        <h1 className="text-4xl font-bold mb-6">Il tuo profilo</h1>
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 p-6 md:p-10 text-white">
      <h1 className="text-4xl font-bold mb-8">Il tuo profilo</h1>

      <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="rounded-3xl bg-slate-700/70 p-8 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-24 h-24 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center text-4xl mb-6">
            {profileData.name.charAt(0).toUpperCase()}
          </div>

          <h2 className="text-4xl font-bold text-center mb-2">{profileData.name}</h2>
          <p className="text-slate-200 mb-6">{profileData.email}</p>

          <span className="px-5 py-2 rounded-full bg-green-500 text-white font-semibold">
            {profileData.level}
          </span>
        </div>

        <div className="rounded-3xl bg-slate-700/70 p-8 shadow-sm">
          <h2 className="text-4xl font-bold mb-6">Riepilogo account</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div className="rounded-2xl bg-slate-400/30 p-6">
              <p className="text-2xl text-slate-100 mb-2">Saldo GUFO</p>
              <p className="text-5xl font-bold">{profileData.balanceGufo.toFixed(2)}</p>
            </div>

            <div className="rounded-2xl bg-slate-400/30 p-6">
              <p className="text-2xl text-slate-100 mb-2">Cashback</p>
              <p className="text-5xl font-bold">{profileData.cashbackPercent}%</p>
            </div>

            <div className="rounded-2xl bg-slate-400/30 p-6">
              <p className="text-2xl text-slate-100 mb-2">Spesa stagione</p>
              <p className="text-5xl font-bold">€ {profileData.totalSpent.toFixed(2)}</p>
            </div>

            <div className="rounded-2xl bg-slate-400/30 p-6">
              <p className="text-2xl text-slate-100 mb-2">Livello</p>
              <p className="text-5xl font-bold">{profileData.level}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-400/30 p-6">
            <h3 className="text-3xl font-bold mb-4">Transazioni recenti</h3>

            {profileData.transactions.length === 0 ? (
              <p className="text-slate-200">Nessuna transazione trovata.</p>
            ) : (
              <div className="space-y-3">
                {profileData.transactions.slice(0, 5).map((transaction, index) => (
                  <div
                    key={transaction.transaction_id ?? transaction.id ?? index}
                    className="flex items-center justify-between rounded-xl bg-slate-800/40 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold capitalize">
                        {getTransactionType(transaction)}
                      </p>
                      <p className="text-sm text-slate-300">
                        {getTransactionMerchant(transaction)}
                      </p>
                      <p className="text-sm text-slate-400">
                        {transaction.created_at
                          ? new Date(transaction.created_at).toLocaleString()
                          : ""}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-green-300">
                        €{getTransactionAmount(transaction).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-300">
                        GUFO {getTransactionGufo(transaction).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}