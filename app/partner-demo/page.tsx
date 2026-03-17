"use client";

import { useState } from "react";

type CustomerResponse = {
  id: string;
  customer_code: string;
  balance_gufo: number;
  balance_eur: number;
  level: string;
  cashback_percent: number;
  season_spent: number;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  gufo_earned?: number;
  new_balance?: number;
  merchant_name?: string;
  transaction?: {
    id?: string;
    amount?: number;
    gufo_earned?: number;
    cashback?: number;
    benefit?: string;
    tipo?: string;
    created_at?: string;
  };
};

const DEFAULT_CUSTOMER_CODE = "GUFO-123456";
const PARTNER_API_KEY = "gufo_partner_123456";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Basic";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

async function safeJsonFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `L'API non ha restituito JSON. Controlla NEXT_PUBLIC_API_URL: ${API_URL}`
    );
  }

  const data = text ? JSON.parse(text) : {};
  return { response, data };
}

export default function PartnerDemoPage() {
  const [customerCode, setCustomerCode] = useState(DEFAULT_CUSTOMER_CODE);
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [amount, setAmount] = useState("50");
  const [merchantName, setMerchantName] = useState("adidas");
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  async function refreshCustomer(code: string) {
    const refreshed = await safeJsonFetch(
      `${API_URL}/partner/customer?code=${encodeURIComponent(code)}`
    );

    if (refreshed.response.ok) {
      setCustomer({
        id: refreshed.data.id,
        customer_code: refreshed.data.customer_code,
        balance_gufo: toNumberSafe(refreshed.data.balance_gufo),
        balance_eur: toNumberSafe(refreshed.data.balance_eur),
        level: String(refreshed.data.level || "basic"),
        cashback_percent: toNumberSafe(refreshed.data.cashback_percent),
        season_spent: toNumberSafe(refreshed.data.season_spent),
      });
    }
  }

  async function handleSearchCustomer(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setResult(null);
    setCustomer(null);

    const code = customerCode.trim();

    if (!code) {
      setError("Inserisci un codice cliente");
      return;
    }

    try {
      setLoadingCustomer(true);

      const { response, data } = await safeJsonFetch(
        `${API_URL}/partner/customer?code=${encodeURIComponent(code)}`
      );

      if (!response.ok) {
        throw new Error(data?.error || "Cliente non trovato");
      }

      setCustomer({
        id: data.id,
        customer_code: data.customer_code,
        balance_gufo: toNumberSafe(data.balance_gufo),
        balance_eur: toNumberSafe(data.balance_eur),
        level: String(data.level || "basic"),
        cashback_percent: toNumberSafe(data.cashback_percent),
        season_spent: toNumberSafe(data.season_spent),
      });
    } catch (err: any) {
      setError(err.message || "Errore durante la ricerca cliente");
    } finally {
      setLoadingCustomer(false);
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!customer) {
      setError("Cerca prima un cliente valido");
      return;
    }

    const finalAmount = toNumberSafe(amount);

    if (finalAmount <= 0) {
      setError("Inserisci un importo valido maggiore di 0");
      return;
    }

    if (!merchantName.trim()) {
      setError("Inserisci il nome del merchant");
      return;
    }

    try {
      setLoadingPayment(true);

      const { response, data } = await safeJsonFetch(`${API_URL}/transaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-partner-key": PARTNER_API_KEY,
        },
        body: JSON.stringify({
          user_id: customer.id,
          amount: finalAmount,
          merchant_name: merchantName.trim(),
        }),
      });

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "Errore durante il pagamento");
      }

      setResult(data);
      await refreshCustomer(customer.customer_code);
      setAmount("");
    } catch (err: any) {
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoadingPayment(false);
    }
  }

  const previewAmount = toNumberSafe(amount);
  const previewCashback = customer
    ? Number(
        (
          (previewAmount * toNumberSafe(customer.cashback_percent)) /
          100
        ).toFixed(2)
      )
    : 0;

  return (
    <div className="partner-page">
      <style>{partnerDemoStyles}</style>

      <div className="partner-container">
        <h1 className="page-title">GUFO Partner Demo</h1>
        <p className="page-subtitle">
          Cerca il cliente tramite codice GUFO e simula un pagamento partner.
        </p>

        <div className="main-card">
          <div className="form-grid">
            <form onSubmit={handleSearchCustomer} className="panel">
              <h2 className="panel-title">Cerca cliente</h2>

              <div className="field-group">
                <label className="field-label">Codice cliente</label>
                <input
                  type="text"
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  className="field-input"
                  placeholder="Es. GUFO-123456"
                />
              </div>

              <button
                type="submit"
                disabled={loadingCustomer}
                className="primary-button"
              >
                {loadingCustomer ? "Ricerca cliente..." : "Cerca cliente"}
              </button>

              {customer && (
                <div className="info-box blue-box">
                  <h3 className="info-title blue-title">Cliente trovato</h3>

                  <div className="info-grid">
                    <div className="mini-card">
                      <p className="mini-label">Codice cliente</p>
                      <p className="mini-value">{customer.customer_code}</p>
                    </div>

                    <div className="mini-card">
                      <p className="mini-label">Livello</p>
                      <p className="mini-value">{formatLevel(customer.level)}</p>
                    </div>

                    <div className="mini-card">
                      <p className="mini-label">Saldo GUFO</p>
                      <p className="mini-value">
                        {toNumberSafe(customer.balance_gufo).toFixed(2)} GUFO
                      </p>
                    </div>

                    <div className="mini-card">
                      <p className="mini-label">Cashback</p>
                      <p className="mini-value">
                        {toNumberSafe(customer.cashback_percent).toFixed(2)}%
                      </p>
                    </div>

                    <div className="mini-card">
                      <p className="mini-label">Saldo €</p>
                      <p className="mini-value">
                        €{toNumberSafe(customer.balance_eur).toFixed(2)}
                      </p>
                    </div>

                    <div className="mini-card">
                      <p className="mini-label">Spesa stagione</p>
                      <p className="mini-value">
                        €{toNumberSafe(customer.season_spent).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>

            <form onSubmit={handlePayment} className="panel">
              <h2 className="panel-title">Registra pagamento</h2>

              <div className="field-group">
                <label className="field-label">Merchant</label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="field-input"
                  placeholder="Es. Adidas"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Importo (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="field-input"
                  placeholder="Es. 120"
                />
              </div>

              {customer && previewAmount > 0 && (
                <div className="preview-box">
                  <h3 className="preview-title">Riepilogo pagamento</h3>

                  <div className="preview-list">
                    <p>
                      <span>Cliente:</span> {customer.customer_code}
                    </p>
                    <p>
                      <span>Merchant:</span> {merchantName.trim() || "-"}
                    </p>
                    <p>
                      <span>Importo:</span> €{previewAmount.toFixed(2)}
                    </p>
                    <p>
                      <span>Cashback applicato:</span>{" "}
                      {toNumberSafe(customer.cashback_percent).toFixed(2)}%
                    </p>
                    <p>
                      <span>GUFO previsti:</span> {previewCashback.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingPayment || !customer}
                className="secondary-button"
              >
                {loadingPayment ? "Pagamento in corso..." : "Esegui pagamento"}
              </button>

              {!customer && (
                <p className="helper-text">
                  Cerca prima un cliente per abilitare il pagamento.
                </p>
              )}
            </form>
          </div>

          {error && <div className="error-box">{error}</div>}

          {result?.success && (
            <div className="info-box green-box">
              <h2 className="info-title green-title">Pagamento completato</h2>

              <div className="info-grid">
                <div className="mini-card">
                  <p className="mini-label">Merchant</p>
                  <p className="mini-value">
                    {result.merchant_name || result.transaction?.benefit || "-"}
                  </p>
                </div>

                <div className="mini-card">
                  <p className="mini-label">Importo</p>
                  <p className="mini-value">
                    €{toNumberSafe(result.transaction?.amount).toFixed(2)}
                  </p>
                </div>

                <div className="mini-card">
                  <p className="mini-label">GUFO guadagnati</p>
                  <p className="mini-value">
                    {toNumberSafe(
                      result.gufo_earned || result.transaction?.gufo_earned
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="mini-card">
                  <p className="mini-label">Nuovo saldo</p>
                  <p className="mini-value">
                    {toNumberSafe(result.new_balance).toFixed(2)} GUFO
                  </p>
                </div>

                <div className="mini-card">
                  <p className="mini-label">Tipo</p>
                  <p className="mini-value">{result.transaction?.tipo || "-"}</p>
                </div>

                <div className="mini-card">
                  <p className="mini-label">Data</p>
                  <p className="mini-value">
                    {result.transaction?.created_at
                      ? new Date(result.transaction.created_at).toLocaleString("it-IT")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const partnerDemoStyles = `
  * {
    box-sizing: border-box;
  }

  .partner-page {
    width: 100%;
    color: white;
  }

  .partner-container {
    max-width: 1100px;
    margin: 0 auto;
  }

  .page-title {
    margin: 0 0 10px 0;
    font-size: 48px;
    font-weight: 700;
    line-height: 1.1;
  }

  .page-subtitle {
    margin: 0 0 30px 0;
    max-width: 760px;
    color: #cbd5e1;
    font-size: 16px;
    line-height: 1.7;
  }

  .main-card {
    background: #1e293b;
    border: 1px solid rgba(148, 163, 184, 0.08);
    border-radius: 22px;
    padding: 24px;
    overflow: hidden;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }

  .panel {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 20px;
    padding: 22px;
  }

  .panel-title {
    margin: 0 0 20px 0;
    font-size: 28px;
    line-height: 1.1;
  }

  .field-group {
    margin-bottom: 18px;
  }

  .field-label {
    display: block;
    margin-bottom: 8px;
    color: #cbd5e1;
    font-size: 14px;
  }

  .field-input {
    width: 100%;
    border-radius: 14px;
    border: 1px solid #334155;
    background: #1e293b;
    padding: 14px 16px;
    color: white;
    outline: none;
    font-size: 14px;
  }

  .field-input::placeholder {
    color: #94a3b8;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
    border: none;
    border-radius: 14px;
    padding: 14px 16px;
    color: white;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .primary-button:hover,
  .secondary-button:hover {
    opacity: 0.95;
    transform: translateY(-1px);
  }

  .primary-button:disabled,
  .secondary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .primary-button {
    background: #4f46e5;
  }

  .secondary-button {
    background: #2563eb;
  }

  .helper-text {
    margin: 12px 0 0 0;
    font-size: 13px;
    color: #94a3b8;
  }

  .preview-box {
    margin-bottom: 18px;
    border-radius: 16px;
    border: 1px solid #334155;
    background: rgba(30, 41, 59, 0.7);
    padding: 16px;
  }

  .preview-title {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: #e2e8f0;
  }

  .preview-list {
    display: grid;
    gap: 8px;
    font-size: 14px;
    color: #cbd5e1;
    word-break: break-word;
  }

  .preview-list span {
    color: #94a3b8;
  }

  .info-box {
    margin-top: 24px;
    border-radius: 18px;
    padding: 18px;
  }

  .blue-box {
    border: 1px solid rgba(59, 130, 246, 0.28);
    background: rgba(59, 130, 246, 0.1);
  }

  .green-box {
    border: 1px solid rgba(34, 197, 94, 0.28);
    background: rgba(34, 197, 94, 0.1);
  }

  .info-title {
    margin: 0 0 16px 0;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.1;
  }

  .blue-title {
    color: #93c5fd;
  }

  .green-title {
    color: #86efac;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .mini-card {
    background: rgba(15, 23, 42, 0.72);
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 16px;
    min-width: 0;
  }

  .mini-label {
    margin: 0 0 8px 0;
    color: #94a3b8;
    font-size: 13px;
  }

  .mini-value {
    margin: 0;
    color: white;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
    word-break: break-word;
  }

  .error-box {
    margin-top: 24px;
    border: 1px solid rgba(248, 113, 113, 0.3);
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
    padding: 16px;
    border-radius: 16px;
  }

  @media (max-width: 1024px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
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

    .panel {
      padding: 18px 14px;
      border-radius: 16px;
    }

    .panel-title {
      font-size: 22px;
      margin-bottom: 16px;
    }

    .field-group {
      margin-bottom: 16px;
    }

    .info-box {
      margin-top: 18px;
      padding: 16px 14px;
      border-radius: 16px;
    }

    .info-title {
      font-size: 20px;
      margin-bottom: 14px;
    }

    .info-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .mini-card {
      padding: 14px;
      border-radius: 14px;
    }

    .mini-value {
      font-size: 16px;
    }
  }

  @media (max-width: 480px) {
    .page-title {
      font-size: 28px;
    }

    .panel-title {
      font-size: 20px;
    }

    .mini-value {
      font-size: 15px;
    }
  }
`;