"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

    const needsEmailConfirmation =
      !data.session && !!data.user;

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
      <div
        style={{
          minHeight: "100vh",
          background: "#020617",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Caricamento...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "20px",
          padding: "24px",
        }}
      >
        <h1 style={{ margin: "0 0 10px 0", fontSize: "32px" }}>Registrati</h1>
        <p style={{ margin: "0 0 20px 0", color: "#94a3b8" }}>
          Crea il tuo account GUFO
        </p>

        <form onSubmit={handleRegister} style={{ display: "grid", gap: "12px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid #334155",
              background: "#020617",
              color: "white",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "1px solid #334155",
              background: "#020617",
              color: "white",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              border: "none",
              background: loading ? "#4ade80" : "#22c55e",
              color: "white",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Registrazione..." : "Crea account"}
          </button>
        </form>

        {message && (
          <p style={{ color: "#86efac", marginTop: "14px" }}>{message}</p>
        )}

        {error && (
          <p style={{ color: "#fca5a5", marginTop: "14px" }}>{error}</p>
        )}

        <p style={{ marginTop: "18px", color: "#94a3b8", fontSize: "14px" }}>
          Hai già un account?{" "}
          <span
            onClick={() => router.push("/login")}
            style={{
              color: "#22c55e",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Vai al login
          </span>
        </p>
      </div>
    </div>
  );
}