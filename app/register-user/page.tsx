"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./registerUser.module.css";

export default function RegisterUserPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // 👉 set ruolo USER
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ role: "user" })
        .eq("id", data.user.id);
    }

    setMessage("Account utente creato. Vai al login...");
    setTimeout(() => router.push("/login"), 1200);

    setLoading(false);
  }

  if (checkingUser) {
    return <div className={styles.loader}>Caricamento...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Registrazione Utente</h1>

        <form onSubmit={handleRegister} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />

          <button className={styles.button} disabled={loading}>
            {loading ? "Creazione..." : "Crea account utente"}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}

        <Link href="/register" className={styles.back}>
          ← Torna indietro
        </Link>
      </div>
    </div>
  );
}