"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJsonFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import styles from "./rewards.module.css";

const supabase = createClient();

type WalletResponse = {
  balance_gufo?: number | string | null;
  balance_eur?: number | string | null;
  season_spent?: number | string | null;
  current_level?: string | null;
  cashback_percent?: number | string | null;
  last_season_reset?: string | null;
  success?: boolean;
  error?: string;
  data?: unknown;
};

type RewardData = {
  balanceGufo: number;
  balanceEuro: number;
  seasonSpent: number;
  currentLevel: string;
  cashbackPercent: number;
  lastSeasonReset: string;
};

type GiftCardItem = {
  id: string;
  brand: string;
  valueEuro: number;
  costGufo: number;
  tag: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

const GIFT_CARDS: GiftCardItem[] = [
  { id: "amazon-10", brand: "Amazon", valueEuro: 10, costGufo: 120, tag: "Popular" },
  { id: "zalando-25", brand: "Zalando", valueEuro: 25, costGufo: 290, tag: "Fashion" },
  { id: "mediaworld-50", brand: "MediaWorld", valueEuro: 50, costGufo: 560, tag: "Tech" },
  { id: "spotify-10", brand: "Spotify", valueEuro: 10, costGufo: 115, tag: "Digital" },
  { id: "netflix-25", brand: "Netflix", valueEuro: 25, costGufo: 300, tag: "Entertainment" },
  { id: "decathlon-30", brand: "Decathlon", valueEuro: 30, costGufo: 345, tag: "Sport" },
];

function toNumberSafe(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatLevel(level?: string) {
  if (!level) return "Bronze";

  const normalized = String(level).toLowerCase().trim();

  if (normalized === "vip") return "VIP";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function extractWallet(payload: any): WalletResponse {
  if (!payload) return {};
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
}

export default function RewardsPage() {
  const [rewardData, setRewardData] = useState<RewardData>({
    balanceGufo: 0,
    balanceEuro: 0,
    seasonSpent: 0,
    currentLevel: "Bronze",
    cashbackPercent: 0,
    lastSeasonReset: "",
  });

  const [userName, setUserName] = useState("Utente GUFO");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [convertAmount, setConvertAmount] = useState("100");
  const [selectedGiftCard, setSelectedGiftCard] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRewards() {
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

        const fallbackName =
          user.user_metadata?.username ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Utente GUFO";

        if (isMounted) {
          setUserName(fallbackName);
        }

        const walletRes = await safeJsonFetch(`${API_URL}/wallet/${user.id}`);

        if (!walletRes.response.ok || walletRes.data?.success === false) {
          throw new Error(walletRes.data?.error || "Errore nel recupero rewards");
        }

        const wallet = extractWallet(walletRes.data ?? {});

        if (!isMounted) return;

        setRewardData({
          balanceGufo: toNumberSafe(wallet?.balance_gufo),
          balanceEuro: toNumberSafe(wallet?.balance_eur),
          seasonSpent: toNumberSafe(wallet?.season_spent),
          currentLevel: String(wallet?.current_level ?? "Bronze"),
          cashbackPercent: toNumberSafe(wallet?.cashback_percent ?? 0),
          lastSeasonReset: String(wallet?.last_season_reset ?? ""),
        });
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Errore sconosciuto");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRewards();

    return () => {
      isMounted = false;
    };
  }, []);

  const convertGufoAmount = toNumberSafe(convertAmount);
  const conversionFeePercent = 5;
  const grossEuro = convertGufoAmount * 0.01;
  const feeEuro = grossEuro * (conversionFeePercent / 100);
  const netEuro = Math.max(grossEuro - feeEuro, 0);

  const seasonalRewardUnlocked = rewardData.seasonSpent >= 1000;
  const seasonalRewardLabel = seasonalRewardUnlocked
    ? "Premio stagionale disponibile"
    : "Premio stagionale bloccato";

  const selectedGiftCardData = useMemo(
    () => GIFT_CARDS.find((item) => item.id === selectedGiftCard) ?? null,
    [selectedGiftCard]
  );

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <p className={styles.eyebrow}>GUFO Rewards Center</p>
          <h1 className={styles.title}>Rewards</h1>
          <p className={styles.subtitle}>Caricamento premi e saldo in corso...</p>
        </section>

        <div className={styles.loadingBox}>Recupero rewards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.bgOverlay} />
        <div className={styles.rainbowLine} />

        <section className={styles.hero}>
          <p className={styles.eyebrow}>GUFO Rewards Center</p>
          <h1 className={styles.title}>Rewards</h1>
          <p className={styles.subtitle}>Si è verificato un problema.</p>
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
        <div>
          <p className={styles.eyebrow}>GUFO Rewards Center</p>
          <h1 className={styles.title}>Premi, conversioni e riscatti</h1>
          <p className={styles.subtitle}>
            Usa i tuoi GUFO per conversioni, gift card e premi stagionali dentro
            l’ecosistema GUFO Rainbow.
          </p>
        </div>
      </section>

      <section className={styles.heroCard}>
        <div className={styles.heroCardLeft}>
          <div className={styles.heroTopRow}>
            <span className={styles.heroChip}>Rewards active</span>
            <span className={styles.heroStatus}>{userName}</span>
          </div>

          <p className={styles.heroLabel}>Saldo disponibile</p>
          <h2 className={styles.heroValue}>{rewardData.balanceGufo.toFixed(2)} GUFO</h2>
          <p className={styles.heroNote}>
            Valore convertibile stimato: € {rewardData.balanceEuro.toFixed(2)}
          </p>
        </div>

        <div className={styles.heroCardRight}>
          <div className={styles.heroMiniCard}>
            <span>Livello</span>
            <strong>{formatLevel(rewardData.currentLevel)}</strong>
          </div>

          <div className={styles.heroMiniCard}>
            <span>Spesa stagione</span>
            <strong>€ {rewardData.seasonSpent.toFixed(2)}</strong>
          </div>

          <div className={styles.heroMiniCard}>
            <span>Cashback</span>
            <strong>
              {rewardData.cashbackPercent > 0
                ? `${rewardData.cashbackPercent}%`
                : "Variabile"}
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Saldo GUFO</p>
          <h3 className={styles.metricValue}>{rewardData.balanceGufo.toFixed(2)}</h3>
          <span className={styles.metricHint}>Disponibilità attuale wallet</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Valore convertibile</p>
          <h3 className={styles.metricValue}>€ {rewardData.balanceEuro.toFixed(2)}</h3>
          <span className={styles.metricHint}>Stima lato reward</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Premio stagionale</p>
          <h3 className={styles.metricValue}>
            {seasonalRewardUnlocked ? "Sbloccato" : "Locked"}
          </h3>
          <span className={styles.metricHint}>Disponibilità premio di stagione</span>
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Convert</p>
                <h3>Converti GUFO in euro</h3>
              </div>
              <span className={styles.panelBadge}>Demo flow</span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.inputLabel}>Quantità GUFO</label>
              <input
                type="number"
                min="0"
                step="1"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                className={styles.inputControl}
                placeholder="Es. 100"
              />
            </div>

            <div className={styles.previewBox}>
              <div className={styles.previewRow}>
                <span>Conversione lorda</span>
                <strong>€ {grossEuro.toFixed(2)}</strong>
              </div>

              <div className={styles.previewRow}>
                <span>Commissione ({conversionFeePercent}%)</span>
                <strong>€ {feeEuro.toFixed(2)}</strong>
              </div>

              <div className={styles.previewRow}>
                <span>Valore netto</span>
                <strong>€ {netEuro.toFixed(2)}</strong>
              </div>
            </div>

            <button type="button" className={styles.primaryBtnWide}>
              Converti in euro
            </button>

            <p className={styles.helperText}>
              Flusso demo: la conversione reale potrà essere collegata più avanti al backend.
            </p>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Gift Cards</p>
                <h3>Riscatta gift card</h3>
              </div>
              <span className={styles.panelBadge}>Catalog</span>
            </div>

            <div className={styles.giftGrid}>
              {GIFT_CARDS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedGiftCard(item.id)}
                  className={`${styles.giftCard} ${
                    selectedGiftCard === item.id ? styles.giftCardActive : ""
                  }`}
                >
                  <div className={styles.giftTop}>
                    <span className={styles.giftBrand}>{item.brand}</span>
                    <span className={styles.giftTag}>{item.tag}</span>
                  </div>

                  <div className={styles.giftValue}>€ {item.valueEuro}</div>
                  <div className={styles.giftCost}>{item.costGufo} GUFO</div>
                </button>
              ))}
            </div>

            {selectedGiftCardData && (
              <div className={styles.selectionBox}>
                <div className={styles.selectionRow}>
                  <span>Gift card selezionata</span>
                  <strong>{selectedGiftCardData.brand}</strong>
                </div>

                <div className={styles.selectionRow}>
                  <span>Valore</span>
                  <strong>€ {selectedGiftCardData.valueEuro}</strong>
                </div>

                <div className={styles.selectionRow}>
                  <span>Costo</span>
                  <strong>{selectedGiftCardData.costGufo} GUFO</strong>
                </div>
              </div>
            )}

            <button type="button" className={styles.secondaryBtnWide}>
              Riscatta gift card
            </button>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Seasonal Reward</p>
                <h3>Premio stagionale</h3>
              </div>
              <span className={styles.panelBadge}>
                {seasonalRewardUnlocked ? "Unlocked" : "Locked"}
              </span>
            </div>

            <div
              className={`${styles.seasonCard} ${
                seasonalRewardUnlocked ? styles.seasonUnlocked : styles.seasonLocked
              }`}
            >
              <p className={styles.seasonLabel}>{seasonalRewardLabel}</p>
              <h4 className={styles.seasonTitle}>
                {seasonalRewardUnlocked
                  ? "Hai sbloccato il premio della stagione"
                  : "Continua ad accumulare per sbloccare il premio"}
              </h4>
              <p className={styles.seasonText}>
                {seasonalRewardUnlocked
                  ? "Puoi riscattare il premio stagionale previsto da GUFO Rainbow."
                  : "Raggiungi almeno € 1000 di spesa stagionale per accedere al premio demo."}
              </p>
            </div>

            <button
              type="button"
              className={styles.primaryBtnWide}
              disabled={!seasonalRewardUnlocked}
            >
              Riscatta premio stagionale
            </button>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Rewards Summary</p>
                <h3>Riepilogo rewards</h3>
              </div>
              <span className={styles.panelBadge}>Overview</span>
            </div>

            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span>Livello attuale</span>
                <strong>{formatLevel(rewardData.currentLevel)}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Saldo GUFO</span>
                <strong>{rewardData.balanceGufo.toFixed(2)}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Valore convertibile</span>
                <strong>€ {rewardData.balanceEuro.toFixed(2)}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Premio stagione</span>
                <strong>{seasonalRewardUnlocked ? "Disponibile" : "Non disponibile"}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}