"use client";

import { useEffect, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./wallet.module.css";

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
  lastSeasonReset: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("it-IT");
}

function getTransactionAmount(tx: any) {
  return toNumberSafe(
    tx?.amount_euro ?? tx?.amount ?? tx?.importo ?? tx?.raw?.amount_euro
  );
}

function getTransactionMerchant(tx: any) {
  return (
    tx?.merchant_name ??
    tx?.benefit ??
    tx?.merchant ??
    tx?.raw?.merchant_name ??
    "-"
  );
}

function getTransactionGufo(tx: any) {
  return toNumberSafe(tx?.gufo_earned ?? tx?.gufo ?? tx?.raw?.gufo);
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
    lastSeasonReset: "",
  });

  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("GUFO User");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("Utente non autenticato");

        setUserEmail(user.email || "");
        setUserName(user.email?.split("@")[0] || "GUFO User");

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
          lastSeasonReset: wallet.last_season_reset || "",
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className={styles.page}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.page}>Errore: {error}</div>;
  }

  return (
    <div className={styles.page}>
      
      {/* HERO */}
      <div className={styles.hero}>
        <div>
          <h1 className={styles.title}>{userName}</h1>
          <p className={styles.subtitle}>{userEmail}</p>
        </div>

        <div className={`${styles.card} ${styles.balance}`}>
          <span>Balance</span>
          <h2>{walletData.balanceGufo.toFixed(2)} GUFO</h2>
        </div>
      </div>

      {/* STATS */}
      <div className={styles.stats}>
        <div className={styles.card}>
          <h3>{walletData.totalTransactions}</h3>
          <p>Transactions</p>
        </div>

        <div className={styles.card}>
          <h3>{walletData.level}</h3>
          <p>Level</p>
        </div>

        <div className={styles.card}>
          <h3>{walletData.cashbackPercent}%</h3>
          <p>Cashback</p>
        </div>
      </div>

      {/* GRID */}
      <div className={styles.grid}>
        
        {/* DESKTOP TABLE */}
        <div className={`${styles.card} ${styles.desktop}`}>
          <h2>Transactions</h2>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Partner</th>
                <th>Data</th>
                <th>Importo</th>
                <th>GUFO</th>
              </tr>
            </thead>
            <tbody>
              {walletData.transactions.slice(0, 8).map((tx, i) => (
                <tr key={i}>
                  <td>{getTransactionMerchant(tx)}</td>
                  <td>{formatDate(tx.created_at)}</td>
                  <td>€ {getTransactionAmount(tx).toFixed(2)}</td>
                  <td>{getTransactionGufo(tx).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className={`${styles.card} ${styles.mobile}`}>
          <h2>Transactions</h2>

          {walletData.transactions.slice(0, 8).map((tx, i) => (
            <div key={i} className={styles.txCard}>
              <div className={styles.txTop}>
                <strong>{getTransactionMerchant(tx)}</strong>
                <span>{getTransactionGufo(tx).toFixed(2)} GUFO</span>
              </div>

              <div className={styles.txRow}>
                <span>Importo</span>
                <span>€ {getTransactionAmount(tx).toFixed(2)}</span>
              </div>

              <div className={styles.txRow}>
                <span>Data</span>
                <span>{formatDate(tx.created_at)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* INFO */}
        <div className={styles.card}>
          <h2>Info</h2>
          <p>GUFO earned: {walletData.totalGufoEarned}</p>
          <p>Season spent: € {walletData.seasonSpent}</p>
          <p>Balance EUR: € {walletData.balanceEuro}</p>
        </div>

      </div>
    </div>
  );
}