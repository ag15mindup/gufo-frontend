"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../wallet/wallet.module.css";

const supabase = createClient();

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

export default function BuyGufoPage() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleBuy() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Utente non autenticato");

      const response = await fetch(`${API_URL}/buy-gufo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          amount: Number(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "Errore acquisto");
      }

      setMessage("✅ Acquisto completato!");

      setTimeout(() => {
        router.push("/wallet");
      }, 1500);
    } catch (err: any) {
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgOverlay} />
      <div className={styles.rainbowLine} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>GUFO</p>
          <h1 className={styles.title}>Acquista GUFO</h1>
          <p className={styles.subtitle}>
            Inserisci l’importo e completa l’acquisto
          </p>

          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            
            <input
              type="number"
              placeholder="Importo (€)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                outline: "none",
                fontSize: "16px",
              }}
            />

            <button
              onClick={handleBuy}
              disabled={loading || !amount}
              style={{
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {loading ? "Caricamento..." : "Conferma acquisto"}
            </button>

            {message && (
              <div style={{ marginTop: "10px", fontWeight: 600 }}>
                {message}
              </div>
            )}

            {error && (
              <div style={{ marginTop: "10px", fontWeight: 600 }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}