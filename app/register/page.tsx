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
      <div className="register-page">
        <style>{registerStyles}</style>

        <div className="register-loading premium-card">
          <div className="loading-orb" />
          <p>Caricamento area registrazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <style>{registerStyles}</style>

      <div className="register-overlay" />

      <div className="register-shell">
        <div className="register-left">
          <div className="hero-line" />

          <div className="hero-badge">GUFO Rainbow Access</div>

          <h1 className="hero-title">
            Crea il tuo
            <span className="hero-title-glow"> account GUFO</span>
          </h1>

          <p className="hero-subtitle">
            Registrati per entrare nell’ecosistema GUFO e accedere a wallet,
            cashback, membership, profilo, codice cliente e dashboard personale.
          </p>

          <div className="hero-tags">
            <span className="hero-tag">Account personale</span>
            <span className="hero-tag">Cashback intelligente</span>
            <span className="hero-tag">Membership evolutiva</span>
            <span className="hero-tag">Partner network</span>
          </div>
        </div>

        <div className="register-card premium-card">
          <div className="card-topline">REGISTER</div>
          <h2 className="card-title">Crea un nuovo account</h2>
          <p className="card-subtitle">
            Inserisci email e password per iniziare con GUFO.
          </p>

          <form onSubmit={handleRegister} className="register-form">
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

          <div className="card-footer">
            <p className="footer-text">
              Hai già un account?{" "}
              <Link href="/login" className="footer-link">
                Vai al login
              </Link>
            </p>

            <Link href="/" className="back-link">
              Torna alla landing
            </Link>
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

  .register-page {
    position: relative;
    min-height: 100vh;
    width: 100%;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    overflow: hidden;
    background:
      linear-gradient(rgba(6, 10, 20, 0.42), rgba(6, 10, 20, 0.58)),
      url("/dashboard-space.jpg");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .register-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 18% 20%, rgba(56, 189, 248, 0.10), transparent 24%),
      radial-gradient(circle at 84% 18%, rgba(236, 72, 153, 0.10), transparent 24%),
      radial-gradient(circle at 18% 84%, rgba(34, 197, 94, 0.08), transparent 20%),
      radial-gradient(circle at 82% 80%, rgba(250, 204, 21, 0.08), transparent 22%);
    z-index: 0;
  }

  .register-shell {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 1180px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 430px;
    gap: 28px;
    align-items: center;
  }

  .register-left {
    padding: 8px 8px 8px 0;
  }

  .hero-line {
    width: 100%;
    max-width: 280px;
    height: 3px;
    border-radius: 999px;
    margin-bottom: 22px;
    background: linear-gradient(
      90deg,
      rgba(34, 211, 238, 0.95),
      rgba(132, 204, 22, 0.9),
      rgba(250, 204, 21, 0.95),
      rgba(251, 113, 133, 0.95),
      rgba(196, 181, 253, 0.95)
    );
    box-shadow: 0 0 18px rgba(255,255,255,0.14);
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #dbe7ff;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 18px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .hero-title {
    margin: 0 0 16px 0;
    font-size: 64px;
    line-height: 0.98;
    font-weight: 900;
    color: #fffaf0;
    letter-spacing: -0.04em;
    text-shadow: 0 0 18px rgba(255,255,255,0.10);
  }

  .hero-title-glow {
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

  .hero-subtitle {
    margin: 0 0 24px 0;
    max-width: 700px;
    color: #d7e2f2;
    font-size: 17px;
    line-height: 1.75;
  }

  .hero-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .hero-tag {
    padding: 9px 14px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #dbe7fb;
    font-size: 13px;
    font-weight: 600;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .premium-card {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.72),
      rgba(15, 23, 42, 0.58)
    );
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 28px;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow:
      0 18px 44px rgba(0,0,0,0.28),
      inset 0 1px 0 rgba(255,255,255,0.05),
      0 0 0 1px rgba(255,255,255,0.02);
  }

  .register-card {
    padding: 28px 24px;
    position: relative;
    overflow: hidden;
  }

  .register-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 28px;
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

  .card-topline,
  .card-title,
  .card-subtitle,
  .register-form,
  .success-box,
  .error-box,
  .card-footer {
    position: relative;
    z-index: 1;
  }

  .card-topline {
    margin-bottom: 10px;
    color: #93c5fd;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .card-title {
    margin: 0 0 10px 0;
    font-size: 32px;
    line-height: 1.1;
    color: #fff7ed;
    font-weight: 900;
  }

  .card-subtitle {
    margin: 0 0 22px 0;
    color: #cbd5e1;
    font-size: 15px;
    line-height: 1.6;
  }

  .register-form {
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

  .card-footer {
    margin-top: 18px;
    display: grid;
    gap: 8px;
  }

  .footer-text {
    margin: 0;
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.6;
  }

  .footer-link,
  .back-link {
    color: #93c5fd;
    text-decoration: none;
    font-weight: 700;
  }

  .back-link {
    font-size: 14px;
  }

  .register-loading {
    position: relative;
    z-index: 1;
    min-height: 180px;
    width: min(100%, 520px);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .register-loading p {
    position: relative;
    z-index: 1;
    margin: 0;
    color: #f8fafc;
    font-size: 18px;
    font-weight: 700;
  }

  .loading-orb {
    position: absolute;
    width: 180px;
    height: 180px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%);
    filter: blur(20px);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    .register-shell {
      grid-template-columns: 1fr;
      max-width: 680px;
    }

    .register-left {
      padding: 0;
    }

    .hero-title {
      font-size: 48px;
    }
  }

  @media (max-width: 768px) {
    .register-page {
      padding: 16px;
    }

    .hero-title {
      font-size: 38px;
    }

    .hero-subtitle {
      font-size: 15px;
      margin-bottom: 20px;
    }

    .register-card {
      padding: 22px 16px;
      border-radius: 22px;
    }

    .register-card::before {
      border-radius: 22px;
    }

    .card-title {
      font-size: 26px;
    }

    .card-subtitle,
    .footer-text,
    .back-link,
    .success-box,
    .error-box {
      font-size: 14px;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 32px;
    }

    .card-title {
      font-size: 22px;
    }
  }
`;