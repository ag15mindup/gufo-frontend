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

type BackendGiftCardItem = {
  id: number;
  brand: string;
  value_eur: number;
  fee_percent: number;
  fee_amount_gufo: number;
  price_gufo: number;
};

type GiftCardsResponse = {
  success?: boolean;
  fee_percent?: number;
  cards?: BackendGiftCardItem[];
  error?: string;
};

type ConvertResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  wallet?: {
    balance_gufo?: number;
    balance_eur?: number;
    total_spent?: number;
    season_spent?: number;
    current_level?: string;
  };
  conversion?: {
    gufo_amount?: number;
    gross_amount?: number;
    fee_percent?: number;
    fee_amount?: number;
    net_amount?: number;
    currency?: string;
    exchange_rate?: number;
  };
};

type RedeemGiftCardResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  wallet?: {
    balance_gufo?: number;
    balance_eur?: number;
    total_spent?: number;
    season_spent?: number;
    current_level?: string;
  };
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

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

function formatMoney(value: number) {
  return value.toFixed(2);
}

function getGiftCardTag(brand: string) {
  const normalized = String(brand || "").toLowerCase();

  if (normalized.includes("amazon")) return "Popular";
  if (normalized.includes("zalando")) return "Fashion";
  if (normalized.includes("mediaworld")) return "Tech";
  if (normalized.includes("spotify")) return "Digital";
  if (normalized.includes("ikea")) return "Home";
  if (normalized.includes("esselunga")) return "Food";

  return "Catalog";
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

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Utente GUFO");
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [convertAmount, setConvertAmount] = useState("100");
  const [giftCards, setGiftCards] = useState<BackendGiftCardItem[]>([]);
  const [selectedGiftCard, setSelectedGiftCard] = useState<number | null>(null);

  const [convertLoading, setConvertLoading] = useState(false);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadRewards() {
      try {
        setLoading(true);
        setError("");
        setActionMessage("");

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

        const token = session?.access_token;

        if (!token) {
          throw new Error("Sessione non valida: token mancante");
        }

        const fallbackName =
          user.user_metadata?.username ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Utente GUFO";

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [walletRes, giftCardsRes] = await Promise.all([
          safeJsonFetch(`${API_URL}/wallet`, { headers }),
          safeJsonFetch(`${API_URL}/gift-cards`),
        ]);

        if (!walletRes.response.ok || walletRes.data?.success === false) {
          throw new Error(walletRes.data?.error || "Errore nel recupero rewards");
        }

        if (!giftCardsRes.response.ok || giftCardsRes.data?.success === false) {
          throw new Error(giftCardsRes.data?.error || "Errore nel recupero gift card");
        }

        const wallet = extractWallet(walletRes.data ?? {});
        const giftPayload = (giftCardsRes.data ?? {}) as GiftCardsResponse;

        if (!isMounted) return;

        setUserId(user.id);
        setUserName(fallbackName);
        setAccessToken(token);

        setRewardData({
          balanceGufo: toNumberSafe(wallet?.balance_gufo),
          balanceEuro: toNumberSafe(wallet?.balance_eur),
          seasonSpent: toNumberSafe(wallet?.season_spent),
          currentLevel: String(wallet?.current_level ?? "Bronze"),
          cashbackPercent: toNumberSafe(wallet?.cashback_percent ?? 0),
          lastSeasonReset: String(wallet?.last_season_reset ?? ""),
        });

        setGiftCards(Array.isArray(giftPayload.cards) ? giftPayload.cards : []);

        if (giftPayload.cards && giftPayload.cards.length > 0) {
          setSelectedGiftCard(giftPayload.cards[0].id);
        }
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

  const convertGufoAmount = Math.max(toNumberSafe(convertAmount), 0);
  const conversionFeePercent = 15;
  const grossEuro = convertGufoAmount;
  const feeEuro = grossEuro * (conversionFeePercent / 100);
  const netEuro = Math.max(grossEuro - feeEuro, 0);

  const seasonalRewardUnlocked = rewardData.seasonSpent >= 1000;
  const seasonalRewardLabel = seasonalRewardUnlocked
    ? "Premio stagionale disponibile"
    : "Premio stagionale bloccato";

  const selectedGiftCardData = useMemo(
    () => giftCards.find((item) => item.id === selectedGiftCard) ?? null,
    [giftCards, selectedGiftCard]
  );

  async function refreshWallet(token: string) {
    const walletRes = await safeJsonFetch(`${API_URL}/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!walletRes.response.ok || walletRes.data?.success === false) {
      throw new Error(walletRes.data?.error || "Errore aggiornamento wallet");
    }

    const wallet = extractWallet(walletRes.data ?? {});

    setRewardData({
      balanceGufo: toNumberSafe(wallet?.balance_gufo),
      balanceEuro: toNumberSafe(wallet?.balance_eur),
      seasonSpent: toNumberSafe(wallet?.season_spent),
      currentLevel: String(wallet?.current_level ?? "Bronze"),
      cashbackPercent: toNumberSafe(wallet?.cashback_percent ?? 0),
      lastSeasonReset: String(wallet?.last_season_reset ?? ""),
    });
  }

  async function handleConvertGufo() {
    try {
      setConvertLoading(true);
      setActionMessage("");
      setError("");

      if (!userId) {
        throw new Error("Utente non disponibile");
      }

      if (!accessToken) {
        throw new Error("Token sessione mancante");
      }

      if (convertGufoAmount <= 0) {
        throw new Error("Inserisci una quantità GUFO valida");
      }

      const response = await fetch(`${API_URL}/convert-gufo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: userId,
          amount_gufo: convertGufoAmount,
        }),
      });

      const data = (await response.json()) as ConvertResponse;

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Errore durante la conversione");
      }

      await refreshWallet(accessToken);
      setActionMessage(
        `Conversione completata: ${formatMoney(convertGufoAmount)} GUFO → € ${formatMoney(
          toNumberSafe(data.conversion?.net_amount)
        )}`
      );
    } catch (err: any) {
      setError(err?.message || "Errore conversione");
    } finally {
      setConvertLoading(false);
    }
  }

  async function handleRedeemGiftCard() {
    try {
      setGiftCardLoading(true);
      setActionMessage("");
      setError("");

      if (!userId) {
        throw new Error("Utente non disponibile");
      }

      if (!accessToken) {
        throw new Error("Token sessione mancante");
      }

      if (!selectedGiftCardData) {
        throw new Error("Seleziona una gift card");
      }

      const response = await fetch(`${API_URL}/redeem-gift-card`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: userId,
          gift_card_id: selectedGiftCardData.id,
        }),
      });

      const data = (await response.json()) as RedeemGiftCardResponse;

      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Errore durante il riscatto gift card");
      }

      await refreshWallet(accessToken);
      setActionMessage(
        `Gift card riscattata: ${selectedGiftCardData.brand} € ${formatMoney(
          selectedGiftCardData.value_eur
        )}`
      );
    } catch (err: any) {
      setError(err?.message || "Errore riscatto gift card");
    } finally {
      setGiftCardLoading(false);
    }
  }

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

      {error ? <div className={styles.errorBox}>{error}</div> : null}
      {actionMessage ? <div className={styles.successBox}>{actionMessage}</div> : null}

      <section className={styles.heroCard}>
        <div className={styles.heroCardLeft}>
          <div className={styles.heroTopRow}>
            <span className={styles.heroChip}>Rewards active</span>
            <span className={styles.heroStatus}>{userName}</span>
          </div>

          <p className={styles.heroLabel}>Saldo disponibile</p>
          <h2 className={styles.heroValue}>{formatMoney(rewardData.balanceGufo)} GUFO</h2>
          <p className={styles.heroNote}>
            Wallet EUR disponibile: € {formatMoney(rewardData.balanceEuro)}
          </p>
        </div>

        <div className={styles.heroCardRight}>
          <div className={styles.heroMiniCard}>
            <span>Livello</span>
            <strong>{formatLevel(rewardData.currentLevel)}</strong>
          </div>

          <div className={styles.heroMiniCard}>
            <span>Spesa stagione</span>
            <strong>€ {formatMoney(rewardData.seasonSpent)}</strong>
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
          <h3 className={styles.metricValue}>{formatMoney(rewardData.balanceGufo)}</h3>
          <span className={styles.metricHint}>Disponibilità attuale wallet</span>
        </div>

        <div className={styles.metricCard}>
          <p className={styles.metricLabel}>Wallet EUR</p>
          <h3 className={styles.metricValue}>€ {formatMoney(rewardData.balanceEuro)}</h3>
          <span className={styles.metricHint}>Disponibilità conversioni completate</span>
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
              <span className={styles.panelBadge}>15% fee</span>
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
                <strong>€ {formatMoney(grossEuro)}</strong>
              </div>

              <div className={styles.previewRow}>
                <span>Commissione ({conversionFeePercent}%)</span>
                <strong>€ {formatMoney(feeEuro)}</strong>
              </div>

              <div className={styles.previewRow}>
                <span>Valore netto</span>
                <strong>€ {formatMoney(netEuro)}</strong>
              </div>
            </div>

            <button
              type="button"
              className={styles.primaryBtnWide}
              onClick={handleConvertGufo}
              disabled={convertLoading || convertGufoAmount <= 0}
            >
              {convertLoading ? "Conversione in corso..." : "Converti in euro"}
            </button>

            <p className={styles.helperText}>
              Conversione reale collegata al backend: 1 GUFO = 1€ con commissione del 15%.
            </p>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.sectionEyebrow}>Gift Cards</p>
                <h3>Riscatta gift card</h3>
              </div>
              <span className={styles.panelBadge}>10% fee</span>
            </div>

            <div className={styles.giftGrid}>
              {giftCards.map((item) => (
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
                    <span className={styles.giftTag}>{getGiftCardTag(item.brand)}</span>
                  </div>

                  <div className={styles.giftValue}>€ {formatMoney(item.value_eur)}</div>
                  <div className={styles.giftCost}>{formatMoney(item.price_gufo)} GUFO</div>
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
                  <strong>€ {formatMoney(selectedGiftCardData.value_eur)}</strong>
                </div>

                <div className={styles.selectionRow}>
                  <span>Commissione</span>
                  <strong>{formatMoney(selectedGiftCardData.fee_amount_gufo)} GUFO</strong>
                </div>

                <div className={styles.selectionRow}>
                  <span>Costo totale</span>
                  <strong>{formatMoney(selectedGiftCardData.price_gufo)} GUFO</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.secondaryBtnWide}
              onClick={handleRedeemGiftCard}
              disabled={giftCardLoading || !selectedGiftCardData}
            >
              {giftCardLoading ? "Riscatto in corso..." : "Riscatta gift card"}
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
                <strong>{formatMoney(rewardData.balanceGufo)}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Wallet EUR</span>
                <strong>€ {formatMoney(rewardData.balanceEuro)}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Premio stagione</span>
                <strong>{seasonalRewardUnlocked ? "Disponibile" : "Non disponibile"}</strong>
              </div>

              <div className={styles.summaryItem}>
                <span>Ultimo reset stagione</span>
                <strong>{rewardData.lastSeasonReset || "-"}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}