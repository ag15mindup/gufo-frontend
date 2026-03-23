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
      <div className="customer-page">
        <style>{customerStyles}</style>
        <h1 className="page-title">Il tuo codice GUFO</h1>
        <p className="page-subtitle">Caricamento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-page">
        <style>{customerStyles}</style>
        <h1 className="page-title">Il tuo codice GUFO</h1>
        <div className="error-box">{error}</div>
      </div>
    );
  }

  return (
    <div className="customer-page">
      <style>{customerStyles}</style>

      <div className="customer-container">
        <h1 className="page-title">Il tuo codice GUFO</h1>
        <p className="page-subtitle">
          Mostra questo codice al negozio partner per ricevere cashback e GUFO
        </p>

        <div className="main-card neon-card">
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Saldo GUFO</p>
              <p className="stat-value">
                {toNumberSafe(customer?.balance_gufo).toFixed(2)}
              </p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Livello</p>
              <p className="stat-value">
                {formatLevel(
                  String(customer?.current_level ?? customer?.level ?? "Basic")
                )}
              </p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Cashback</p>
              <p className="stat-value">
                {toNumberSafe(customer?.cashback_percent).toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="code-card">
            <p className="code-label">Codice cliente</p>
            <p className="code-value">{customerCode}</p>
          </div>

          <div className="qr-card">
            <div className="qr-inner">
              <QRCodeCanvas value={customerCode} size={220} />
            </div>
          </div>

          <p className="qr-note">
            Il negozio partner può scansionare questo QR code per identificarti.
          </p>
        </div>
      </div>
    </div>
  );
}

const customerStyles = `
  * {
    box-sizing: border-box;
  }

  .customer-page {
    width: 100%;
    color: #ffffff;
    min-height: 100%;
    position: relative;
  }

  .customer-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.10), transparent 20%),
      radial-gradient(circle at 80% 18%, rgba(236, 72, 153, 0.10), transparent 22%),
      radial-gradient(circle at 18% 85%, rgba(34, 197, 94, 0.08), transparent 18%),
      radial-gradient(circle at 82% 80%, rgba(250, 204, 21, 0.08), transparent 18%);
    z-index: 0;
  }

  .customer-container,
  .error-box {
    position: relative;
    z-index: 1;
  }

  .customer-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .page-title {
    font-size: 56px;
    font-weight: 700;
    margin: 0 0 10px 0;
    line-height: 1.05;
    color: #fff7ed;
  }

  .page-subtitle {
    color: #d6d3d1;
    margin: 0 0 28px 0;
    font-size: 16px;
    line-height: 1.6;
  }

  .neon-card {
    position: relative;
    background:
      linear-gradient(180deg, rgba(10, 16, 32, 0.92), rgba(15, 23, 42, 0.88));
    border-radius: 22px;
    padding: 24px;
    overflow: hidden;
    backdrop-filter: blur(12px);
    box-shadow:
      0 10px 35px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .neon-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 22px;
    padding: 1.3px;
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

  .main-card > * {
    position: relative;
    z-index: 1;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 18px;
    padding: 20px;
    min-width: 0;
  }

  .stat-label {
    margin: 0 0 8px 0;
    color: #d6d3d1;
    font-size: 14px;
  }

  .stat-value {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.1;
    word-break: break-word;
    color: #fffaf0;
  }

  .code-card {
    border: 1px solid rgba(250, 204, 21, 0.25);
    background: rgba(250, 204, 21, 0.08);
    border-radius: 22px;
    padding: 28px 20px;
    text-align: center;
    margin-bottom: 24px;
  }

  .code-label {
    margin: 0 0 10px 0;
    color: #d6d3d1;
    font-size: 14px;
  }

  .code-value {
    margin: 0;
    font-size: 56px;
    line-height: 1.05;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #fde047;
    word-break: break-word;
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
  }

  .qr-note {
    margin: 0;
    text-align: center;
    color: #d6d3d1;
    font-size: 14px;
    line-height: 1.6;
  }

  .error-box {
    border: 1px solid rgba(248, 113, 113, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
    padding: 16px;
    border-radius: 16px;
  }

  @media (max-width: 768px) {
    .page-title {
      font-size: 38px;
    }

    .page-subtitle {
      font-size: 14px;
      margin-bottom: 20px;
    }

    .neon-card {
      padding: 18px 14px;
      border-radius: 18px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }

    .stat-card {
      padding: 18px;
      border-radius: 16px;
    }

    .stat-value {
      font-size: 28px;
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
    .page-title {
      font-size: 30px;
    }

    .stat-value {
      font-size: 24px;
    }

    .code-value {
      font-size: 28px;
    }
  }
`;