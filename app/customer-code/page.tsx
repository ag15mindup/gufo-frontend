"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type CustomerData = {
  id: string;
  customer_code: string;
  balance_gufo: number;
  balance_eur: number;
  level: string;
  cashback_percent: number;
  season_spent: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CUSTOMER_CODE = "GUFO-123456";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function safeJsonFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error("L'API non ha restituito JSON");
  }

  const data = text ? JSON.parse(text) : {};
  return { response, data };
}

function formatLevel(level: string) {
  if (!level) return "Basic";
  if (level.toLowerCase() === "vip") return "VIP";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

export default function CustomerCodePage() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError("");

        const { response, data } = await safeJsonFetch(
          `${API_URL}/partner/customer?code=${encodeURIComponent(CUSTOMER_CODE)}`
        );

        if (!response.ok || data?.success === false) {
          throw new Error(data?.error || "Cliente non trovato");
        }

        setCustomer(data);
      } catch (err: any) {
        setError(err.message || "Errore nel caricamento codice cliente");
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
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
          Mostra questo codice al negozio partner per ricevere cashback e GUFO.
        </p>

        <div className="main-card">
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
                {formatLevel(customer?.level || "Basic")}
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
            <p className="code-value">
              {customer?.customer_code || CUSTOMER_CODE}
            </p>
          </div>

          <div className="qr-card">
            <div className="qr-inner">
              <QRCodeCanvas
                value={customer?.customer_code || CUSTOMER_CODE}
                size={220}
              />
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
    color: white;
    width: 100%;
  }

  .customer-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .page-title {
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 10px 0;
    line-height: 1.1;
  }

  .page-subtitle {
    color: #cbd5e1;
    margin: 0 0 30px 0;
    font-size: 16px;
    line-height: 1.6;
  }

  .main-card {
    background: #1e293b;
    border: 1px solid rgba(148, 163, 184, 0.08);
    border-radius: 22px;
    padding: 24px;
    overflow: hidden;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 18px;
    padding: 20px;
    min-width: 0;
  }

  .stat-label {
    margin: 0 0 8px 0;
    color: #94a3b8;
    font-size: 14px;
  }

  .stat-value {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.1;
    word-break: break-word;
    color: white;
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
    color: #cbd5e1;
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
    color: #94a3b8;
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
      font-size: 32px;
    }

    .page-subtitle {
      font-size: 14px;
      margin-bottom: 22px;
    }

    .main-card {
      padding: 18px 14px;
      border-radius: 16px;
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
      font-size: 28px;
    }

    .stat-value {
      font-size: 24px;
    }

    .code-value {
      font-size: 28px;
    }
  }
`;