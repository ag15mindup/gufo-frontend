"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./customer-code.module.css";

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
  if (!level) return "Bronze";

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

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message || "Errore recupero sessione");
        }

        const accessToken = session?.access_token;

        if (!accessToken) {
          throw new Error("Sessione non valida: token mancante");
        }

        const headers = {
          Authorization: `Bearer ${accessToken}`,
        };

        const [profileRes, walletRes] = await Promise.all([
          safeJsonFetch(`${API_URL}/profile`, { headers }),
          safeJsonFetch(`${API_URL}/wallet`, { headers }),
        ]);

        if (!profileRes.response.ok || profileRes.data?.success === false) {
          throw new Error(
            profileRes.data?.error || "Errore nel recupero profilo"
          );
        }

        if (!walletRes.response.ok || walletRes.data?.success === false) {
          throw new Error(
            walletRes.data?.error || "Errore nel recupero wallet"
          );
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
          id: profile?.id ?? wallet?.id ?? user.id,
          user_id: user.id,
          customer_code: resolvedCustomerCode,
          balance_gufo: wallet?.balance_gufo ?? 0,
          balance_eur: wallet?.balance_eur ?? 0,
          level:
            wallet?.current_level ??
            wallet?.level ??
            profile?.level ??
            "Bronze",
          current_level:
            wallet?.current_level ??
            wallet?.level ??
            profile?.level ??
            "Bronze",
          cashback_percent:
            wallet?.cashback_percent ?? profile?.cashback_percent ?? 0,
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
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO DIGITAL PASS</div>
            <p className={styles.eyebrow}>GUFO Customer Pass</p>
            <h1 className={styles.title}>Il tuo codice cliente</h1>
            <p className={styles.subtitle}>Caricamento pass digitale...</p>
          </div>
        </section>

        <div className={styles.loadingBox}>Recupero customer code...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroBadge}>GUFO DIGITAL PASS</div>
            <p className={styles.eyebrow}>GUFO Customer Pass</p>
            <h1 className={styles.title}>Il tuo codice cliente</h1>
            <p className={styles.subtitle}>Si è verificato un problema.</p>
          </div>
        </section>

        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgOverlay} />
      <div className={styles.rainbowLine} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroBadge}>GUFO DIGITAL PASS</div>
          <p className={styles.eyebrow}>GUFO Customer Pass</p>
          <h1 className={styles.title}>Scan &amp; earn</h1>
          <p className={styles.subtitle}>
            Mostra questo pass al partner per identificarti e registrare
            correttamente la transazione.
          </p>
          <p className={styles.heroDescription}>
            Un pass digitale pronto all’uso, pensato per essere mostrato in
            negozio in modo immediato, chiaro e professionale.
          </p>
        </div>
      </section>

      <section className={styles.passCard}>
        <div className={styles.passGlowA} />
        <div className={styles.passGlowB} />

        <div className={styles.passTopBar}>
          <div className={styles.passBrandBlock}>
            <span className={styles.passBrandKicker}>GUFO RAINBOW</span>
            <span className={styles.passBrandTitle}>Customer Access Pass</span>
          </div>

          <div className={styles.passStatusWrap}>
            <span className={styles.passChip}>Customer ID</span>
            <span className={styles.passStatus}>Scan Ready</span>
          </div>
        </div>

        <div className={styles.passBody}>
          <div className={styles.passLeft}>
            <div className={styles.codeBlock}>
              <p className={styles.passLabel}>Codice cliente</p>
              <h2 className={styles.passCode}>{customerCode}</h2>
              <p className={styles.passNote}>
                Usa questo codice o il QR per permettere al partner di
                associarti alla transazione.
              </p>
            </div>

            <div className={styles.passMetaGrid}>
              <div className={styles.passMetaItem}>
                <span>Livello</span>
                <strong>
                  {formatLevel(
                    String(customer?.current_level ?? customer?.level ?? "Bronze")
                  )}
                </strong>
              </div>

              <div className={styles.passMetaItem}>
                <span>Saldo GUFO</span>
                <strong>{toNumberSafe(customer?.balance_gufo).toFixed(2)}</strong>
              </div>

              <div className={styles.passMetaItem}>
                <span>Cashback</span>
                <strong>
                  {toNumberSafe(customer?.cashback_percent) > 0
                    ? `${toNumberSafe(customer?.cashback_percent).toFixed(2)}%`
                    : "Variabile"}
                </strong>
              </div>
            </div>
          </div>

          <div className={styles.passRight}>
            <div className={styles.qrTicket}>
              <div className={styles.qrTicketTop}>
                <span className={styles.qrTicketLabel}>QR AUTH</span>
                <span className={styles.qrTicketMini}>{customerCode}</span>
              </div>

              <div className={styles.qrShell}>
                <div className={styles.qrInner}>
                  <QRCodeCanvas
                    value={customerCode}
                    size={220}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    includeMargin
                  />
                </div>
              </div>

              <div className={styles.qrFooter}>
                <span>Mostra al partner</span>
                <span>Validazione cliente live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
          <p className={styles.metricLabel}>Saldo GUFO</p>
          <h3 className={styles.metricValue}>
            {toNumberSafe(customer?.balance_gufo).toFixed(2)}
          </h3>
          <span className={styles.metricHint}>Disponibilità wallet attuale</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Livello attuale</p>
          <h3 className={styles.metricValue}>
            {formatLevel(
              String(customer?.current_level ?? customer?.level ?? "Bronze")
            )}
          </h3>
          <span className={styles.metricHint}>Status membership corrente</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Spesa stagione</p>
          <h3 className={styles.metricValue}>
            € {toNumberSafe(customer?.season_spent).toFixed(2)}
          </h3>
          <span className={styles.metricHint}>Volume registrato nel periodo</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Cashback</p>
          <h3 className={styles.metricValue}>
            {toNumberSafe(customer?.cashback_percent) > 0
              ? `${toNumberSafe(customer?.cashback_percent).toFixed(2)}%`
              : "Var."}
          </h3>
          <span className={styles.metricHint}>Reward collegata al profilo</span>
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.sectionEyebrow}>How it works</p>
              <h3>Come usare il pass GUFO</h3>
            </div>
            <span className={styles.panelBadge}>Fast Scan</span>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <h4>Apri il pass</h4>
              <p>Mostra questa schermata al partner al momento del pagamento.</p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <h4>Scansione o codice</h4>
              <p>
                Il partner può leggere il QR oppure inserire manualmente il
                customer code.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <h4>Transazione registrata</h4>
              <p>
                Il movimento viene associato al tuo profilo e aggiorna GUFO,
                livello e storico.
              </p>
            </div>
          </div>
        </div>

        <aside className={styles.sideColumn}>
          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Customer code</p>
            <h4>{customerCode}</h4>
            <span>Identificativo cliente attivo</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Livello</p>
            <h4>
              {formatLevel(
                String(customer?.current_level ?? customer?.level ?? "Bronze")
              )}
            </h4>
            <span>Stato membership corrente</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Saldo GUFO</p>
            <h4>{toNumberSafe(customer?.balance_gufo).toFixed(2)}</h4>
            <span>Disponibilità attuale wallet</span>
          </div>

          <div className={styles.sideCard}>
            <p className={styles.sideLabel}>Cashback</p>
            <h4>
              {toNumberSafe(customer?.cashback_percent) > 0
                ? `${toNumberSafe(customer?.cashback_percent).toFixed(2)}%`
                : "Variabile"}
            </h4>
            <span>Reward collegata al tuo profilo</span>
          </div>
        </aside>
      </section>
    </div>
  );
}