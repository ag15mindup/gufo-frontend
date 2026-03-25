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
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <div className={styles.hero}>
          <div>
            <p className={styles.welcome}>GUFO CUSTOMER ID</p>
            <h1 className={styles.userName}>Il tuo codice GUFO</h1>
            <p className={styles.email}>Caricamento in corso...</p>
          </div>
        </div>

        <div className={styles.loadingBox}>Recupero customer code...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <div className={styles.hero}>
          <div>
            <p className={styles.welcome}>GUFO CUSTOMER ID</p>
            <h1 className={styles.userName}>Il tuo codice GUFO</h1>
            <p className={styles.email}>Si è verificato un problema.</p>
          </div>
        </div>

        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgOverlay} />
      <div className={styles.rainbowLine} />

      <div className={styles.hero}>
        <div>
          <p className={styles.welcome}>GUFO CUSTOMER ID</p>
          <h1 className={styles.userName}>Il tuo codice GUFO</h1>
          <p className={styles.email}>
            Mostra questo codice al negozio partner per ricevere cashback e GUFO
          </p>
        </div>

        <div className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Customer code</span>
          <h2 className={styles.balanceValue}>{customerCode}</h2>
          <div className={styles.balanceSubValue}>
            QR attivo e pronto alla scansione
          </div>

          <div className={styles.balanceButtons}>
            <button type="button" className={styles.primaryBtn}>
              {toNumberSafe(customer?.balance_gufo).toFixed(2)} GUFO
            </button>
            <button type="button" className={styles.secondaryBtn}>
              {formatLevel(
                String(customer?.current_level ?? customer?.level ?? "Basic")
              )}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cyan}`}>
          <div>
            <div className={styles.statValue}>
              {toNumberSafe(customer?.balance_gufo).toFixed(2)}
            </div>
            <div className={styles.statLabel}>Saldo GUFO</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>G</div>
            <div className={styles.statHint}>Wallet</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.purple}`}>
          <div>
            <div className={styles.statValue}>
              {formatLevel(
                String(customer?.current_level ?? customer?.level ?? "Basic")
              )}
            </div>
            <div className={styles.statLabel}>Livello attuale</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>⬢</div>
            <div className={styles.statHint}>Membership</div>
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.orange}`}>
          <div>
            <div className={styles.statValue}>
              {toNumberSafe(customer?.cashback_percent).toFixed(2)}%
            </div>
            <div className={styles.statLabel}>Cashback attuale</div>
          </div>
          <div className={styles.statSide}>
            <div className={styles.statMini}>%</div>
            <div className={styles.statHint}>Rewards</div>
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Customer QR</h3>
              <p className={styles.panelSubtext}>
                Il partner può scansionare questo QR code per identificarti
              </p>
            </div>
            <span>Scan Ready</span>
          </div>

          <div className={styles.codeCard}>
            <div className={styles.codeKicker}>Codice cliente</div>
            <p className={styles.codeValue}>{customerCode}</p>
          </div>

          <div className={styles.qrCard}>
            <div className={styles.qrInner}>
              <QRCodeCanvas value={customerCode} size={220} />
            </div>
          </div>

          <p className={styles.qrNote}>
            Mostra questo QR o il codice cliente al partner per registrare la
            transazione.
          </p>
        </section>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Top Info</h3>
            <span>PRO</span>
          </div>

          <div className={styles.topList}>
            <div className={styles.topItem}>
              <div className={styles.avatar}>ID</div>
              <div>
                <strong>{customerCode}</strong>
                <p>Customer code attivo</p>
              </div>
              <span>id</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>G</div>
              <div>
                <strong>{toNumberSafe(customer?.balance_gufo).toFixed(2)}</strong>
                <p>GUFO disponibili</p>
              </div>
              <span>bal</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>L</div>
              <div>
                <strong>
                  {formatLevel(
                    String(customer?.current_level ?? customer?.level ?? "Basic")
                  )}
                </strong>
                <p>Livello membership</p>
              </div>
              <span>lvl</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>€</div>
              <div>
                <strong>€ {toNumberSafe(customer?.season_spent).toFixed(2)}</strong>
                <p>Spesa stagione</p>
              </div>
              <span>tot</span>
            </div>

            <div className={styles.topItem}>
              <div className={styles.avatar}>%</div>
              <div>
                <strong>
                  {toNumberSafe(customer?.cashback_percent).toFixed(2)}%
                </strong>
                <p>Cashback attuale</p>
              </div>
              <span>cb</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}