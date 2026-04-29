"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";
import styles from "./partner-detail.module.css";

const supabase = createClient();

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

type Partner = {
  id: number;
  name: string;
  category: string;
  cashback_percent: number;
  rating_average: number;
  reviews_count: number;
  location: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  instagram_url?: string;
  website_url?: string;
  logo_url?: string;
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
  verified: boolean;
};

type VoucherResult = {
  code: string;
  amount: number;
  partnerName: string;
};

function PartnerDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const partnerId = String(params?.partnerId || "");
  const isGiftCardMode = searchParams.get("mode") === "gift-card";

  const [partner, setPartner] = useState<Partner | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);

  const [error, setError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");

  const [voucherAmount, setVoucherAmount] = useState("10");
  const [voucherResult, setVoucherResult] = useState<VoucherResult | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [partnerRes, reviewsRes] = await Promise.all([
        fetch(`${API_URL}/partners/${partnerId}`, { cache: "no-store" }),
        fetch(`${API_URL}/partners/${partnerId}/reviews`, { cache: "no-store" }),
      ]);

      const partnerData = await partnerRes.json();
      const reviewsData = await reviewsRes.json();

      if (!partnerRes.ok || !partnerData.success) {
        throw new Error(partnerData.error || "Errore caricamento partner");
      }

      if (!reviewsRes.ok || !reviewsData.success) {
        throw new Error(reviewsData.error || "Errore caricamento recensioni");
      }

      setPartner(partnerData.partner);
      setReviews(Array.isArray(reviewsData.reviews) ? reviewsData.reviews : []);
    } catch (err: any) {
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (partnerId) loadData();
  }, [partnerId]);

  async function submitReview() {
    try {
      setReviewLoading(true);
      setReviewMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        throw new Error("Devi essere loggato per lasciare una recensione");
      }

      const res = await fetch(`${API_URL}/partners/${partnerId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Errore salvataggio recensione");
      }

      setReviewMessage("Recensione verificata salvata con successo ✅");
      setComment("");
      setRating(5);
      await loadData();
    } catch (err: any) {
      setReviewMessage(err.message || "Errore recensione");
    } finally {
      setReviewLoading(false);
    }
  }

  async function createPartnerVoucher() {
    try {
      setVoucherLoading(true);
      setVoucherMessage("");
      setVoucherResult(null);
      setError("");

      const amountGufo = Number(voucherAmount);

      if (!Number.isFinite(amountGufo) || amountGufo <= 0) {
        throw new Error("Inserisci un importo GUFO valido");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        throw new Error("Devi essere loggato per usare GUFO presso un partner");
      }

      const res = await fetch(`${API_URL}/partner-vouchers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partner_id: Number(partnerId),
          amount_gufo: amountGufo,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Errore creazione voucher partner");
      }

      const code = data.voucher?.code || "generato";

      setVoucherResult({
        code,
        amount: amountGufo,
        partnerName: partner?.name || "Partner GUFO",
      });

      setVoucherMessage("Voucher creato correttamente ✅");
    } catch (err: any) {
      setVoucherMessage(err.message || "Errore voucher partner");
    } finally {
      setVoucherLoading(false);
    }
  }

  function copyVoucherCode() {
    if (!voucherResult?.code) return;

    navigator.clipboard.writeText(voucherResult.code);
    setVoucherMessage("Codice voucher copiato ✅");
  }

  async function downloadVoucher() {
    try {
      if (!voucherResult) return;

      const qrCanvas = document.querySelector("canvas");

      if (!qrCanvas) {
        alert("QR non trovato");
        return;
      }

      const qrImage = qrCanvas.toDataURL("image/png");

      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");

      if (!ctx) return;

      finalCanvas.width = 700;
      finalCanvas.height = 900;

      ctx.fillStyle = "#081225";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px Arial";
      ctx.fillText("GUFO Voucher", 220, 80);

      ctx.font = "28px Arial";
      ctx.fillText(`Partner: ${voucherResult.partnerName}`, 60, 160);
      ctx.fillText(`Importo: ${voucherResult.amount.toFixed(2)} GUFO`, 60, 220);
      ctx.fillText(`Codice: ${voucherResult.code}`, 60, 280);

      const qrImg = new Image();

      qrImg.onload = () => {
        ctx.drawImage(qrImg, 170, 340, 350, 350);

        ctx.font = "24px Arial";
        ctx.fillStyle = "#00f5a0";
        ctx.fillText("Mostra questo voucher al partner", 170, 750);

        const link = document.createElement("a");
        link.href = finalCanvas.toDataURL("image/png");
        link.download = `voucher-gufo-${voucherResult.code}.png`;
        link.click();
      };

      qrImg.src = qrImage;
    } catch (err) {
      console.error(err);
      alert("Errore download voucher");
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.stateBox}>Caricamento locale...</div>
      </main>
    );
  }

  if (error || !partner) {
    return (
      <main className={styles.page}>
        <div className={styles.errorBox}>{error || "Partner non trovato"}</div>
        <Link href="/marketplace" className={styles.backButton}>
          ← Torna al marketplace
        </Link>
      </main>
    );
  }

  const location = partner.address || partner.city || partner.location || "Zona partner";

  return (
    <main className={styles.page}>
      <div className={styles.bgGlowA} />
      <div className={styles.bgGlowB} />

      <section className={styles.hero}>
        <Link
          href={isGiftCardMode ? "/marketplace?mode=gift-card" : "/marketplace"}
          className={styles.backLink}
        >
          ← Marketplace
        </Link>

        <div className={styles.logoHeroBox}>
          {partner.logo_url ? (
            <img src={partner.logo_url} alt={partner.name} className={styles.logoHeroImg} />
          ) : (
            <div className={styles.logoHeroFallback}>🦉</div>
          )}
        </div>

        <div className={styles.category}>{partner.category || "Partner GUFO"}</div>

        <h1>{partner.name}</h1>

        <p>
          {partner.description ||
            "Locale partner GUFO con cashback attivo, recensioni verificate e missioni collegabili alle abitudini reali degli utenti."}
        </p>

        <div className={styles.heroStats}>
          <div>
            <strong>{partner.cashback_percent || 0}%</strong>
            <span>Cashback</span>
          </div>

          <div>
            <strong>
              {partner.rating_average > 0 ? partner.rating_average.toFixed(1) : "N/D"}
            </strong>
            <span>Rating medio</span>
          </div>

          <div>
            <strong>{partner.reviews_count}</strong>
            <span>Recensioni</span>
          </div>
        </div>
      </section>

      <section className={styles.infoPanel}>
        <h2>Informazioni locale</h2>

        <div className={styles.infoGrid}>
          <div>
            <span>📍 Indirizzo</span>
            <strong>{location}</strong>
          </div>

          <div>
            <span>🏙️ Città</span>
            <strong>{partner.city || "--"}</strong>
          </div>

          <div>
            <span>📞 Telefono</span>
            <strong>{partner.phone || "--"}</strong>
          </div>

          <div>
            <span>💸 Cashback</span>
            <strong>{partner.cashback_percent || 0}%</strong>
          </div>
        </div>

        <div className={styles.linkRow}>
          {partner.instagram_url && (
            <a href={partner.instagram_url} target="_blank" rel="noreferrer">
              Instagram
            </a>
          )}

          {partner.website_url && (
            <a href={partner.website_url} target="_blank" rel="noreferrer">
              Sito web
            </a>
          )}
        </div>
      </section>

      {isGiftCardMode ? (
        <section className={styles.voucherPanel}>
          <div>
            <p className={styles.voucherEyebrow}>Gift card partner</p>
            <h2>Usa GUFO da {partner.name}</h2>
            <p>
              Crea un voucher utilizzabile presso questo partner con 0% commissioni.
              L’importo verrà scalato dal tuo saldo GUFO.
            </p>
          </div>

          <label className={styles.voucherField}>
            Importo GUFO
            <input
              type="number"
              min="1"
              step="1"
              value={voucherAmount}
              onChange={(event) => setVoucherAmount(event.target.value)}
              placeholder="Es. 10"
            />
          </label>

          <button
            type="button"
            className={styles.voucherButton}
            onClick={createPartnerVoucher}
            disabled={voucherLoading}
          >
            {voucherLoading ? "Creazione voucher..." : "Crea voucher 0% fee"}
          </button>

          {voucherMessage ? (
            <div className={styles.voucherMessage}>{voucherMessage}</div>
          ) : null}

          {voucherResult ? (
            <div className={styles.voucherDownloadBox}>
              <div className={styles.voucherQrBox}>
                <QRCodeCanvas
                  value={`voucher:${voucherResult.code}`}
                  size={180}
                  level="H"
                  includeMargin
                />
                <p>Mostra questo QR al partner</p>
              </div>

              <div>
                <span>Codice voucher</span>
                <strong>{voucherResult.code}</strong>
              </div>

              <button type="button" onClick={copyVoucherCode}>
                Copia codice
              </button>

              <button type="button" onClick={downloadVoucher}>
                Scarica voucher
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={styles.contentGrid}>
        <div className={styles.reviewsPanel}>
          <div className={styles.panelHeader}>
            <h2>Recensioni verificate</h2>
            <span>Solo utenti che hanno frequentato il locale</span>
          </div>

          {reviews.length === 0 ? (
            <div className={styles.emptyBox}>Nessuna recensione disponibile per ora.</div>
          ) : (
            <div className={styles.reviewList}>
              {reviews.map((review) => (
                <article key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewTop}>
                    <strong>{review.user_name}</strong>
                    <span>{"⭐".repeat(review.rating)}</span>
                  </div>

                  <p>{review.comment || "Nessun commento scritto."}</p>

                  <div className={styles.verifiedBadge}>✅ Recensione verificata</div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className={styles.reviewForm}>
          <h2>Lascia una recensione</h2>

          <p>
            Puoi recensire questo locale solo se hai davvero effettuato almeno un
            pagamento GUFO presso questo partner.
          </p>

          <label>
            Valutazione
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
            >
              <option value={5}>5 stelle</option>
              <option value={4}>4 stelle</option>
              <option value={3}>3 stelle</option>
              <option value={2}>2 stelle</option>
              <option value={1}>1 stella</option>
            </select>
          </label>

          <label>
            Commento
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Com'è stata la tua esperienza?"
              rows={5}
            />
          </label>

          <button type="button" onClick={submitReview} disabled={reviewLoading}>
            {reviewLoading ? "Salvataggio..." : "Invia recensione"}
          </button>

          {reviewMessage ? (
            <div className={styles.reviewMessage}>{reviewMessage}</div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

export default function PartnerDetailPage() {
  return (
    <Suspense fallback={<main className={styles.page}>Caricamento locale...</main>}>
      <PartnerDetailContent />
    </Suspense>
  );
}