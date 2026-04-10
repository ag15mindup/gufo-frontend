"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./partner-demo.module.css";

const supabase = createClient();

type CustomerResponse = {
  id: string;
  customer_code: string;
  balance_gufo: number;
  balance_eur: number;
  level: string;
  cashback_percent: number | null;
  season_spent: number;
};

type TransactionItem = {
  id?: string | null;
  transaction_id?: string | null;
  Transaction_id?: string | null;
  amount?: number;
  amount_euro?: number;
  gufo_earned?: number;
  cashback?: number;
  cashback_percent?: number;
  benefit?: string;
  tipo?: string;
  created_at?: string;
};

type PartnerMeResponse = {
  success?: boolean;
  partner?: {
    id?: number;
    name?: string;
    category?: string | null;
    cashback_percent?: number;
    user_id?: string;
  };
  error?: string;
};

type PaymentApiResponse = {
  success?: boolean;
  error?: string;
  gufo_earned?: number;
  cashback_percent?: number;
  new_balance?: number;
  payment_transaction?: TransactionItem;
  cashback_transaction?: TransactionItem | null;
  wallet?: {
    balance_gufo?: number;
    balance_eur?: number;
    total_spent?: number;
    season_spent?: number;
    level?: string;
  };
  partner?: {
    id?: number;
    name?: string;
    category?: string | null;
  };
};

const DEFAULT_CUSTOMER_CODE = "GUFO-915728";

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
    default:
      return value === "-" ? "-" : value.charAt(0).toUpperCase() + value.slice(1);
  }
}

function getTransactionId(tx?: TransactionItem | null) {
  if (!tx) return null;
  return tx.id || tx.transaction_id || tx.Transaction_id || null;
}

export default function PartnerDemoPage() {
  const [partnerUserId, setPartnerUserId] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerId, setPartnerId] = useState<number | null>(null);

  const [customerCode, setCustomerCode] = useState(DEFAULT_CUSTOMER_CODE);
  const [customer, setCustomer] = useState<CustomerResponse | null>(null);

  const [amount, setAmount] = useState("50");
  const [cashbackPercent, setCashbackPercent] = useState("5");

  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingPartner, setLoadingPartner] = useState(true);

  const [result, setResult] = useState<PaymentApiResponse | null>(null);
  const [error, setError] = useState("");

  async function loadPartnerMe(userId: string) {
    const { response, data } = await safeJsonFetch(
      `${API_URL}/partner/me?user_id=${encodeURIComponent(userId)}`
    );

    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || "Partner non trovato");
    }

    setPartnerUserId(userId);
    setPartnerId(data.partner?.id ?? null);
    setPartnerName(String(data.partner?.name || ""));
    setCashbackPercent(String(toNumberSafe(data.partner?.cashback_percent) || 0));
  }

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
        cashback_percent:
          payload.cashback_percent === null || payload.cashback_percent === undefined
            ? null
            : toNumberSafe(payload.cashback_percent),
        season_spent: toNumberSafe(payload.season_spent),
      });
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setLoadingPartner(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Utente partner non autenticato");
        }

        await loadPartnerMe(user.id);
      } catch (err: any) {
        setError(err.message || "Errore caricamento partner");
      } finally {
        setLoadingPartner(false);
      }
    }

    init();
  }, []);

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
        cashback_percent:
          payload.cashback_percent === null || payload.cashback_percent === undefined
            ? null
            : toNumberSafe(payload.cashback_percent),
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

    if (!partnerUserId) {
      setError("Partner non riconosciuto");
      return;
    }

    const finalAmount = toNumberSafe(amount);
    const finalCashbackPercent = toNumberSafe(cashbackPercent);

    if (finalAmount <= 0) {
      setError("Inserisci un importo valido maggiore di 0");
      return;
    }

    if (finalCashbackPercent < 0 || finalCashbackPercent > 30) {
      setError("Il cashback deve essere compreso tra 0 e 30");
      return;
    }

    try {
      setLoadingPayment(true);

      const { response, data } = await safeJsonFetch(
        `${API_URL}/partner/transaction/me`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            partner_user_id: partnerUserId,
            customer_code: customer.customer_code,
            amount_euro: finalAmount,
            cashback_percent: finalCashbackPercent,
          }),
        }
      );

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

  const previewAmount = useMemo(() => toNumberSafe(amount), [amount]);
  const previewCashbackPercent = useMemo(
    () => toNumberSafe(cashbackPercent),
    [cashbackPercent]
  );

  const previewGufo = useMemo(() => {
    if (!customer || previewAmount <= 0 || previewCashbackPercent <= 0) return 0;
    return Number(((previewAmount * previewCashbackPercent) / 100).toFixed(2));
  }, [customer, previewAmount, previewCashbackPercent]);

  const paymentTx = result?.payment_transaction || null;
  const cashbackTx = result?.cashback_transaction || null;

  if (loadingPartner) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />
        <div className={styles.loadingBox}>Caricamento partner...</div>
      </div>
    );
  }

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
            Il partner loggato viene riconosciuto automaticamente dal sistema.
          </p>
          <p className={styles.heroDescription}>
            Cerca il cliente, inserisci importo e cashback e conferma il pagamento
            senza selezionare manualmente il merchant.
          </p>
        </div>
      </section>

      <section className={styles.operatorCard}>
        <div className={styles.operatorCardLeft}>
          <div className={styles.operatorTopRow}>
            <span className={styles.operatorChip}>Partner flow</span>
            <span className={styles.operatorStatus}>Console attiva</span>
          </div>

          <p className={styles.operatorLabel}>Partner riconosciuto</p>
          <h2 className={styles.operatorValue}>{partnerName || "--"}</h2>

          <p className={styles.operatorNote}>
            Il partner viene recuperato dal login corrente. Niente partner_id o api
            key hardcoded nel frontend.
          </p>
        </div>

        <div className={styles.operatorCardRight}>
          <div className={styles.operatorMiniCard}>
            <span>Partner ID</span>
            <strong>{partnerId ?? "--"}</strong>
          </div>

          <div className={styles.operatorMiniCard}>
            <span>Cashback transazione</span>
            <strong>{previewCashbackPercent.toFixed(2)}%</strong>
          </div>

          <div className={styles.operatorMiniCard}>
            <span>GUFO previsti</span>
            <strong>{previewGufo.toFixed(2)}</strong>
          </div>
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

                <div className={styles.infoMiniCard}>
                  <p className={styles.infoMiniLabel}>Partner attivo</p>
                  <p className={styles.infoMiniValue}>{partnerName || "--"}</p>
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
            <label className={styles.inputLabel}>Partner attivo</label>
            <input
              type="text"
              value={partnerName}
              readOnly
              className={styles.inputControl}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.inputLabel}>Cashback (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="30"
              value={cashbackPercent}
              onChange={(e) => setCashbackPercent(e.target.value)}
              className={styles.inputControl}
              placeholder="Es. 5"
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
                  <span>Partner</span>
                  <strong>{partnerName || "-"}</strong>
                </div>
                <div className={styles.previewRow}>
                  <span>Importo</span>
                  <strong>€ {previewAmount.toFixed(2)}</strong>
                </div>
                <div className={styles.previewRow}>
                  <span>Cashback applicato</span>
                  <strong>{previewCashbackPercent.toFixed(2)}%</strong>
                </div>
                <div className={styles.previewRow}>
                  <span>GUFO previsti</span>
                  <strong>{previewGufo.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loadingPayment || !customer || !partnerUserId}
            className={styles.secondaryBtnWide}
          >
            {loadingPayment ? "Pagamento in corso..." : "Conferma pagamento"}
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
              <p className={styles.infoMiniLabel}>Partner</p>
              <p className={styles.infoMiniValue}>
                {result.partner?.name || partnerName || "-"}
              </p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>ID pagamento</p>
              <p className={styles.infoMiniValue}>{getTransactionId(paymentTx) || "-"}</p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>ID cashback</p>
              <p className={styles.infoMiniValue}>{getTransactionId(cashbackTx) || "-"}</p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>Importo</p>
              <p className={styles.infoMiniValue}>
                € {toNumberSafe(paymentTx?.amount_euro ?? paymentTx?.amount).toFixed(2)}
              </p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>Cashback applicato</p>
              <p className={styles.infoMiniValue}>
                {toNumberSafe(result.cashback_percent).toFixed(2)}%
              </p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>GUFO guadagnati</p>
              <p className={styles.infoMiniValue}>
                {toNumberSafe(result.gufo_earned).toFixed(2)}
              </p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>Nuovo saldo</p>
              <p className={styles.infoMiniValue}>
                {toNumberSafe(result.new_balance ?? result.wallet?.balance_gufo).toFixed(2)} GUFO
              </p>
            </div>

            <div className={styles.infoMiniCard}>
              <p className={styles.infoMiniLabel}>Tipo pagamento</p>
              <p className={styles.infoMiniValue}>
                {formatTransactionType(paymentTx?.tipo || "-")}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}