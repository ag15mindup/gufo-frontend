"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/dashboard");
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
        <h1 style={{ margin: "0 0 10px 0", fontSize: "32px" }}>Login</h1>
        <p style={{ margin: "0 0 20px 0", color: "#94a3b8" }}>
          Accedi alla tua area GUFO
        </p>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: "12px" }}>
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
            {loading ? "Accesso..." : "Entra"}
          </button>
        </form>

        {error && (
          <p style={{ color: "#fca5a5", marginTop: "14px" }}>{error}</p>
        )}

        <p style={{ marginTop: "18px", color: "#94a3b8", fontSize: "14px" }}>
          Non hai un account? Vai su <strong>/register</strong>
        </p>
      </div>
    </div>
  );
}