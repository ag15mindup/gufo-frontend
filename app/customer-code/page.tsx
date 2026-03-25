"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type CustomerData = {
  id?: string;
  user_id?: string;
  customer_code?: string;
  balance_gufo?: number | string | null;
  balance_eur?: number | string | null;
  level?: string | null;
  current_level?: string | null;
  cashback_percent?: number | string | null;
  season_spent?: number | string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Basic";

  const normalized = String(level).toLowerCase().trim();

  if (normalized === "vip") return "VIP";
  if (normalized === "platino" || normalized === "platinum") return "Platino";
  if (normalized === "diamond") return "Diamond";
  if (normalized === "millionaire") return "Millionaire";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function CustomerCodePage() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [customerCode, setCustomerCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCustomer() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(userError.message || "Errore recupero utente");
        }

        if (!user) {
          throw new Error("Utente non autenticato");
        }

        const [profileRes, walletRes] = await Promise.all([
          safeJsonFetch(`${API_URL}/profile/${user.id}`),
          safeJsonFetch(`${API_URL}/wallet/${user.id}`),
        ]);

        if (!profileRes.response.ok || profileRes.data?.success === false) {
          throw new Error(
            profileRes.data?.error || "Errore nel recupero profilo"
          );
        }

        if (!walletRes.response.ok || walletRes.data?.success === false) {
          throw new Error(walletRes.data?.error || "Errore nel recupero wallet");
        }

        const profilePayload = profileRes.data ?? {};
        const walletPayload = walletRes.data ?? {};

        const profile = profilePayload?.profile ?? {};
        const wallet =
          walletPayload?.data && typeof walletPayload.data === "object"
            ? walletPayload.data
            : walletPayload ?? {};

        const resolvedCustomerCode =
          profile?.customer_code ??
          wallet?.customer_code ??
          profilePayload?.customer_code ??
          walletPayload?.customer_code ??
          "";

        if (!resolvedCustomerCode) {
          throw new Error("Codice cliente non trovato per questo utente");
        }

        const customerData: CustomerData = {
          id: profile?.id ?? wallet?.id,
          user_id: user.id,
          customer_code: resolvedCustomerCode,
          balance_gufo: wallet?.balance_gufo ?? profile?.balance_gufo ?? 0,
          balance_eur: wallet?.balance_eur ?? profile?.balance_eur ?? 0,
          level:
            wallet?.current_level ??
            wallet?.level ??
            profile?.level ??
            "Basic",
          current_level:
            wallet?.current_level ?? wallet?.level ?? profile?.level ?? "Basic",
          cashback_percent:
            wallet?.cashback_percent ?? profile?.cashback_percent ?? 2,
          season_spent: wallet?.season_spent ?? profile?.season_spent ?? 0,
        };

        if (!isMounted) return;

        setCustomer(customerData);
        setCustomerCode(resolvedCustomerCode);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Errore nel caricamento codice cliente");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCustomer();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="customer-premium-page">
        <style>{customerStyles}</style>

        <div className="hero-line" />

        <div className="customer-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO CUSTOMER ID</div>
            <h1 className="hero-page-title">Il tuo codice GUFO</h1>
            <p className="hero-page-subtitle">Caricamento in corso...</p>
          </div>
        </div>

        <div className="loading-box premium-card">
          <p>Recupero customer code premium...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-premium-page">
        <style>{customerStyles}</style>

        <div className="hero-line" />

        <div className="customer-premium-hero">
          <div>
            <div className="hero-eyebrow">GUFO CUSTOMER ID</div>
            <h1 className="hero-page-title">Il tuo codice GUFO</h1>
            <p className="hero-page-subtitle">Si è verificato un problema.</p>
          </div>
        </div>

        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="customer-premium-page">
      <style>{customerStyles}</style>

      <div className="hero-line" />

      <div className="customer-premium-hero">
        <div>
          <div className="hero-eyebrow">GUFO CUSTOMER ID</div>
          <h1 className="hero-page-title">Il tuo codice GUFO</h1>
          <p className="hero-page-subtitle">
            Mostra questo codice al negozio partner per ricevere cashback e GUFO
          </p>
        </div>

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          QR Active
        </div>
      </div>

      <div className="stats-row">
        <div className="mini-stat premium-card">
          <div className="mini-stat-number">
            {toNumberSafe(customer?.balance_gufo).toFixed(2)}
          </div>
          <div className="mini-stat-label">Saldo GUFO</div>
          <div className="mini-stat-side">Wallet</div>
        </div>

        <div className="mini-stat premium-card">
          <div className="mini-stat-number">
            {formatLevel(
              String(customer?.current_level ?? customer?.level ?? "Basic")
            )}
          </div>
          <div className="mini-stat-label">Livello attuale</div>
          <div className="mini-stat-side">Membership</div>
        </div>

        <div className="mini-stat premium-card">
          <div className="mini-stat-number">
            {toNumberSafe(customer?.cashback_percent).toFixed(2)}%
          </div>
          <div className="mini-stat-label">Cashback attuale</div>
          <div className="mini-stat-side">Rewards</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="left-column premium-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Customer QR</h2>
              <p className="section-subtitle">
                Il partner può scansionare questo QR code per identificarti
              </p>
            </div>

            <div className="mini-pill">Scan Ready</div>
          </div>

          <div className="code-card">
            <div className="code-kicker">Codice cliente</div>
            <p className="code-value">{customerCode}</p>
          </div>

          <div className="qr-card">
            <div className="qr-inner">
              <QRCodeCanvas value={customerCode} size={220} />
            </div>
          </div>

          <p className="qr-note">
            Mostra questo QR o il codice cliente al partner per registrare la transazione.
          </p>
        </div>

        <div className="right-column premium-card">
          <div className="section-header">
            <h2 className="section-title">Top Info</h2>
            <span className="pro-badge">PRO</span>
          </div>

          <div className="info-stack">
            <div className="info-card">
              <div className="info-icon info-icon-gold" />
              <div className="info-copy">
                <div className="info-main">{customerCode}</div>
                <div className="info-sub">Customer code attivo</div>
              </div>
              <div className="info-tag">ID</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-cyan" />
              <div className="info-copy">
                <div className="info-main">
                  {toNumberSafe(customer?.balance_gufo).toFixed(2)}
                </div>
                <div className="info-sub">GUFO disponibili</div>
              </div>
              <div className="info-tag">BAL</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-pink" />
              <div className="info-copy">
                <div className="info-main">
                  {formatLevel(
                    String(customer?.current_level ?? customer?.level ?? "Basic")
                  )}
                </div>
                <div className="info-sub">Livello membership</div>
              </div>
              <div className="info-tag">LVL</div>
            </div>

            <div className="info-card">
              <div className="info-icon info-icon-green" />
              <div className="info-copy">
                <div className="info-main">
                  € {toNumberSafe(customer?.season_spent).toFixed(2)}
                </div>
                <div className="info-sub">Spesa stagione</div>
              </div>
              <div className="info-tag">TOT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const customerStyles = `
  * {
    box-sizing: border-box;
  }

  .customer-premium-page {
    position: relative;
    min-height: 100%;
    color: #ffffff;
  }

  .customer-premium-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(180deg, rgba(6, 10, 20, 0.18), rgba(6, 10, 20, 0.34)),
      radial-gradient(circle at 18% 20%, rgba(56, 189, 248, 0.10), transparent 24%),
      radial-gradient(circle at 84% 18%, rgba(236, 72, 153, 0.10), transparent 24%),
      radial-gradient(circle at 18% 84%, rgba(34, 197, 94, 0.08), transparent 20%),
      radial-gradient(circle at 82% 80%, rgba(250, 204, 21, 0.08), transparent 22%);
    z-index: 0;
  }

  .customer-premium-page > * {
    position: relative;
    z-index: 1;
  }

  .hero-line {
    width: 100%;
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

  .customer-premium-hero {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 22px;
  }

  .hero-eyebrow {
    font-size: 13px;
    font-weight: 800;
    color: #f8fafc;
    margin-bottom: 10px;
  }

  .hero-page-title {
    margin: 0 0 8px 0;
    font-size: 58px;
    line-height: 0.96;
    font-weight: 900;
    letter-spacing: -0.04em;
    text-shadow: 0 0 18px rgba(255,255,255,0.12);
    word-break: break-word;
  }

  .hero-page-subtitle {
    margin: 0;
    color: #d7e2f2;
    font-size: 15px;
    line-height: 1.5;
    max-width: 760px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    white-space: nowrap;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #eef2ff;
    font-size: 13px;
    font-weight: 700;
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.06);
  }

  .hero-badge-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: linear-gradient(180deg, #4ade80, #22c55e);
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.55);
    flex-shrink: 0;
  }

  .premium-card {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.60),
      rgba(15, 23, 42, 0.48)
    );
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 24px;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow:
      0 16px 38px rgba(0,0,0,0.28),
      inset 0 1px 0 rgba(255,255,255,0.05),
      0 0 0 1px rgba(255,255,255,0.02);
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 22px;
  }

  .mini-stat {
    min-height: 150px;
    padding: 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .mini-stat-number {
    font-size: 32px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.03em;
    color: #ffffff;
    word-break: break-word;
  }

  .mini-stat-label {
    color: #e8eefc;
    font-size: 15px;
    font-weight: 700;
  }

  .mini-stat-side {
    color: #dbe7fb;
    font-size: 14px;
    font-weight: 700;
    opacity: 0.92;
    align-self: flex-end;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) 340px;
    gap: 20px;
  }

  .left-column,
  .right-column {
    padding: 22px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
  }

  .section-title {
    margin: 0;
    font-size: 22px;
    font-weight: 900;
    color: #ffffff;
  }

  .section-subtitle {
    margin: 6px 0 0 0;
    color: #d7e2f2;
    font-size: 14px;
    line-height: 1.5;
  }

  .mini-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    white-space: nowrap;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #eef2ff;
    font-size: 12px;
    font-weight: 700;
  }

  .pro-badge {
    min-height: 32px;
    padding: 0 12px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    color: #d1fae5;
    background: rgba(34, 197, 94, 0.14);
    border: 1px solid rgba(134, 239, 172, 0.20);
  }

  .code-card {
    border: 1px solid rgba(250, 204, 21, 0.25);
    background:
      radial-gradient(circle at center, rgba(250, 204, 21, 0.08), transparent 60%),
      rgba(250, 204, 21, 0.06);
    border-radius: 24px;
    padding: 28px 20px;
    text-align: center;
    margin-bottom: 22px;
  }

  .code-kicker {
    margin-bottom: 10px;
    color: #dbe4f0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .code-value {
    margin: 0;
    font-size: 56px;
    line-height: 1.05;
    font-weight: 900;
    letter-spacing: 0.08em;
    color: #fde047;
    word-break: break-word;
    text-shadow:
      0 0 18px rgba(250, 204, 21, 0.18),
      0 0 26px rgba(56, 189, 248, 0.06);
  }

  .qr-card {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .qr-inner {
    background: white;
    border-radius: 24px;
    padding: 20px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    max-width: 100%;
    box-shadow:
      0 16px 34px rgba(0, 0, 0, 0.22),
      0 0 24px rgba(255, 255, 255, 0.08);
  }

  .qr-note {
    margin: 0;
    text-align: center;
    color: #b9c6e3;
    font-size: 14px;
    line-height: 1.6;
  }

  .info-stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .info-card {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
  }

  .info-icon {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    box-shadow: 0 0 18px rgba(255,255,255,0.10);
  }

  .info-icon-gold {
    background: radial-gradient(circle at 30% 30%, #fde68a, #f59e0b);
  }

  .info-icon-cyan {
    background: radial-gradient(circle at 30% 30%, #67e8f9, #2563eb);
  }

  .info-icon-pink {
    background: radial-gradient(circle at 30% 30%, #f9a8d4, #a855f7);
  }

  .info-icon-green {
    background: radial-gradient(circle at 30% 30%, #86efac, #16a34a);
  }

  .info-copy {
    min-width: 0;
  }

  .info-main {
    color: #ffffff;
    font-size: 18px;
    font-weight: 900;
    line-height: 1.1;
    word-break: break-word;
  }

  .info-sub {
    color: #dbe7fb;
    font-size: 13px;
    margin-top: 4px;
  }

  .info-tag {
    color: #dbeafe;
    font-size: 12px;
    font-weight: 900;
    opacity: 0.9;
  }

  .loading-box,
  .error-box {
    padding: 22px;
  }

  .loading-box p {
    margin: 0;
    color: #e2e8f0;
    font-size: 15px;
  }

  .error-box {
    color: #fecaca;
    background: rgba(127, 29, 29, 0.24);
    border: 1px solid rgba(248, 113, 113, 0.28);
    border-radius: 20px;
  }

  @media (max-width: 1200px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 980px) {
    .stats-row {
      grid-template-columns: 1fr;
    }

    .hero-page-title {
      font-size: 42px;
    }
  }

  @media (max-width: 768px) {
    .customer-premium-hero {
      flex-direction: column;
      align-items: flex-start;
    }

    .hero-page-title {
      font-size: 34px;
    }

    .left-column,
    .right-column,
    .mini-stat {
      padding: 16px;
    }

    .section-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .code-card {
      padding: 22px 14px;
      border-radius: 18px;
      margin-bottom: 18px;
    }

    .code-value {
      font-size: 34px;
      letter-spacing: 0.04em;
    }

    .qr-inner {
      padding: 14px;
      border-radius: 18px;
    }

    .qr-note {
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    .hero-page-title {
      font-size: 30px;
    }

    .mini-stat-number {
      font-size: 26px;
    }

    .code-value {
      font-size: 28px;
    }
  }
`;