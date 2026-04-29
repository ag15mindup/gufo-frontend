"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./marketplace.module.css";

type Partner = {
  id: number;
  name: string;
  category: string;
  cashback_percent: number;
  rating_average: number;
  reviews_count: number;
  location: string;
  address?: string;
  city?: string;
  logo_url?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

export default function MarketplacePage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minCashback, setMinCashback] = useState(0);

const searchParams = useSearchParams();
const isGiftCardMode = searchParams.get("mode") === "gift-card";

  useEffect(() => {
    async function loadPartners() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_URL}/partners`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Errore caricamento marketplace");
        }

        setPartners(Array.isArray(data.partners) ? data.partners : []);
      } catch (err: any) {
        setError(err.message || "Errore sconosciuto");
      } finally {
        setLoading(false);
      }
    }

    loadPartners();
  }, []);

  const filteredPartners = partners.filter((partner) => {
    const search = searchTerm.toLowerCase();

    const searchMatch =
      partner.name.toLowerCase().includes(search) ||
      String(partner.category || "").toLowerCase().includes(search) ||
      String(partner.city || "").toLowerCase().includes(search) ||
      String(partner.address || "").toLowerCase().includes(search);

    const categoryMatch =
      selectedCategory === "all" ||
      String(partner.category || "").toLowerCase() ===
        selectedCategory.toLowerCase();

    const cashbackMatch = Number(partner.cashback_percent || 0) >= minCashback;

    return searchMatch && categoryMatch && cashbackMatch;
  });

  return (
    <main className={styles.page}>
      <div className={styles.bgGlowA} />
      <div className={styles.bgGlowB} />

     <section className={styles.hero}>
  <Link href="/dashboard" className={styles.backLink}>
    ← Torna alla dashboard
  </Link>

  <div className={styles.badge}>Marketplace GUFO</div>

  <h1>
    {isGiftCardMode
      ? "Scegli dove usare i tuoi GUFO"
      : "Scopri dove guadagnare GUFO"}
  </h1>

  <p>
    {isGiftCardMode
      ? "Seleziona un partner locale e usa i tuoi GUFO con 0% commissioni."
      : "Trova locali partner, controlla cashback, recensioni verificate e scegli dove completare le tue missioni."}
  </p>
</section>

<section className={styles.filters}></section>

      <section className={styles.filters}>
        <input
          type="text"
          placeholder="Cerca locale, categoria o città..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">Tutte categorie</option>
          <option value="bar">Bar</option>
          <option value="ristorante">Ristorante</option>
          <option value="pub">Pub</option>
          <option value="caffetteria">Caffetteria</option>
          <option value="pizzeria">Pizzeria</option>
        </select>

        <select
          value={minCashback}
          onChange={(e) => setMinCashback(Number(e.target.value))}
          className={styles.filterSelect}
        >
          <option value={0}>Tutti cashback</option>
          <option value={2}>Min 2%</option>
          <option value={5}>Min 5%</option>
          <option value={10}>Min 10%</option>
        </select>
      </section>

      {loading ? (
        <div className={styles.stateBox}>Caricamento partner...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : filteredPartners.length === 0 ? (
        <div className={styles.stateBox}>
          Nessun partner trovato con questi filtri.
        </div>
      ) : (
        <section className={styles.grid}>
          {filteredPartners.map((partner) => {
            const location =
              partner.address || partner.city || partner.location || "Zona partner";

            return (
              <article key={partner.id} className={styles.card}>
                <div className={styles.logoBox}>
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className={styles.logoImg}
                    />
                  ) : (
                    <div className={styles.logoFallback}>🦉</div>
                  )}
                </div>

                <div className={styles.cardTop}>
                  <div>
                    <span className={styles.category}>
                      {partner.category || "Partner GUFO"}
                    </span>

                    <h2>{partner.name}</h2>
                  </div>

                  <div className={styles.cashback}>
                    {Number(partner.cashback_percent || 0).toFixed(0)}%
                    <span>cashback</span>
                  </div>
                </div>

                <div className={styles.meta}>
                  <span>📍 {location}</span>

                  <span>
                    ⭐{" "}
                    {partner.rating_average > 0
                      ? partner.rating_average.toFixed(1)
                      : "N/D"}{" "}
                    ({partner.reviews_count} recensioni)
                  </span>
                </div>

                <Link
  href={
    isGiftCardMode
      ? `/marketplace/${partner.id}?mode=gift-card`
      : `/marketplace/${partner.id}`
  }
  className={styles.cta}
>
  {isGiftCardMode ? "Usa GUFO →" : "Vedi locale →"}
</Link>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}