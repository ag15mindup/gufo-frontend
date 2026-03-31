"use client";

import { useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import styles from "./partner-demo.module.css";

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
    id?: string | null;
    transaction_id?: string | null;
    Transaction_id?: string | null;
    amount?: number;
    gufo_earned?: number;
    cashback?: number;
    benefit?: string;
    tipo?: string;
    created_at?: string;
  };
};

const DEFAULT_CUSTOMER_CODE = "GUFO-915728";
const PARTNER_API_KEY = "gufo_partner_123456";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level: string) {
  if (!level) return "Bronze";

  const normalized = String(level).toLowerCase().trim();

  if (normalized === "vip") return "VIP";
  if (normalized === "platino" || normalized === "platinum") return "Platino";
  if (normalized === "diamond") return "Diamond";
  if (normalized === "millionaire") return "Millionaire";

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatTransactionType(type?: string) {
  const value = String(type || "-").toLowerCase();

  switch (value) {
    case "cashback":
      return "Cashback";
    case "payment":
      return "Pagamento";
    case "bonus":
      return "Bonus";
    case "buy":
      return "Acquisto";
    case "acquisto":
      return "Acquisto";
    case "withdraw":
      return "Prelievo";
    default:
      return value === "-" ? "-" : value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function getTransactionId(result: ApiResponse) {
  return (
    result.transaction?.id ||
    result.transaction?.transaction_id ||
    result.transaction?.Transaction_id ||
    null
  );
}

export default function PartnerDemoPage() {
  const [customerCode, setCustomerCode] = useState(DEFAULT_CUSTOMER_CODE);
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);
  const [amount, setAmount] = useState("50");
  const [merchantName, setMerchantName] = useState("Coop");
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");

  async function refreshCustomer(code: string) {
    const refreshed = await safeJsonFetch(
      `${API_URL}/partner/customer?code=${encodeURIComponent(code)}`
    );

    if (refreshed.response.ok) {
      const payload = refreshed.data?.customer ?? refreshed.data;

      setCustomer({
        id: payload.id,
        customer_code: payload.customer_code,
        balance_gufo: toNumberSafe(payload.balance_gufo),
        balance_eur: toNumberSafe(payload.balance_eur),
        level: String(payload.level || "bronze"),
        cashback_percent: toNumberSafe(payload.cashback_percent),
        season_spent: toNumberSafe(payload.season_spent),
      });
    }
  }

  async function handleSearchCustomer(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setResult(null);
    setCustomer(null);

    const code = customerCode.trim().toUpperCase();

    if (!code) {
      setError("Inserisci un codice cliente");
      return;
    }

    try {
      setLoadingCustomer(true);

      const { response, data } = await safeJsonFetch(
        `${API_URL}/partner/customer?code=${encodeURIComponent(code)}`
      );

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || "Cliente non trovato");
      }

      const payload = data?.customer ?? data;

      setCustomer({
        id: payload.id,
        customer_code: payload.customer_code,
        balance_gufo: toNumberSafe(payload.balance_gufo),
        balance_eur: toNumberSafe(payload.balance_eur),
        level: String(payload.level || "bronze"),
        cashback_percent: toNumberSafe(payload.cashback_percent),
        season_spent: toNumberSafe(payload.season_spent),
      });

      setCustomerCode(payload.customer_code || code);
    } catch (err: any) {
      setCustomer(null);
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
    const finalMerchantName = merchantName.trim();

    if (finalAmount <= 0) {
      setError("Inserisci un importo valido maggiore di 0");
      return;
    }

    if (!finalMerchantName) {
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
          user_id: customer.customer_code,
          amount: finalAmount,
          merchant_name: finalMerchantName,
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
    <div className={styles.page}>
      <div className={styles.bgOverlay} />
      <div className={styles.rainbowLine} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>GUFO PARTNER CONSOLE</div>
          <p className={styles.eyebrow}>GUFO Partner Console</p>
          <h1 className={styles.title}>Demo operativa partner</h1>
          <p className={styles.subtitle}>
            Cerca il cliente tramite customer code, verifica il profilo e registra
            una transazione demo.
          </p>
          <p className={styles.heroDescription}>
            Un flusso pensato per mostrare come il partner identifica il cliente,
            registra il pagamento e accredita i GUFO in tempo reale.
          </p>
        </div>
      </section>

      <section className={styles.operatorCard}>
        <div className={styles.operatorCardLeft}>
          <div className={styles.operatorTopRow}>
            <span className={styles.operatorChip}>Partner flow</span>
            <span className={styles.operatorStatus}>Console attiva</span>
          </div>

          <p className={styles.operatorLabel}>Cliente selezionato</p>
          <h2 className={styles.operatorValue}>
            {customer ? customer.customer_code : "--"}
          </h2>

          <p className={styles.operatorNote}>
            Il flusso partner consente di identificare il cliente e simulare il
            pagamento con accredito GUFO.
          </p>
        </div>

        <div className={styles.operatorCardRight}>
          <div className={styles.operatorMiniCard}>
            <span>Cashback cliente</span>
            <strong>
              {customer
                ? `${toNumberSafe(customer.cashback_percent).toFixed(2)}%`
                : "--"}
            </strong>
          </div>

          <div className={styles.operatorMiniCard}>
            <span>Importo preview</span>
            <strong>€ {previewAmount.toFixed(2)}</strong>
          </div>

          <div className={styles.operatorMiniCard}>
            <span>GUFO previsti</span>
            <strong>
              {customer && previewAmount > 0 ? previewCashback.toFixed(2) : "0.00"}
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
          <p className={styles.metricLabel}>Cliente attivo</p>
          <h3 className={styles.metricValue}>
            {customer ? customer.customer_code : "--"}
          </h3>
          <span className={styles.metricHint}>Customer code in lavorazione</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Cashback cliente</p>
          <h3 className={styles.metricValue}>
            {customer ? `${toNumberSafe(customer.cashback_percent).toFixed(2)}%` : "--"}
          </h3>
          <span className={styles.metricHint}>Reward applicabile alla transazione</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>GUFO previsti</p>
          <h3 className={styles.metricValue}>
            {customer && previewAmount > 0 ? previewCashback.toFixed(2) : "0.00"}
          </h3>
          <span className={styles.metricHint}>Stima cashback calcolata live</span>
        </div>
      </section>

      <section className={styles.formsGrid}>
        <form onSubmit={handleSearchCustomer} className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Customer Lookup</p>
              <h3>Cerca cliente</h3>
            </div>
            <span className={styles.panelBadge}>Lookup</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.inputLabel}>Codice cliente</label>
            <input
              type="text"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              className={styles.inputControl}
              placeholder="Es. GUFO-915728"
            />
          </div>

          <button
            type="submit"
            disabled={loadingCustomer}
            className={styles.primaryBtnWide}
          >
            {loadingCustomer ? "Ricerca cliente..." : "Cerca cliente"}
          </button>

          {customer && (
            <div className={styles.infoBox}>
              <div className={styles.infoHeader}>
                <h4>Cliente trovato</h4>
                <span>Ready</span>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoMiniCard}>
                  <p className={styles.infoMiniLabel}>Customer code</p>
                  <p className={styles.infoMiniValue}>{customer.customer_code}</p>
                </div>

                <div className={styles.infoMiniCard}>
                  <p className={styles.infoMiniLabel}>Livello</p>
                  <p className={styles.infoMiniValue}>{formatLevel(customer.level)}</p>
                </div>

                <div className={styles.infoMiniCard}>
                  <p className={styles.infoMiniLabel}>Saldo GUFO</p>
                  <p className={styles.infoMiniValue}>
                    {toNumberSafe(customer.balance_gufo).toFixed(2)} GUFO
                  </p>
                </div>

                <div className={styles.infoMiniCard}>
                  <p className={styles.infoMiniLabel}>Cashback</p>
                  <p className={styles.infoMiniValue}>
                    {toNumberSafe(customer.cashback_percent).toFixed(2)}%
                  </p>
                </div>

                <div className={styles.infoMiniCard}>
                  <p className={styles.infoMiniLabel}>Saldo €</p>
                  <p className={styles.infoMiniValue}>
                    € {toNumberSafe(customer.balance_eur).toFixed(2)}
                  </p>
                </div>

                <div className={styles.infoMiniCard}>
                  <p className={styles.infoMiniLabel}>Spesa stagione</p>
                  <p className={styles.infoMiniValue}>
                    € {toNumberSafe(customer.season_spent).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        <form onSubmit={handlePayment} className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Payment Action</p>
              <h3>Registra pagamento</h3>
            </div>
            <span className={styles.panelBadge}>Payment</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.inputLabel}>Merchant</label>
            <input
              type="text"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              className={styles.inputControl}
              placeholder="Es. Coop"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.inputLabel}>Importo (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={styles.inputControl}
              placeholder="Es. 120"
            />
          </div>

          {customer && previewAmount > 0 && (
            <div className={styles.previewBox}>
              <h4 className={styles.previewTitle}>Riepilogo operazione</h4>

              <div className={styles.previewGrid}>
                <div className={styles.previewRow}>
                  <span>Cliente</span>
                  <strong>{customer.customer_code}</strong>
                </div>
                <div className={styles.previewRow}>
                  <span>Merchant</span>
                  <strong>{merchantName.trim() || "-"}</strong>
                </div>
                <div className={styles.previewRow}>
                  <span>Importo</span>
                  <strong>€ {previewAmount.toFixed(2)}</strong>
                </div>
                <div className={styles.previewRow}>
                  <span>Cashback applicato</span>
                  <strong>
                    {toNumberSafe(customer.cashback_percent).toFixed(2)}%
                  </strong>
                </div>
                <div className={styles.previewRow}>
                  <span>GUFO previsti</span>
                  <strong>{previewCashback.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loadingPayment || !customer}
            className={styles.secondaryBtnWide}
          >
            {loadingPayment ? "Pagamento in corso..." : "Esegui pagamento"}
          </button>

          {!customer && (
            <p className={styles.helperText}>
              Cerca prima un cliente per abilitare il pagamento.
            </p>
          )}
        </form>
      </section>

      {error && <div className={styles.errorBox}>{error}</div>}

      {result?.success && (
        <section className={styles.resultCard}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Transaction Result</p>
              <h3 className={styles.successTitle}>Pagamento completato</h3>
            </div>
            <span className={styles.panelBadge}>Success</span>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>Merchant</p>
              <p className={styles.infoMiniValue}>
                {result.merchant_name || result.transaction?.benefit || "-"}
              </p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>ID transazione</p>
              <p className={styles.infoMiniValue}>{getTransactionId(result) || "-"}</p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>Importo</p>
              <p className={styles.infoMiniValue}>
                € {toNumberSafe(result.transaction?.amount).toFixed(2)}
              </p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>GUFO guadagnati</p>
              <p className={styles.infoMiniValue}>
                {toNumberSafe(
                  result.gufo_earned || result.transaction?.gufo_earned
                ).toFixed(2)}
              </p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>Nuovo saldo</p>
              <p className={styles.infoMiniValue}>
                {toNumberSafe(result.new_balance).toFixed(2)} GUFO
              </p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>Tipo</p>
              <p className={styles.infoMiniValue}>
                {formatTransactionType(result.transaction?.tipo || "-")}
              </p>
            </div>

            <div className={`${styles.infoMiniCard} ${styles.fullSpan}`}>
              <p className={styles.infoMiniLabel}>Data</p>
              <p className={styles.infoMiniValue}>
                {result.transaction?.created_at
                  ? new Date(result.transaction.created_at).toLocaleString("it-IT")
                  : "-"}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}