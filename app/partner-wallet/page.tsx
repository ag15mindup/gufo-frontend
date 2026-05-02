"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeJsonFetch } from "@/lib/api";
import styles from "./partner-wallet.module.css";

type WalletResponse = {
  success: boolean;
  error?: string;
  partner?: {
    id: number;
    name: string;
    category?: string | null;
  };
  wallet?: {
    balance_gufo: number;
    balance_eur: number;
    fee_percent: number;
  };
};

type ConvertResponse = {
  success: boolean;
  error?: string;
  message?: string;
  conversion?: {
    gufo_amount: number;
    gross_amount: number;
    fee_percent: number;
    fee_amount: number;
    net_amount: number;
    currency: string;
  };
  wallet?: {
    balance_gufo: number;
    balance_eur: number;
  };
};

const supabase = createClient();

export default function PartnerWalletPage() {
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);

  const [partnerUserId, setPartnerUserId] = useState("");
  const [partnerName, setPartnerName] = useState("Partner GUFO");

  const [balanceGufo, setBalanceGufo] = useState(0);
  const [balanceEur, setBalanceEur] = useState(0);
  const [feePercent, setFeePercent] = useState(0.05);

  const [amountGufo, setAmountGufo] = useState("");
const [payoutAmount, setPayoutAmount] = useState("");
const [iban, setIban] = useState("");
const [accountHolder, setAccountHolder] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const amountNumber = Number(amountGufo || 0);

  const preview = useMemo(() => {
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return { gross: 0, fee: 0, net: 0 };
    }

    const gross = Number(amountNumber.toFixed(2));
    const fee = Number((gross * feePercent).toFixed(2));
    const net = Number((gross - fee).toFixed(2));

    return { gross, fee, net };
  }, [amountNumber, feePercent]);

  async function loadWallet() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Sessione scaduta. Effettua di nuovo il login.");
        return;
      }

      setPartnerUserId(user.id);

      const result = await safeJsonFetch(`/partner/wallet?user_id=${user.id}`);
      const data = result.data as WalletResponse | null;

      if (!data?.success) {
        throw new Error(data?.error || "Errore caricamento wallet partner");
      }

      setPartnerName(data.partner?.name || "Partner GUFO");
      setBalanceGufo(Number(data.wallet?.balance_gufo || 0));
      setBalanceEur(Number(data.wallet?.balance_eur || 0));
      setFeePercent(Number(data.wallet?.fee_percent || 0.05));
    } catch (err: any) {
      setError(err?.message || "Errore caricamento wallet partner");
    } finally {
      setLoading(false);
    }
  }

  async function convertGufo() {
    try {
      setConverting(true);
      setError("");
      setMessage("");

      if (!partnerUserId) {
        setError("Partner non riconosciuto.");
        return;
      }

      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        setError("Inserisci un importo GUFO valido.");
        return;
      }

      if (amountNumber > balanceGufo) {
        setError("Saldo GUFO partner insufficiente.");
        return;
      }

      const result = await safeJsonFetch("/partner/convert-gufo", {
        method: "POST",
        body: JSON.stringify({
          partner_user_id: partnerUserId,
          amount_gufo: amountNumber,
        }),
      });

      const data = result.data as ConvertResponse | null;

      if (!data?.success) {
        throw new Error(data?.error || "Errore conversione GUFO partner");
      }

      setBalanceGufo(Number(data.wallet?.balance_gufo || 0));
      setBalanceEur(Number(data.wallet?.balance_eur || 0));
      setAmountGufo("");
      setMessage(data.message || "Conversione completata correttamente.");
    } catch (err: any) {
      setError(err?.message || "Errore conversione GUFO partner");
    } finally {
      setConverting(false);
    }
  }

async function requestPayout() {
  try {
    setRequestingPayout(true);
    setError("");
    setMessage("");

    const amount = Number(payoutAmount || 0);

    if (!partnerUserId) {
      setError("Partner non riconosciuto.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Inserisci un importo valido.");
      return;
    }

    if (amount > balanceEur) {
      setError("Saldo euro insufficiente.");
      return;
    }

    if (!iban.trim()) {
      setError("Inserisci IBAN.");
      return;
    }

    if (!accountHolder.trim()) {
      setError("Inserisci intestatario conto.");
      return;
    }

    const result = await safeJsonFetch("/partner/payout-request", {
      method: "POST",
      body: JSON.stringify({
        partner_user_id: partnerUserId,
        amount_eur: amount,
        iban,
        account_holder: accountHolder,
      }),
    });

    const data = result.data as any;

    if (!data?.success) {
      throw new Error(data?.error || "Errore richiesta accredito");
    }

    setBalanceGufo(Number(data.wallet?.balance_gufo || 0));
    setBalanceEur(Number(data.wallet?.balance_eur || 0));
    setPayoutAmount("");
    setIban("");
    setAccountHolder("");
    setMessage("Richiesta accredito inviata. Stato: in attesa.");
  } catch (err: any) {
    setError(err?.message || "Errore richiesta accredito");
  } finally {
    setRequestingPayout(false);
  }
}

  useEffect(() => {
    loadWallet();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.bgOverlay} />
      <div className={styles.rainbowLine} />

      <section className={styles.hero}>
        <div className={styles.heroBadge}>PARTNER WALLET</div>
        <p className={styles.eyebrow}>GUFO LIQUIDITY MODULE</p>
        <h1 className={styles.title}>Wallet Partner</h1>
        <p className={styles.subtitle}>
          Gestisci i GUFO ricevuti dai voucher e convertili in euro con fee partner del 5%.
        </p>
      </section>

      {loading ? (
        <div className={styles.loadingBox}>Caricamento wallet partner...</div>
      ) : (
        <>
          {error ? <div className={styles.errorBox}>{error}</div> : null}
          {message ? <div className={styles.successBox}>{message}</div> : null}

          <section className={styles.operatorCard}>
            <div>
              <span className={styles.operatorChip}>Partner attivo</span>
              <p className={styles.operatorLabel}>Locale collegato</p>
              <h2 className={styles.operatorValue}>{partnerName}</h2>
              <p className={styles.operatorNote}>
                I GUFO ricevuti dai voucher riscattati dai clienti finiscono qui.
                Da questa pagina puoi convertirli in euro.
              </p>
            </div>

            <div className={styles.operatorCardRight}>
              <div className={styles.operatorMiniCard}>
                <span>Saldo GUFO</span>
                <strong>{balanceGufo.toFixed(2)} GUFO</strong>
              </div>

              <div className={styles.operatorMiniCard}>
                <span>Saldo euro netto</span>
                <strong>€ {balanceEur.toFixed(2)}</strong>
              </div>

              <div className={styles.operatorMiniCard}>
                <span>Fee conversione</span>
                <strong>{Math.round(feePercent * 100)}%</strong>
              </div>
            </div>
          </section>

          <section className={styles.mainGrid}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.sectionEyebrow}>CONVERSIONE</p>
                  <h3>Converti GUFO in euro</h3>
                </div>
                <span className={styles.panelBadge}>
                  Fee {Math.round(feePercent * 100)}%
                </span>
              </div>

              <label className={styles.inputLabel}>
                Importo GUFO da convertire
              </label>

              <input
                className={styles.inputControl}
                type="number"
                min="0"
                step="0.01"
                value={amountGufo}
                onChange={(e) => setAmountGufo(e.target.value)}
                placeholder="Es. 100"
              />

              <div className={styles.previewGrid}>
                <div className={styles.previewCard}>
                  <span>Lordo</span>
                  <strong>{preview.gross.toFixed(2)} GUFO</strong>
                </div>

                <div className={styles.previewCard}>
                  <span>Fee piattaforma</span>
                  <strong>{preview.fee.toFixed(2)} GUFO</strong>
                </div>

                <div className={styles.previewCard}>
                  <span>Netto partner</span>
                  <strong>€ {preview.net.toFixed(2)}</strong>
                </div>
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={convertGufo}
                disabled={converting || !amountNumber || amountNumber <= 0}
              >
                {converting ? "Conversione in corso..." : "Converti in euro"}
              </button>
            </div>

<div className={styles.payoutBox}>
  <div className={styles.panelHeader}>
    <div>
      <p className={styles.sectionEyebrow}>ACCREDITO</p>
      <h3>Richiedi accredito su conto corrente</h3>
    </div>
    <span className={styles.panelBadge}>Manuale</span>
  </div>

  <label className={styles.inputLabel}>Importo euro da accreditare</label>
  <input
    className={styles.inputControl}
    type="number"
    min="0"
    step="0.01"
    value={payoutAmount}
    onChange={(e) => setPayoutAmount(e.target.value)}
    placeholder="Es. 50"
  />

  <label className={styles.inputLabel}>IBAN</label>
  <input
    className={styles.inputControl}
    value={iban}
    onChange={(e) => setIban(e.target.value)}
    placeholder="IT00X0000000000000000000000"
  />

  <label className={styles.inputLabel}>Intestatario conto</label>
  <input
    className={styles.inputControl}
    value={accountHolder}
    onChange={(e) => setAccountHolder(e.target.value)}
    placeholder="Nome e cognome / Ragione sociale"
  />

  <button
    type="button"
    className={styles.primaryBtn}
    onClick={requestPayout}
    disabled={requestingPayout}
  >
    {requestingPayout ? "Invio richiesta..." : "Richiedi accredito"}
  </button>
</div>

            <aside className={styles.sideColumn}>
              <div className={styles.sideCard}>
                <p className={styles.sideLabel}>Regola economica</p>
                <h4>Fee solo sulla conversione</h4>
                <span>
                  Il partner paga il 5% solo quando decide di convertire GUFO o
                  voucher riscattati in euro.
                </span>
              </div>

              <div className={styles.sideCard}>
                <p className={styles.sideLabel}>Esempio</p>
                <h4>100 GUFO → €95</h4>
                <span>
                  Su 100 GUFO convertiti, 5 GUFO sono fee piattaforma e 95€
                  diventano saldo euro netto.
                </span>
              </div>
            </aside>
          </section>
        </>
      )}
    </main>
  );
}