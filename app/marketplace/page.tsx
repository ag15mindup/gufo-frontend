"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./marketplace.module.css";

type Partner = {
  id: number;
  name: string;
  category: string;
  cashback_percent: number;
  rating_average: number;
  reviews_count: number;
  location: string;
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

  useEffect(() => {
    async function loadPartners() {
      try {
        setLoading(true);
        setError("");
        const filteredPartners = partners.filter((partner) => {
  const matchesSearch =
    partner.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

  const matchesCategory =
    selectedCategory === "all"
      ? true
      : partner.category?.toLowerCase() === selectedCategory.toLowerCase();

  const matchesCashback =
    Number(partner.cashback_percent || 0) >= minCashback;

  return matchesSearch && matchesCategory && matchesCashback;
});

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

const filteredPartners = partners.filter((partner: Partner) => {
  const categoryMatch =
    selectedCategory === "all" ||
    partner.category?.toLowerCase() === selectedCategory.toLowerCase();

  const cashbackMatch =
    Number(partner.cashback_percent || 0) >= minCashback;

  return categoryMatch && cashbackMatch;
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

        <h1>Scopri dove guadagnare GUFO</h1>

        <p>
          Trova locali partner, controlla cashback, recensioni verificate e scegli
          dove completare le tue missioni.
        </p>
      </section>

<section className={styles.filters}>
  <input
    type="text"
    placeholder="Cerca locale..."
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
      ) : partners.length === 0 ? (
        <div className={styles.stateBox}>
          Nessun partner disponibile al momento.
        </div>
      ) : (
        <section className={styles.grid}>
      {filteredPartners.map((partner) => (
            <article key={partner.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <span className={styles.category}>{partner.category}</span>
                  <h2>{partner.name}</h2>
                </div>

                <div className={styles.cashback}>
                  {partner.cashback_percent || 0}%
                  <span>cashback</span>
                </div>
              </div>

              <div className={styles.meta}>
                <span>📍 {partner.location || "Zona partner"}</span>
                <span>
                  ⭐{" "}
                  {partner.rating_average > 0
                    ? partner.rating_average.toFixed(1)
                    : "N/D"}{" "}
                  ({partner.reviews_count} recensioni)
                </span>
              </div>

              <div className={styles.infoBox}>
                <strong>Recensioni verificate</strong>
                <span>
                  Solo chi ha realmente frequentato questo locale può recensirlo.
                </span>
              </div>

              <Link href={`/marketplace/${partner.id}`} className={styles.cta}>
                Vedi locale →
              </Link>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}