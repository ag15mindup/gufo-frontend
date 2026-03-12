"use client";

import { useEffect, useState } from "react";

type Transaction = {
  transaction_id?: string;
  id?: string;
  tipo?: string;
  type?: string;
  merchant_name?: string;
  benefit?: string;
  amount?: number | string | null;
  amount_euro?: number | string | null;
  gufo?: number | string | null;
  gufo_earned?: number | string | null;
  cashback?: number | string | null;
  created_at?: string | null;
  raw?: any;
};

type WalletData = {
  balanceGufo: number;
  balanceEuro: number;
  totalTransactions: number;
  totalSpent: number;
  totalGufoEarned: number;
  level: string;
  cashbackPercent: number;
  nextLevel: string;
  nextLevelTarget: number;
  progressPercent: number;
  missingToNextLevel: number;
  transactions: Transaction[];
};

const USER_ID = "1f49b570-08ea-4151-9999-825fa0c77d6e";

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return fallback;
}

function getTransactionAmount(transaction: Transaction): number {
  return toNumber(
    transaction.amount_euro ??
      transaction.amount ??
      transaction.raw?.amount_euro ??
      transaction.raw?.amount,
    0
  );
}

function getTransactionGufo(transaction: Transaction): number {
  return toNumber(
    transaction.gufo_earned ??
      transaction.gufo ??
      transaction.raw?.gufo_earned ??
      transaction.raw?.gufo ??
      transaction.cashback,
    0
  );
}

function getTransactionType(transaction: Transaction): string {
  return String(
    transaction.type ??
      transaction.tipo ??
      transaction.raw?.type ??
      transaction.raw?.tipo ??
      "Cashback"
  );
}

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    const da = a.created_at ? new Date(a.created_at).getTime() : 0;
    const db = b.created_at ? new Date(b.created_at).getTime() : 0;
    return db - da;
  });
}

function getLevelFromSpent(totalSpent: number): string {
  if (totalSpent >= 50000) return "Millionaire";
  if (totalSpent >= 10000) return "Elite";
  if (totalSpent >= 5000) return "VIP";
  if (totalSpent >= 2500) return "Platinum";
  if (totalSpent >= 1000) return "Gold";
  if (totalSpent >= 500) return "Silver";
  if (totalSpent >= 100) return "Bronze";
  return "Basic";
}

function getCashbackFromLevel(level: string): number {
  switch (level) {
    case "Bronze":
      return 3;
    case "Silver":
      return 4;
    case "Gold":
      return 5;
    case "Platinum":
      return 6;
    case "VIP":
      return 7;
    case "Elite":
      return 8;
    case "Millionaire":
      return 10;
    case "Basic":
    default:
      return 2;
  }
}

function getNextLevelInfo(totalSpent: number) {
  if (totalSpent < 100) return { nextLevel: "Bronze", target: 100 };
  if (totalSpent < 500) return { nextLevel: "Silver", target: 500 };
  if (totalSpent < 1000) return { nextLevel: "Gold", target: 1000 };
  if (totalSpent < 2500) return { nextLevel: "Platinum", target: 2500 };
  if (totalSpent < 5000) return { nextLevel: "VIP", target: 5000 };
  if (totalSpent < 10000) return { nextLevel: "Elite", target: 10000 };
  if (totalSpent < 50000) return { nextLevel: "Millionaire", target: 50000 };
  return { nextLevel: "Massimo livello", target: 50000 };
}

function getPreviousTarget(level: string): number {
  switch (level) {
    case "Bronze":
      return 0;
    case "Silver":
      return 100;
    case "Gold":
      return 500;
    case "Platinum":
      return 1000;
    case "VIP":
      return 2500;
    case "Elite":
      return 5000;
    case "Millionaire":
      return 10000;
    case "Basic":
    default:
      return 0;
  }
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData>({
    balanceGufo: 0,
    balanceEuro: 0,
    totalTransactions: 0,
    totalSpent: 0,
    totalGufoEarned: 0,
    level: "Basic",
    cashbackPercent: 2,
    nextLevel: "Bronze",
    nextLevelTarget: 100,
    progressPercent: 0,
    missingToNextLevel: 100,
    transactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWallet() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/${USER_ID}`, {
  cache: "no-store",
});

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || "Errore nel recupero wallet");
        }

        const dashboard = data?.dashboard ?? data ?? {};
        const profile = dashboard?.profile ?? {};
        const wallet = profile?.wallet ?? dashboard?.wallet ?? {};
        const stats = profile?.stats ?? dashboard?.stats ?? {};
        const membership = profile?.membership ?? dashboard?.membership ?? {};

        const rawTransactions: Transaction[] = Array.isArray(dashboard?.transactions)
          ? dashboard.transactions
          : Array.isArray(profile?.transactions)
          ? profile.transactions
          : Array.isArray(data?.transactions)
          ? data.transactions
          : [];

        const transactions = sortTransactions(rawTransactions);

        const totalSpent = toNumber(
          membership?.total_spent ??
            stats?.total_spent ??
            stats?.totalSpent,
          transactions.reduce((sum, tx) => sum + getTransactionAmount(tx), 0)
        );

        const totalTransactions = toNumber(
          stats?.total_transactions ?? stats?.totalTransactions,
          transactions.length
        );

        const balanceGufo = toNumber(
          wallet?.balance_gufo ??
            profile?.gufo_balance ??
            profile?.gufoBalance,
          0
        );

        const balanceEuro = toNumber(
          membership?.euroBalance ??
            wallet?.balance_eur ??
            wallet?.balance_euro ??
            profile?.euro_balance,
          0
        );

        const totalGufoEarned = toNumber(
          stats?.gufo_earned ??
            stats?.totalGufoEarned ??
            profile?.gufo_balance,
          transactions.reduce((sum, tx) => sum + getTransactionGufo(tx), 0)
        );

        const backendLevel =
          membership?.membershipLevel ||
          membership?.level_name ||
          membership?.level ||
          profile?.level_name ||
          profile?.level ||
          "";

        const computedLevel = getLevelFromSpent(totalSpent);
        const level =
          backendLevel &&
          !["Basic", "basic", "Orc"].includes(String(backendLevel))
            ? String(backendLevel)
            : computedLevel;

        const cashbackPercent = toNumber(
          membership?.cashbackPercent ?? membership?.cashback_percent,
          getCashbackFromLevel(level)
        );

        const { nextLevel, target } = getNextLevelInfo(totalSpent);
        const previousTarget = getPreviousTarget(level);

        const progressPercent =
          nextLevel === "Massimo livello"
            ? 100
            : target > previousTarget
            ? Math.min(
                100,
                Math.max(
                  0,
                  ((totalSpent - previousTarget) / (target - previousTarget)) * 100
                )
              )
            : 100;

        const missingToNextLevel =
          nextLevel === "Massimo livello" ? 0 : Math.max(0, target - totalSpent);

        setWalletData({
          balanceGufo,
          balanceEuro,
          totalTransactions,
          totalSpent,
          totalGufoEarned,
          level,
          cashbackPercent,
          nextLevel,
          nextLevelTarget: target,
          progressPercent,
          missingToNextLevel,
          transactions,
        });
      } catch (err: unknown) {
        console.error("Errore caricamento wallet:", err);
        setError(err instanceof Error ? err.message : "Errore recupero wallet");
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-white p-6 md:p-10">
        <h1 className="text-4xl font-bold text-black mb-6">Wallet GUFO</h1>
        <div className="text-gray-500">Caricamento wallet...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white p-6 md:p-10">
        <h1 className="text-4xl font-bold text-black mb-6">Wallet GUFO</h1>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6 md:p-10">
      <h1 className="text-4xl font-bold text-black mb-8">Wallet GUFO</h1>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-3xl p-6 text-white bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-sm min-h-[180px] flex flex-col justify-between">
          <div className="text-sm text-white/80">Saldo disponibile</div>
          <div className="text-5xl font-bold">{walletData.balanceGufo.toFixed(2)} GUFO</div>
          <div className="text-sm text-white/80">
            Saldo EUR: €{walletData.balanceEuro.toFixed(2)}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Statistiche</h2>
          <div className="space-y-4 text-gray-700">
            <p>Totale transazioni: {walletData.totalTransactions}</p>
            <p>Totale speso: €{walletData.totalSpent.toFixed(2)}</p>
            <p>GUFO guadagnati: {walletData.totalGufoEarned.toFixed(2)}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Livello</h2>
          <div className="text-5xl font-bold text-black mb-3">{walletData.level}</div>
          <p className="text-gray-600 mb-1">Prossimo livello: {walletData.nextLevel}</p>
          <p className="text-gray-600 mb-1">
            Cashback corrente: {walletData.cashbackPercent}%
          </p>

          {walletData.nextLevel === "Massimo livello" ? (
            <p className="text-gray-600 mb-3">Hai raggiunto il livello massimo.</p>
          ) : (
            <>
              <p className="text-gray-600 mb-1">
                Spesa attuale: €{walletData.totalSpent.toFixed(2)} / Obiettivo: €
                {walletData.nextLevelTarget.toFixed(2)}
              </p>
              <p className="text-gray-600 mb-3">
                Ti mancano €{walletData.missingToNextLevel.toFixed(2)} per salire di livello
              </p>
            </>
          )}

          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-3 bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${walletData.progressPercent}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 mt-2">
            Progresso: {Math.round(walletData.progressPercent)}%
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Ultime transazioni
        </h2>

        {walletData.transactions.length === 0 ? (
          <div className="text-gray-500">Nessuna transazione disponibile</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-4 pr-4 text-gray-700 font-semibold">Tipo</th>
                  <th className="py-4 pr-4 text-gray-700 font-semibold">Importo</th>
                  <th className="py-4 pr-4 text-gray-700 font-semibold">GUFO</th>
                </tr>
              </thead>
              <tbody>
                {walletData.transactions.slice(0, 10).map((transaction, index) => (
                  <tr
                    key={transaction.transaction_id ?? transaction.id ?? index}
                    className="border-b border-gray-100"
                  >
                    <td className="py-4 pr-4 text-gray-800">
                      {getTransactionType(transaction)}
                    </td>
                    <td className="py-4 pr-4 font-semibold text-green-700">
                      €{getTransactionAmount(transaction).toFixed(2)}
                    </td>
                    <td className="py-4 pr-4 text-gray-800">
                      {getTransactionGufo(transaction).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}