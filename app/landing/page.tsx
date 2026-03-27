"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./landing.module.css";

const howItWorks = [
  {
    step: "01",
    title: "Il cliente entra in GUFO",
    text: "L’utente crea il proprio account, accede alla piattaforma e ottiene customer code, wallet e profilo personale.",
  },
  {
    step: "02",
    title: "Mostra codice o QR",
    text: "Al momento dell’acquisto il cliente mostra il proprio codice GUFO o il QR direttamente dal telefono.",
  },
  {
    step: "03",
    title: "Il partner registra la vendita",
    text: "Il partner identifica il cliente, registra l’importo e applica il cashback previsto dalla propria attività.",
  },
  {
    step: "04",
    title: "GUFO si aggiorna in tempo reale",
    text: "Wallet, transazioni, livello e progressi stagionali si aggiornano in un unico ecosistema digitale.",
  },
];

const whyGufo = [
  {
    title: "Cashback deciso dal partner",
    text: "Il cashback non è fisso per tutti: ogni partner può definire la propria logica reward e rendere l’offerta più strategica.",
  },
  {
    title: "Wallet visibile e chiaro",
    text: "Il cliente vede saldo GUFO, storico movimenti, livello e attività in modo semplice, moderno e mobile friendly.",
  },
  {
    title: "Livelli stagionali",
    text: "La membership segue la spesa stagionale e costruisce una progressione reale dentro l’ecosistema GUFO.",
  },
  {
    title: "Premi e fidelizzazione",
    text: "GUFO non è solo cashback: è una piattaforma che punta a far tornare il cliente nel tempo.",
  },
];

const clientBenefits = [
  "wallet GUFO sempre aggiornato",
  "customer code e QR pronti in negozio",
  "storico transazioni e movimenti",
  "livelli stagionali e progressione",
  "premi, vantaggi e missioni future",
];

const partnerBenefits = [
  "identificazione rapida del cliente",
  "registrazione pagamento semplice",
  "cashback associato alla vendita",
  "dashboard con volumi e transazioni",
  "strumento reale per fidelizzare",
];

const quickLinks = [
  {
    href: "/dashboard",
    title: "Dashboard",
    text: "Panoramica generale dell’account e delle attività.",
  },
  {
    href: "/wallet",
    title: "Wallet",
    text: "Saldo GUFO, valore convertibile e movimenti recenti.",
  },
  {
    href: "/membership",
    title: "Membership",
    text: "Livello attuale, progressi e percorso stagionale.",
  },
  {
    href: "/customer-code",
    title: "Customer Code",
    text: "Codice cliente e QR da mostrare al partner.",
  },
  {
    href: "/transactions",
    title: "Transactions",
    text: "Storico completo con filtro e consultazione rapida.",
  },
  {
    href: "/profile",
    title: "Profile",
    text: "Identità account, stato e dati principali.",
  },
  {
    href: "/partner-demo",
    title: "Partner Demo",
    text: "Lookup cliente e simulazione pagamento partner.",
  },
  {
    href: "/partner-dashboard",
    title: "Partner Dashboard",
    text: "Analytics merchant e transazioni recenti.",
  },
];

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.bgOverlay} />
      <div className={styles.rainbowLine} />

      <div className={styles.container}>
        <header className={styles.topbar}>
          <div className={styles.topbarBrand}>
            <div className={styles.brandPill}>GUFO Rainbow</div>
          </div>

          <div className={styles.topbarActions}>
            <Link
              href="/login"
              className={`${styles.topbarBtn} ${styles.topbarBtnSecondary}`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`${styles.topbarBtn} ${styles.topbarBtnPrimary}`}
            >
              Register
            </Link>
          </div>
        </header>

        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              Cashback • Wallet • Membership • Partner Network
            </div>

            <h1 className={styles.heroTitle}>
              GUFO
              <span className={styles.heroTitleGlow}> Rainbow</span>
            </h1>

            <p className={styles.heroSubtitle}>
              La piattaforma che unisce cashback, wallet digitale e ritorno
              cliente in un’unica esperienza.
            </p>

            <p className={styles.heroDescription}>
              Con GUFO il cliente mostra il proprio codice o QR, il partner
              registra l’acquisto e il sistema aggiorna wallet, transazioni,
              progressione stagionale e reward in tempo reale.
            </p>

            <div className={styles.heroButtons}>
              <Link
                href="/register"
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                Crea account
              </Link>

              <Link
                href="/login"
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                Accedi
              </Link>

              <Link
                href="/partner-demo"
                className={`${styles.btn} ${styles.btnDark}`}
              >
                Demo partner
              </Link>
            </div>

            <div className={styles.heroTags}>
              <span className={styles.heroTag}>Cashback partner-based</span>
              <span className={styles.heroTag}>Wallet live</span>
              <span className={styles.heroTag}>Livelli stagionali</span>
              <span className={styles.heroTag}>QR cliente</span>
              <span className={styles.heroTag}>Analytics partner</span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={`${styles.visualCard} ${styles.neonBorder}`}>
              <div className={`${styles.visualOrb} ${styles.orbOne}`} />
              <div className={`${styles.visualOrb} ${styles.orbTwo}`} />
              <div className={`${styles.visualOrb} ${styles.orbThree}`} />

              <div className={styles.visualTopline}>GUFO RAINBOW ECOSYSTEM</div>

              <div className={styles.logoShell}>
                <Image
                  src="/logo-gufo.png"
                  alt="Logo GUFO"
                  width={420}
                  height={420}
                  className={styles.heroLogo}
                  priority
                />
              </div>

              <div className={styles.visualStats}>
                <div className={styles.visualStat}>
                  <span className={styles.visualStatLabel}>Cliente</span>
                  <strong className={styles.visualStatValue}>
                    Wallet + QR + Livello
                  </strong>
                </div>

                <div className={styles.visualStat}>
                  <span className={styles.visualStatLabel}>Partner</span>
                  <strong className={styles.visualStatValue}>
                    Lookup + Pagamento + Reward
                  </strong>
                </div>

                <div className={styles.visualStat}>
                  <span className={styles.visualStatLabel}>Core GUFO</span>
                  <strong className={styles.visualStatValue}>
                    Acquisto → GUFO → Fidelizzazione
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.heroStats}>
          <div className={`${styles.heroStatCard} ${styles.neonBorder}`}>
            <div className={styles.heroStatLabel}>Wallet</div>
            <div className={styles.heroStatValue}>Saldo, movimenti e GUFO</div>
            <div className={styles.heroStatText}>
              Il cliente controlla tutto in un’unica area chiara, moderna e mobile.
            </div>
          </div>

          <div className={`${styles.heroStatCard} ${styles.neonBorder}`}>
            <div className={styles.heroStatLabel}>Membership</div>
            <div className={styles.heroStatValue}>Bronze • Silver • Gold • VIP • Elite</div>
            <div className={styles.heroStatText}>
              Il percorso cresce nel tempo con la spesa stagionale e l’attività nell’ecosistema.
            </div>
          </div>

          <div className={`${styles.heroStatCard} ${styles.neonBorder}`}>
            <div className={styles.heroStatLabel}>Partner</div>
            <div className={styles.heroStatValue}>Vendita, reward e ritorno cliente</div>
            <div className={styles.heroStatText}>
              Il partner usa GUFO per registrare transazioni e costruire fidelizzazione reale.
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Come funziona</h2>
            <p className={styles.sectionText}>
              Un flusso semplice che collega cliente, partner e reward in un’unica esperienza.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {howItWorks.map((item) => (
              <div key={item.step} className={`${styles.stepCard} ${styles.neonBorder}`}>
                <div className={styles.stepNumber}>{item.step}</div>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepText}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Perché GUFO Rainbow</h2>
            <p className={styles.sectionText}>
              Una piattaforma loyalty moderna pensata per clienti reali, negozi locali e una demo startup forte.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {whyGufo.map((item, index) => (
              <div key={item.title} className={`${styles.featureCard} ${styles.neonBorder}`}>
                <div className={styles.featureNumber}>
                  {(index + 1).toString().padStart(2, "0")}
                </div>
                <h3 className={styles.featureTitle}>{item.title}</h3>
                <p className={styles.featureText}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.dualSection}>
          <div className={`${styles.dualCard} ${styles.neonBorder}`}>
            <div className={styles.dualEyebrow}>Cliente</div>
            <h3 className={styles.dualTitle}>Un wallet che continua a crescere</h3>
            <ul className={styles.cleanList}>
              {clientBenefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={`${styles.dualCard} ${styles.neonBorder}`}>
            <div className={styles.dualEyebrow}>Partner</div>
            <h3 className={styles.dualTitle}>Uno strumento concreto per fidelizzare</h3>
            <ul className={styles.cleanList}>
              {partnerBenefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Accesso rapido</h2>
            <p className={styles.sectionText}>
              Le aree principali della web app GUFO già disponibili.
            </p>
          </div>

          <div className={styles.quickGrid}>
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.quickCard} ${styles.neonBorder}`}
              >
                <div className={styles.quickTitle}>{item.title}</div>
                <div className={styles.quickText}>{item.text}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${styles.ctaSection} ${styles.neonBorder}`}>
          <div className={styles.ctaBadge}>GUFO Rainbow online</div>
          <h2 className={styles.ctaTitle}>Entra nella piattaforma</h2>
          <p className={styles.ctaText}>
            Cliente e partner condividono lo stesso ecosistema: più semplice da usare,
            più forte in demo, più chiaro da raccontare.
          </p>

          <div className={styles.ctaButtons}>
            <Link
              href="/register"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Register
            </Link>

            <Link
              href="/login"
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}