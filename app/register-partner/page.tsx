"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./registerPartner.module.css";

type PartnerForm = {
  businessName: string;
  category: string;
  cashbackPercent: string;
};

export default function RegisterPartnerPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [partnerForm, setPartnerForm] = useState<PartnerForm>({
    businessName: "",
    category: "",
    cashbackPercent: "5",
  });

  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push("/partner-dashboard");
      } else {
        setCheckingUser(false);
      }
    }

    checkUser();
  }, [router, supabase]);

  function updatePartnerField<K extends keyof PartnerForm>(key: K, value: PartnerForm[K]) {
    setPartnerForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const trimmedEmail = email.trim();
    const businessName = partnerForm.businessName.trim();
    const category = partnerForm.category.trim();
    const cashbackPercent = Number(partnerForm.cashbackPercent);

    if (!businessName) {
      setError("Inserisci il nome attività");
      setLoading(false);
      return;
    }

    if (!category) {
      setError("Inserisci la categoria");
      setLoading(false);
      return;
    }

    if (!Number.isFinite(cashbackPercent) || cashbackPercent < 0 || cashbackPercent > 30) {
      setError("Il cashback deve essere compreso tra 0 e 30");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setError(error.message || "Errore durante la registrazione partner");
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Registrazione non completata correttamente");
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    // profilo partner
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        [
          {
            id: userId,
            email: trimmedEmail,
            role: "partner",
          },
        ],
        { onConflict: "id" }
      );

    if (profileError) {
      setError(profileError.message || "Errore salvataggio profilo partner");
      setLoading(false);
      return;
    }

    // record partner
    const { error: partnerError } = await supabase.from("partners").insert([
      {
        user_id: userId,
        name: businessName,
        category,
        cashback_percent: cashbackPercent,
      },
    ]);

    if (partnerError) {
      setError(partnerError.message || "Errore salvataggio anagrafica partner");
      setLoading(false);
      return;
    }

    const needsEmailConfirmation = !data.session && !!data.user;

    if (needsEmailConfirmation) {
      setMessage(
        "Registrazione partner completata. Controlla la tua email e conferma l'account prima di accedere."
      );
    } else {
      setMessage("Account partner creato con successo. Reindirizzamento al login...");
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
          <p>Caricamento registrazione partner...</p>
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

          <div className={styles.heroBadge}>GUFO Partner Access</div>

          <h1 className={styles.heroTitle}>
            Crea il tuo
            <span className={styles.heroTitleGlow}> account partner</span>
          </h1>

          <p className={styles.heroSubtitle}>
            Registra la tua attività su GUFO per gestire cashback, pagamenti,
            clienti e analytics direttamente dalla partner dashboard.
          </p>

          <div className={styles.heroTags}>
            <span className={styles.heroTag}>Merchant account</span>
            <span className={styles.heroTag}>Cashback personalizzato</span>
            <span className={styles.heroTag}>Partner dashboard</span>
            <span className={styles.heroTag}>Console pagamenti</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTopline}>PARTNER REGISTER</div>
          <h2 className={styles.cardTitle}>Crea un account partner</h2>
          <p className={styles.cardSubtitle}>
            Inserisci i dati della tua attività e crea il tuo accesso merchant.
          </p>

          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Nome attività</label>
              <input
                type="text"
                placeholder="Es. Coop Savona"
                value={partnerForm.businessName}
                onChange={(e) => updatePartnerField("businessName", e.target.value)}
                required
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Categoria</label>
              <input
                type="text"
                placeholder="Es. Supermercato"
                value={partnerForm.category}
                onChange={(e) => updatePartnerField("category", e.target.value)}
                required
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Cashback base (%)</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.01"
                placeholder="Es. 5"
                value={partnerForm.cashbackPercent}
                onChange={(e) => updatePartnerField("cashbackPercent", e.target.value)}
                required
                className={styles.fieldInput}
              />
            </div>

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
              {loading ? "Registrazione partner in corso..." : "Crea account partner"}
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

            <Link href="/register" className={styles.backLink}>
              Torna alla scelta registrazione
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}