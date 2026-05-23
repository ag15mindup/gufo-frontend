"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    iban?: string | null;
    account_holder?: string | null;
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
  const [savingBankData, setSavingBankData] = useState(false);

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

  const convertSectionRef = useRef<HTMLElement | null>(null);
  const payoutSectionRef = useRef<HTMLElement | null>(null);

  function scrollToSection(ref: React.RefObject<HTMLElement | null>) {
  ref.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

  const amountNumber = Number(amountGufo || 0);
  const payoutNumber = Number(payoutAmount || 0);

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
      setIban(data.partner?.iban || "");
      setAccountHolder(data.partner?.account_holder || "");
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

  async function saveBankData() {
    try {
      setSavingBankData(true);
      setError("");
      setMessage("");

      if (!partnerUserId) {
        setError("Partner non riconosciuto.");
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

      const result = await safeJsonFetch("/partner/settings", {
        method: "POST",
        body: JSON.stringify({
          partner_user_id: partnerUserId,
          name: partnerName,
          iban,
          account_holder: accountHolder,
          cashback_percent: 2,
        }),
      });

      const data = result.data as any;

      if (!data?.success) {
        throw new Error(data?.error || "Errore salvataggio dati bancari");
      }

      setMessage("Dati bancari salvati correttamente.");
    } catch (err: any) {
      setError(err?.message || "Errore salvataggio dati bancari");
    } finally {
      setSavingBankData(false);
    }
  }

  async function requestPayout() {
    try {
      setRequestingPayout(true);
      setError("");
      setMessage("");

      if (!partnerUserId) {
        setError("Partner non riconosciuto.");
        return;
      }

      if (!Number.isFinite(payoutNumber) || payoutNumber <= 0) {
        setError("Inserisci un importo valido.");
        return;
      }

      if (payoutNumber > balanceEur) {
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
          amount_eur: payoutNumber,
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
        <div>
          <h1 className={styles.title}>Wallet Partner</h1>
          <p className={styles.subtitle}>
            Gestisci i tuoi GUFO e richiedi accrediti in euro.
          </p>
        </div>

        <div className={styles.partnerPill}>
          <span>{partnerName}</span>
        </div>
      </section>

      {loading ? (
        <div className={styles.loadingBox}>Caricamento wallet partner...</div>
      ) : (
        <>
          {error ? <div className={styles.errorBox}>{error}</div> : null}
          {message ? <div className={styles.successBox}>{message}</div> : null}

          <section className={styles.balanceHero}>
            <div className={styles.balanceLeft}>
              <p className={styles.balanceLabel}>Saldo euro disponibile</p>
              <h2 className={styles.balanceAmount}>€ {balanceEur.toFixed(2)}</h2>
              <span className={styles.growthBadge}>Fee conversione {Math.round(feePercent * 100)}%</span>
            </div>


            <div className={styles.balanceDivider} />

            <div className={styles.balanceRight}>
              <p className={styles.balanceLabel}>GUFO disponibili</p>
              <div className={styles.gufoRow}>
                <span className={styles.gufoIcon}>G</span>
                <strong>{balanceGufo.toFixed(2)} GUFO</strong>
              </div>
              <p className={styles.balanceSub}>
                Valore stimato € {(balanceGufo * (1 - feePercent)).toFixed(2)}
              </p>
            </div>

            <div className={styles.balanceActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => scrollToSection(convertSectionRef)}   
              >
                Converti GUFO in euro
              </button>

              <button
                type="button"
                className={styles.accentBtn}
                onClick={() => scrollToSection(payoutSectionRef)}
              >
                Richiedi accredito
              </button>
            </div>
          </section>

          <section ref={convertSectionRef} className={styles.panel}>
              <div className={styles.panelHeader}>
              <h3>Converti GUFO in euro</h3>
              <p>Scegli quanti GUFO convertire in euro.</p>
          </div>
            

            <div className={styles.convertGrid}>
              <div className={styles.inputCard}>
                <label className={styles.inputLabel}>Importo GUFO da convertire</label>
                <input
                  className={styles.inputControl}
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountGufo}
                  onChange={(e) => setAmountGufo(e.target.value)}
                  placeholder="Es. 5"
                />
                <p className={styles.availableText}>Disponibili: {balanceGufo.toFixed(2)} GUFO</p>
              </div>

              <div className={styles.summaryCard}>
                <h4>Riepilogo conversione</h4>
               <div className={styles.summaryRow}>
               <span>Importo lordo</span>
               <strong>{amountGufo ? `${preview.gross.toFixed(2)} GUFO` : "—"}</strong>
               </div>
               <div className={styles.summaryRow}>
              <span>Fee piattaforma ({Math.round(feePercent * 100)}%)</span>
              <strong>{amountGufo ? `- ${preview.fee.toFixed(2)} GUFO` : "—"}</strong>
              </div>
              <div className={styles.summaryTotal}>
              <span>Ricevi</span>
              <strong>{amountGufo ? `€ ${preview.net.toFixed(2)}` : "—"}</strong>
              </div>
              </div>
            </div>

            <button
  type="button"
  className={styles.primaryBtn}
  onClick={convertGufo}
  disabled={converting || !amountNumber || amountNumber <= 0}
>
         {converting ? "Conversione in corso..." : "Converti ora"}
         </button>
          {!amountNumber || amountNumber <= 0 ? (
        <p className={styles.hintText}>Inserisci un importo per continuare</p>
        ) : null}
          </section>

          <section ref={payoutSectionRef} className={styles.panel}>
           <div className={styles.panelHeader}>
           <h3>Richiedi accredito su conto corrente</h3>
           <p>Trasferisci il saldo euro sul tuo conto bancario.</p>
           </div>   
            

            <div className={styles.payoutGrid}>
              <div className={styles.bankCard}>
                <label className={styles.inputLabel}>🏦 IBAN</label>
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
                  className={styles.secondaryBtn}
                  onClick={saveBankData}
                  disabled={savingBankData}
                >
                  {savingBankData ? "Salvataggio..." : "Salva dati bancari"}
                </button>
              </div>

              <div className={styles.bankCard}>
                <label className={styles.inputLabel}>💶 Importo da accreditare</label>
                <input
                  className={styles.inputControl}
                  type="number"
                  min="0"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Es. 0.95"
                />

                <p className={styles.availableText}>Disponibile: € {balanceEur.toFixed(2)}</p>

                <button
                  type="button"
                  className={styles.accentBtn}
                  onClick={requestPayout}
                  disabled={requestingPayout || !payoutNumber || payoutNumber <= 0}
                >
                  {requestingPayout ? "Invio richiesta..." : "Richiedi accredito"}
                </button>
              </div>
            </div>
          </section>

          <section className={styles.infoGrid}>
          <div className={styles.infoCard}>
          <h4>1. Ricevi GUFO</h4>
          <p>I GUFO dei voucher riscattati dai clienti finiscono qui.</p>
          </div>

          <div className={styles.infoCard}>
          <h4>2. Converti</h4>
          <p>Converti i GUFO in euro. Fee piattaforma: {Math.round(feePercent * 100)}%.</p>
          </div>

          <div className={styles.infoCard}>
          <h4>3. Richiedi accredito</h4>
          <p>Trasferisci il saldo euro sul conto corrente indicato.</p>
          </div>
          </section>
        </>
      )}
    </main>
  );
}