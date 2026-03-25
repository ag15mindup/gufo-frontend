"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message || "Errore login");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  if (checkingUser) {
    return (
      <div className={styles.page}>
        <div className={styles.overlay} />
        <div className={styles.loadingCard}>
          <div className={styles.loadingOrb} />
          <p>Caricamento area login...</p>
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
            Bentornato su
            <span className={styles.heroTitleGlow}> GUFO</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Accedi alla tua area personale e controlla wallet, cashback,
            membership, profilo e transazioni in tempo reale.
          </p>

          <div className={styles.heroTags}>
            <span className={styles.heroTag}>Wallet live</span>
            <span className={styles.heroTag}>Membership</span>
            <span className={styles.heroTag}>Profilo</span>
            <span className={styles.heroTag}>Transazioni</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTopline}>LOGIN</div>
          <h2 className={styles.cardTitle}>Accedi al tuo account</h2>
          <p className={styles.cardSubtitle}>
            Inserisci email e password per entrare nella piattaforma GUFO.
          </p>

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email</label>
              <input
                type="email"
                placeholder="Inserisci la tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Password</label>
              <input
                type="password"
                placeholder="Inserisci la tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.fieldInput}
              />
            </div>

            <button type="submit" disabled={loading} className={styles.submitButton}>
              {loading ? "Accesso in corso..." : "Entra"}
            </button>
          </form>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.cardFooter}>
            <p className={styles.footerText}>
              Non hai ancora un account?{" "}
              <Link href="/register" className={styles.footerLink}>
                Registrati
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