"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./register.module.css";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push("/dashboard");
      } else {
        setCheckingUser(false);
      }
    }

    checkUser();
  }, [router, supabase]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setError(error.message || "Errore durante la registrazione");
      setLoading(false);
      return;
    }

    const needsEmailConfirmation = !data.session && !!data.user;

    if (needsEmailConfirmation) {
      setMessage(
        "Registrazione completata. Controlla la tua email e conferma l'account prima di accedere."
      );
    } else {
      setMessage("Account creato con successo. Reindirizzamento al login...");
      setTimeout(() => {
        router.push("/login");
      }, 1200);
    }

    setLoading(false);
  }

  if (checkingUser) {
    return (
      <div className={styles.page}>
        <div className={styles.overlay} />
        <div className={styles.loadingCard}>
          <div className={styles.loadingOrb} />
          <p>Caricamento area registrazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.overlay} />

      <div className={styles.shell}>
        <div className={styles.left}>
          <div className={styles.heroLine} />

          <div className={styles.heroBadge}>GUFO Rainbow Access</div>

          <h1 className={styles.heroTitle}>
            Crea il tuo
            <span className={styles.heroTitleGlow}> account GUFO</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Registrati per entrare nell’ecosistema GUFO e accedere a wallet,
            cashback, membership, profilo, codice cliente e dashboard personale.
          </p>

          <div className={styles.heroTags}>
            <span className={styles.heroTag}>Account personale</span>
            <span className={styles.heroTag}>Cashback intelligente</span>
            <span className={styles.heroTag}>Membership evolutiva</span>
            <span className={styles.heroTag}>Partner network</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTopline}>REGISTER</div>
          <h2 className={styles.cardTitle}>Crea un nuovo account</h2>
          <p className={styles.cardSubtitle}>
            Inserisci email e password per iniziare con GUFO.
          </p>

          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email</label>
              <input
                type="email"
                placeholder="Inserisci la tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Password</label>
              <input
                type="password"
                placeholder="Scegli una password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={styles.fieldInput}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? "Registrazione in corso..." : "Crea account"}
            </button>
          </form>

          {message && <div className={styles.successBox}>{message}</div>}
          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.cardFooter}>
            <p className={styles.footerText}>
              Hai già un account?{" "}
              <Link href="/login" className={styles.footerLink}>
                Vai al login
              </Link>
            </p>

            <Link href="/" className={styles.backLink}>
              Torna alla landing
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}