"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./register.module.css";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checkingUser, setCheckingUser] = useState(true);

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
            Scegli il tuo
            <span className={styles.heroTitleGlow}> tipo di account</span>
          </h1>

          <p className={styles.heroSubtitle}>
            GUFO ora separa il percorso di registrazione tra cliente e partner,
            così ogni account entra direttamente nell’area giusta.
          </p>

          <div className={styles.heroTags}>
            <span className={styles.heroTag}>Accesso utente</span>
            <span className={styles.heroTag}>Accesso partner</span>
            <span className={styles.heroTag}>Dashboard dedicate</span>
            <span className={styles.heroTag}>Flussi separati</span>
          </div>
        </div>

        <div className={styles.choiceWrap}>
          <div className={styles.choiceHeaderTopline}>REGISTER</div>
          <h2 className={styles.cardTitle}>Seleziona come vuoi entrare</h2>
          <p className={styles.cardSubtitle}>
            Scegli il percorso corretto per creare il tuo account GUFO.
          </p>

          <div className={styles.choiceGrid}>
            <Link href="/register-user" className={styles.choiceCard}>
              <div className={styles.choiceIcon}>👤</div>
              <div className={styles.choiceContent}>
                <h3 className={styles.choiceTitle}>Registrati come utente</h3>
                <p className={styles.choiceText}>
                  Accedi a wallet, cashback, membership, profilo, customer code e dashboard personale.
                </p>
                <span className={styles.choiceAction}>Vai alla registrazione utente</span>
              </div>
            </Link>

            <Link href="/register-partner" className={styles.choiceCard}>
              <div className={styles.choiceIcon}>🏪</div>
              <div className={styles.choiceContent}>
                <h3 className={styles.choiceTitle}>Registrati come partner</h3>
                <p className={styles.choiceText}>
                  Crea il tuo account merchant per registrare pagamenti, gestire cashback e usare la partner dashboard.
                </p>
                <span className={styles.choiceAction}>Vai alla registrazione partner</span>
              </div>
            </Link>
          </div>

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