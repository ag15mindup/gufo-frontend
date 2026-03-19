"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Registrazione completata. Ora puoi fare login.");
    setLoading(false);
    router.push("/login");
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
              background: "#22c55e",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
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
      </div>
    </div>
  );
}