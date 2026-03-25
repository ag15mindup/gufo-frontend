"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./wallet.module.css";
import { createClient } from "@/lib/supabase/client";
import { safeJsonFetch } from "@/lib/api";

const supabase = createClient();

type Transaction = any;

type WalletData = {
  balanceGufo: number;
  balanceEuro: number;
  seasonSpent: number;
  level: string;
  cashbackPercent: number;
  totalTransactions: number;
  totalGufoEarned: number;
  transactions: Transaction[];
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level?: string) {
  if (!level) return "Basic";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

function getTransactionAmount(tx: any) {
  return toNumberSafe(tx?.amount_euro ?? tx?.amount ?? tx?.importo);
}

function getTransactionGufo(tx: any) {
  return toNumberSafe(tx?.gufo_earned ?? tx?.gufo);
}

function getTransactionMerchant(tx: any) {
  return tx?.merchant_name ?? tx?.merchant ?? "Partner GUFO";
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletData>({
    balanceGufo: 0,
    balanceEuro: 0,
    seasonSpent: 0,
    level: "Basic",
    cashbackPercent: 2,
    totalTransactions: 0,
    totalGufoEarned: 0,
    transactions: [],
  });

  const [userName, setUserName] = useState("GUFO User");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Utente non autenticato");

        setUserName(user.email?.split("@")[0] || "GUFO User");
        setUserEmail(user.email || "");

        const [walletRes, txRes] = await Promise.all([
          safeJsonFetch(`${API_URL}/wallet/${user.id}`),
          safeJsonFetch(`${API_URL}/transactions/${user.id}`),
        ]);

        const wallet = walletRes.data || {};
        const transactions = txRes.data || [];

        const totalGufo = transactions.reduce(
          (sum: number, tx: any) => sum + getTransactionGufo(tx),
          0
        );

        setWalletData({
          balanceGufo: toNumberSafe(wallet.balance_gufo),
          balanceEuro: toNumberSafe(wallet.balance_eur),
          seasonSpent: toNumberSafe(wallet.season_spent),
          level: wallet.current_level || "Basic",
          cashbackPercent: toNumberSafe(wallet.cashback_percent),
          totalTransactions: transactions.length,
          totalGufoEarned: totalGufo,
          transactions,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const recentTransactions = useMemo(() => {
    return walletData.transactions.slice(0, 8);
  }, [walletData.transactions]);

  if (loading) {
    return <div className={styles.page}>Loading wallet...</div>;
  }

  if (error) {
    return <div className={styles.page}>Errore: {error}</div>;
  }

  return (
    <div className={styles.page}>
      
      {/* HERO */}
      <div className={styles.hero}>
        <div>
          <p className={styles.welcome}>Welcome back!</p>
          <h1 className={styles.userName}>{userName}</h1>
          <p className={styles.email}>{userEmail}</p>
        </div>

        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Balance</span>
          <h2 className={styles.balanceValue}>
            {walletData.balanceGufo.toFixed(2)} GUFO
          </h2>
        </div>
      </div>

      {/* STATS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {walletData.totalTransactions}
          </div>
          <div className={styles.statLabel}>Transactions</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {formatLevel(walletData.level)}
          </div>
          <div className={styles.statLabel}>Level</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {walletData.cashbackPercent}%
          </div>
          <div className={styles.statLabel}>Cashback</div>
        </div>
      </div>

      {/* GRID */}
      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Recent Transactions</h3>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Importo</th>
                  <th>GUFO</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx, i) => (
                  <tr key={i}>
                    <td>{getTransactionMerchant(tx)}</td>
                    <td>€ {getTransactionAmount(tx).toFixed(2)}</td>
                    <td>{getTransactionGufo(tx).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={styles.panel}>
          <h3>Wallet Info</h3>
          <p>GUFO: {walletData.totalGufoEarned}</p>
          <p>Season: € {walletData.seasonSpent}</p>
          <p>EUR: € {walletData.balanceEuro}</p>
        </aside>
      </div>
    </div>
  );
}