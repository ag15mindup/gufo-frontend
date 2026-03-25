"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <main className={styles.page}>
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
              Cashback • Loyalty • Membership • Partner Network
            </div>

            <h1 className={styles.heroTitle}>
              GUFO
              <span className={styles.heroTitleGlow}> Rainbow Cashback</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Il cashback intelligente che collega utenti, partner e loyalty in
              un’unica esperienza premium.
            </p>

            <p className={styles.heroDescription}>
              GUFO permette al cliente di mostrare il proprio codice o QR, al
              partner di registrare il pagamento e al wallet di aggiornarsi in
              tempo reale con cashback, livello membership, saldo e storico
              transazioni.
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
                Prova demo partner
              </Link>
            </div>

            <div className={styles.heroTags}>
              <span className={styles.heroTag}>Wallet live</span>
              <span className={styles.heroTag}>Membership</span>
              <span className={styles.heroTag}>QR cliente</span>
              <span className={styles.heroTag}>Dashboard partner</span>
              <span className={styles.heroTag}>Cashback in tempo reale</span>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={`${styles.visualCard} ${styles.neonBorder}`}>
              <div className={`${styles.visualOrb} ${styles.orbOne}`} />
              <div className={`${styles.visualOrb} ${styles.orbTwo}`} />
              <div className={`${styles.visualOrb} ${styles.orbThree}`} />

              <div className={styles.visualTopline}>GUFO PREMIUM INTERFACE</div>

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
                  <span className={styles.visualStatLabel}>Wallet</span>
                  <strong className={styles.visualStatValue}>
                    Saldo + Rewards
                  </strong>
                </div>

                <div className={styles.visualStat}>
                  <span className={styles.visualStatLabel}>Partner</span>
                  <strong className={styles.visualStatValue}>
                    Pagamento live
                  </strong>
                </div>

                <div className={styles.visualStat}>
                  <span className={styles.visualStatLabel}>Membership</span>
                  <strong className={styles.visualStatValue}>
                    Livelli & progressi
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.heroStats}>
          <div className={`${styles.heroStatCard} ${styles.neonBorder}`}>
            <div className={styles.heroStatLabel}>Wallet</div>
            <div className={styles.heroStatValue}>Saldo + GUFO</div>
            <div className={styles.heroStatText}>
              Controlla saldo, cashback, valore accumulato e movimenti in
              un’unica dashboard.
            </div>
          </div>

          <div className={`${styles.heroStatCard} ${styles.neonBorder}`}>
            <div className={styles.heroStatLabel}>Membership</div>
            <div className={styles.heroStatValue}>Progressione livelli</div>
            <div className={styles.heroStatText}>
              Basic, Bronze, Silver, Gold, Platino, VIP, Elite, Diamond e
              Millionaire.
            </div>
          </div>

          <div className={`${styles.heroStatCard} ${styles.neonBorder}`}>
            <div className={styles.heroStatLabel}>Partner</div>
            <div className={styles.heroStatValue}>Cashback registrato</div>
            <div className={styles.heroStatText}>
              Il partner cerca il cliente, registra il pagamento e il wallet si
              aggiorna.
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Perché GUFO</h2>
            <p className={styles.sectionText}>
              Un sistema loyalty moderno, visivo e semplice da usare, pensato
              per clienti reali, negozi locali e demo startup di alto livello.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={`${styles.featureCard} ${styles.neonBorder}`}>
              <div className={styles.featureNumber}>01</div>
              <h3 className={styles.featureTitle}>Cashback automatico</h3>
              <p className={styles.featureText}>
                Ogni pagamento aggiorna il saldo GUFO e il cashback in base al
                livello del cliente.
              </p>
            </div>

            <div className={`${styles.featureCard} ${styles.neonBorder}`}>
              <div className={styles.featureNumber}>02</div>
              <h3 className={styles.featureTitle}>Esperienza semplice</h3>
              <p className={styles.featureText}>
                Codice cliente, QR code, ricerca rapida e registrazione
                pagamento in pochi secondi.
              </p>
            </div>

            <div className={`${styles.featureCard} ${styles.neonBorder}`}>
              <div className={styles.featureNumber}>03</div>
              <h3 className={styles.featureTitle}>Controllo completo</h3>
              <p className={styles.featureText}>
                Dashboard, wallet, membership, profilo e transazioni in un’unica
                esperienza coerente.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Come funziona</h2>
            <p className={styles.sectionText}>
              Un flusso semplice, veloce e già pronto per una demo reale.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={`${styles.stepCard} ${styles.neonBorder}`}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Registrati o accedi</h3>
              <p className={styles.stepText}>
                L’utente entra nella piattaforma e accede alla propria area
                personale GUFO.
              </p>
            </div>

            <div className={`${styles.stepCard} ${styles.neonBorder}`}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Mostra codice o QR</h3>
              <p className={styles.stepText}>
                Il cliente apre il codice GUFO e lo mostra al partner per essere
                riconosciuto.
              </p>
            </div>

            <div className={`${styles.stepCard} ${styles.neonBorder}`}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Wallet aggiornato</h3>
              <p className={styles.stepText}>
                Cashback, saldo, livello membership e storico si aggiornano in
                tempo reale.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Accesso rapido</h2>
            <p className={styles.sectionText}>
              Le sezioni principali della web app già disponibili.
            </p>
          </div>

          <div className={styles.quickGrid}>
            <Link
              href="/dashboard"
              className={`${styles.quickCard} ${styles.neonBorder}`}
            >
              <div className={styles.quickTitle}>Dashboard</div>
              <div className={styles.quickText}>
                Panoramica account, statistiche e attività recenti.
              </div>
            </Link>

            <Link
              href="/wallet"
              className={`${styles.quickCard} ${styles.neonBorder}`}
            >
              <div className={styles.quickTitle}>Wallet</div>
              <div className={styles.quickText}>
                Saldo GUFO, saldo euro, cashback e storico movimenti.
              </div>
            </Link>

            <Link
              href="/membership"
              className={`${styles.quickCard} ${styles.neonBorder}`}
            >
              <div className={styles.quickTitle}>Membership</div>
              <div className={styles.quickText}>
                Livello attuale, progressi e percorso fino a Diamond e
                Millionaire.
              </div>
            </Link>

            <Link
              href="/customer-code"
              className={`${styles.quickCard} ${styles.neonBorder}`}
            >
              <div className={styles.quickTitle}>Codice GUFO</div>
              <div className={styles.quickText}>
                Codice cliente e QR per identificazione rapida presso i partner.
              </div>
            </Link>

            <Link
              href="/transactions"
              className={`${styles.quickCard} ${styles.neonBorder}`}
            >
              <div className={styles.quickTitle}>Transazioni</div>
              <div className={styles.quickText}>
                Storico completo con filtri e riepilogo movimenti.
              </div>
            </Link>

            <Link
              href="/profile"
              className={`${styles.quickCard} ${styles.neonBorder}`}
            >
              <div className={styles.quickTitle}>Profilo</div>
              <div className={styles.quickText}>
                Dati utente, livello, cashback e ultime attività.
              </div>
            </Link>

            <Link
              href="/partner-demo"
              className={`${styles.quickCard} ${styles.neonBorder}`}
            >
              <div className={styles.quickTitle}>Partner Demo</div>
              <div className={styles.quickText}>
                Ricerca cliente e simulazione di pagamento partner.
              </div>
            </Link>

            <Link
              href="/partner-dashboard"
              className={`${styles.quickCard} ${styles.neonBorder}`}
            >
              <div className={styles.quickTitle}>Partner Dashboard</div>
              <div className={styles.quickText}>
                Statistiche aggregate e ultime transazioni partner.
              </div>
            </Link>
          </div>
        </section>

        <section className={`${styles.ctaSection} ${styles.neonBorder}`}>
          <div className={styles.ctaBadge}>Web app GUFO online</div>
          <h2 className={styles.ctaTitle}>Accedi o crea il tuo account</h2>
          <p className={styles.ctaText}>
            La piattaforma GUFO integra frontend, backend, wallet, membership,
            profilo, codice cliente, dashboard partner e demo pagamento in
            un’unica esperienza moderna, pronta per test reali e demo
            investitori.
          </p>

          <div className={styles.ctaButtons}>
            <Link
              href="/register"
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Register
            </Link>

            <Link href="/login" className={`${styles.btn} ${styles.btnSecondary}`}>
              Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}