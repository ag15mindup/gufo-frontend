"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
      <div className="auth-page">
        <style>{registerStyles}</style>
        <div className="auth-loading-shell">
          <div className="auth-loading-glow" />
          <div className="auth-loading">Caricamento...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <style>{registerStyles}</style>

      <div className="auth-shell">
        <div className="auth-left">
          <div className="auth-badge">GUFO Rainbow</div>

          <h1 className="auth-title">
            Crea il tuo
            <span className="auth-title-glow"> account GUFO</span>
          </h1>

          <p className="auth-description">
            Registrati per entrare nell’ecosistema GUFO e accedere a wallet,
            cashback, membership, profilo, codice cliente e dashboard personale.
          </p>

          <div className="auth-features">
            <div className="auth-feature">Account personale</div>
            <div className="auth-feature">Cashback intelligente</div>
            <div className="auth-feature">Membership evolutiva</div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-inner">
            <p className="card-kicker">Register</p>
            <h2 className="card-title">Crea un nuovo account</h2>
            <p className="card-subtitle">
              Inserisci email e password per iniziare
            </p>

            <form onSubmit={handleRegister} className="auth-form">
              <div className="field-group">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  placeholder="Inserisci la tua email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="field-input"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <input
                  type="password"
                  placeholder="Scegli una password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="field-input"
                />
              </div>

              <button type="submit" disabled={loading} className="submit-button">
                {loading ? "Registrazione in corso..." : "Crea account"}
              </button>
            </form>

            {message && <div className="success-box">{message}</div>}
            {error && <div className="error-box">{error}</div>}

            <p className="auth-footer">
              Hai già un account?{" "}
              <Link href="/login" className="auth-link">
                Vai al login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const registerStyles = `
  * {
    box-sizing: border-box;
  }

  .auth-page {
    min-height: 100vh;
    width: 100%;
    color: white;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
      radial-gradient(circle at 12% 16%, rgba(236, 72, 153, 0.12), transparent 18%),
      radial-gradient(circle at 82% 12%, rgba(56, 189, 248, 0.12), transparent 18%),
      radial-gradient(circle at 18% 84%, rgba(34, 197, 94, 0.10), transparent 18%),
      radial-gradient(circle at 82% 84%, rgba(250, 204, 21, 0.10), transparent 18%),
      linear-gradient(180deg, #081120 0%, #0b1424 48%, #081120 100%);
  }

  .auth-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at center, rgba(255,255,255,0.03), transparent 42%);
    z-index: 0;
  }

  .auth-loading-shell {
    position: relative;
    z-index: 1;
    min-height: 180px;
    width: min(100%, 520px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 24px;
    background:
      linear-gradient(180deg, rgba(10, 16, 32, 0.82), rgba(15, 23, 42, 0.78));
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.30),
      0 0 22px rgba(56, 189, 248, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
    overflow: hidden;
  }

  .auth-loading-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 1.2px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.92),
      rgba(56, 189, 248, 0.92),
      rgba(34, 197, 94, 0.86),
      rgba(250, 204, 21, 0.86),
      rgba(168, 85, 247, 0.92)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.9;
  }

  .auth-loading-glow {
    position: absolute;
    width: 180px;
    height: 180px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%);
    filter: blur(20px);
    pointer-events: none;
  }

  .auth-loading {
    position: relative;
    z-index: 1;
    color: #f8fafc;
    font-size: 18px;
    font-weight: 700;
  }

  .auth-shell {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1160px;
    display: grid;
    grid-template-columns: 1fr 440px;
    gap: 28px;
    align-items: stretch;
  }

  .auth-left {
    padding: 22px 8px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .auth-badge {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    width: fit-content;
    background: rgba(15, 23, 42, 0.76);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #dbe7ff;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 18px;
  }

  .auth-title {
    margin: 0 0 16px 0;
    font-size: 64px;
    line-height: 0.98;
    font-weight: 800;
    color: #fffaf0;
    letter-spacing: -0.04em;
  }

  .auth-title-glow {
    display: block;
    margin-top: 8px;
    background: linear-gradient(
      90deg,
      #f472b6 0%,
      #60a5fa 25%,
      #4ade80 55%,
      #facc15 80%,
      #c084fc 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .auth-description {
    margin: 0 0 24px 0;
    max-width: 640px;
    color: #c8d4e8;
    font-size: 17px;
    line-height: 1.75;
  }

  .auth-features {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .auth-feature {
    padding: 10px 14px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }

  .auth-card {
    position: relative;
    background:
      linear-gradient(180deg, rgba(10, 16, 32, 0.92), rgba(15, 23, 42, 0.88));
    border-radius: 28px;
    overflow: hidden;
    box-shadow:
      0 24px 60px rgba(0,0,0,0.28),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }

  .auth-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 28px;
    padding: 1.4px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.95),
      rgba(56, 189, 248, 0.95),
      rgba(34, 197, 94, 0.95),
      rgba(250, 204, 21, 0.95),
      rgba(168, 85, 247, 0.95)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .auth-card-inner {
    position: relative;
    z-index: 1;
    padding: 28px 24px;
  }

  .card-kicker {
    margin: 0 0 10px 0;
    color: #93c5fd;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .card-title {
    margin: 0 0 10px 0;
    font-size: 32px;
    line-height: 1.1;
    color: #fff7ed;
    font-weight: 800;
  }

  .card-subtitle {
    margin: 0 0 22px 0;
    color: #cbd5e1;
    font-size: 15px;
    line-height: 1.6;
  }

  .auth-form {
    display: grid;
    gap: 16px;
  }

  .field-group {
    display: grid;
    gap: 8px;
  }

  .field-label {
    color: #d6d3d1;
    font-size: 14px;
    font-weight: 600;
  }

  .field-input {
    width: 100%;
    min-height: 52px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    padding: 14px 16px;
    color: white;
    outline: none;
    font-size: 14px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
  }

  .field-input::placeholder {
    color: #94a3b8;
  }

  .field-input:focus {
    border-color: rgba(56, 189, 248, 0.35);
    box-shadow:
      0 0 0 1px rgba(56, 189, 248, 0.16),
      0 0 18px rgba(56, 189, 248, 0.06);
  }

  .submit-button {
    width: 100%;
    min-height: 54px;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    font-weight: 800;
    font-size: 15px;
    color: #111827;
    background: linear-gradient(
      90deg,
      #f472b6 0%,
      #60a5fa 35%,
      #4ade80 70%,
      #facc15 100%
    );
    box-shadow: 0 14px 34px rgba(96, 165, 250, 0.18);
    transition: transform 0.18s ease, opacity 0.18s ease;
  }

  .submit-button:hover {
    transform: translateY(-1px);
    opacity: 0.97;
  }

  .submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .success-box {
    margin-top: 16px;
    border: 1px solid rgba(74, 222, 128, 0.28);
    background: rgba(34, 197, 94, 0.10);
    color: #bbf7d0;
    padding: 14px 16px;
    border-radius: 16px;
    font-size: 14px;
    line-height: 1.6;
  }

  .error-box {
    margin-top: 16px;
    border: 1px solid rgba(248, 113, 113, 0.3);
    background: rgba(239, 68, 68, 0.10);
    color: #fca5a5;
    padding: 14px 16px;
    border-radius: 16px;
    font-size: 14px;
  }

  .auth-footer {
    margin: 18px 0 0 0;
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.6;
  }

  .auth-link {
    color: #93c5fd;
    text-decoration: none;
    font-weight: 700;
  }

  @media (max-width: 1024px) {
    .auth-shell {
      grid-template-columns: 1fr;
      max-width: 680px;
    }

    .auth-left {
      padding: 8px 0 0;
    }

    .auth-title {
      font-size: 48px;
    }
  }

  @media (max-width: 768px) {
    .auth-page {
      padding: 16px;
    }

    .auth-title {
      font-size: 38px;
    }

    .auth-description {
      font-size: 15px;
      margin-bottom: 20px;
    }

    .auth-card-inner {
      padding: 22px 16px;
    }

    .card-title {
      font-size: 26px;
    }

    .card-subtitle,
    .auth-footer,
    .success-box,
    .error-box {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    .auth-title {
      font-size: 32px;
    }

    .card-title {
      font-size: 22px;
    }
  }
`;