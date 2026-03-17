"use client";

import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="home-page">
      <style>{homeStyles}</style>

      <div className="home-container">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              Cashback • Loyalty • Partner network
            </div>

            <h1 className="hero-title">GUFO</h1>

            <p className="hero-subtitle">
              Il cashback intelligente per i negozi locali.
            </p>

            <p className="hero-description">
              GUFO collega utenti e negozi partner in un ecosistema semplice:
              il cliente mostra il proprio codice, il partner registra il
              pagamento e il cashback viene aggiornato in tempo reale nel wallet.
            </p>

            <div className="hero-buttons">
              <Link href="/partner-demo" className="btn btn-primary">
                Prova la demo partner
              </Link>

              <Link href="/dashboard" className="btn btn-secondary">
                Apri la dashboard
              </Link>

              <Link href="/customer-code" className="btn btn-success">
                Vedi il codice GUFO
              </Link>
            </div>

            <div className="hero-tags">
              <span className="hero-tag">Wallet utente</span>
              <span className="hero-tag">Dashboard partner</span>
              <span className="hero-tag">Sistema cashback</span>
              <span className="hero-tag">Demo online</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="logo-shell">
              <div className="logo-card">
                <Image
                  src="/logo-gufo.png"
                  alt="Logo GUFO"
                  width={420}
                  height={420}
                  className="hero-logo"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Perché GUFO</h2>
            <p className="section-text">
              Un sistema loyalty moderno, semplice da usare e pensato per i
              negozi locali.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-number">01</div>
              <h3 className="feature-title">Cashback automatico</h3>
              <p className="feature-text">
                Ogni pagamento genera GUFO in base al livello del cliente e alle
                regole del programma.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">02</div>
              <h3 className="feature-title">Esperienza semplice</h3>
              <p className="feature-text">
                Codice cliente o QR, ricerca rapida e registrazione pagamento in
                pochi secondi.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">03</div>
              <h3 className="feature-title">Dati e controllo</h3>
              <p className="feature-text">
                Wallet, storico transazioni, membership e dashboard partner in
                un’unica esperienza coerente.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Come funziona</h2>
            <p className="section-text">
              Un flusso semplice, veloce e adatto a una demo reale.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Mostra il codice GUFO</h3>
              <p className="step-text">
                Il cliente apre il proprio codice o QR e lo mostra al partner.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Il partner registra il pagamento</h3>
              <p className="step-text">
                Il negozio inserisce merchant e importo nella Partner Demo.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Wallet aggiornato</h3>
              <p className="step-text">
                GUFO aggiorna saldo, cashback, membership e storico transazioni.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Accesso rapido alla demo</h2>
            <p className="section-text">
              Le sezioni principali del prodotto già disponibili.
            </p>
          </div>

          <div className="quick-grid">
            <Link href="/dashboard" className="quick-card">
              <div className="quick-title">Dashboard</div>
              <div className="quick-text">
                Panoramica utente, statistiche e attività recente.
              </div>
            </Link>

            <Link href="/wallet" className="quick-card">
              <div className="quick-title">Wallet</div>
              <div className="quick-text">
                Saldo GUFO, saldo euro, cashback e storico movimenti.
              </div>
            </Link>

            <Link href="/partner-demo" className="quick-card">
              <div className="quick-title">Partner Demo</div>
              <div className="quick-text">
                Ricerca cliente e simulazione di pagamento partner.
              </div>
            </Link>

            <Link href="/partner-dashboard" className="quick-card">
              <div className="quick-title">Partner Dashboard</div>
              <div className="quick-text">
                Statistiche aggregate e ultime transazioni partner.
              </div>
            </Link>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-badge">Versione demo online</div>
          <h2 className="cta-title">GUFO è già una web app funzionante</h2>
          <p className="cta-text">
            Frontend, backend, database, wallet, membership, codice cliente,
            partner demo e partner dashboard sono già integrati nella demo.
          </p>

          <div className="cta-buttons">
            <Link href="/partner-demo" className="btn btn-primary">
              Avvia una demo
            </Link>

            <Link href="/profile" className="btn btn-secondary">
              Apri il profilo
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const homeStyles = `
  * {
    box-sizing: border-box;
  }

  .home-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top, rgba(59,130,246,0.20), transparent 30%),
      linear-gradient(180deg, #081120 0%, #0f1d36 48%, #081120 100%);
    color: white;
    padding: 44px 20px 70px;
  }

  .home-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .hero-section {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 36px;
    align-items: center;
    margin-bottom: 70px;
  }

  .hero-badge {
    display: inline-block;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(148, 163, 184, 0.14);
    color: #dbe7ff;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 18px;
  }

  .hero-title {
    margin: 0 0 14px 0;
    font-size: 74px;
    line-height: 0.95;
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .hero-subtitle {
    margin: 0 0 16px 0;
    font-size: 31px;
    line-height: 1.2;
    font-weight: 700;
    color: #f3f7ff;
    max-width: 680px;
  }

  .hero-description {
    margin: 0 0 28px 0;
    max-width: 700px;
    color: #c8d4e8;
    font-size: 17px;
    line-height: 1.75;
  }

  .hero-buttons,
  .cta-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    padding: 14px 22px;
    border-radius: 14px;
    text-decoration: none;
    font-weight: 700;
    transition: transform 0.18s ease, opacity 0.18s ease, background 0.18s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
    opacity: 0.96;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
    box-shadow: 0 12px 30px rgba(59, 130, 246, 0.22);
  }

  .btn-success {
    background: #22c55e;
    color: white;
    box-shadow: 0 12px 30px rgba(34, 197, 94, 0.20);
  }

  .btn-secondary {
    background: rgba(15, 23, 42, 0.88);
    color: white;
    border: 1px solid rgba(148, 163, 184, 0.18);
  }

  .hero-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 22px;
  }

  .hero-tag {
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(148, 163, 184, 0.12);
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }

  .hero-visual {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-shell {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .logo-card {
    width: 100%;
    max-width: 3200px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(148, 163, 184, 0.14);
    border-radius: 28px;
    padding: 18px;
    box-shadow: 0 22px 60px rgba(0,0,0,0.28);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .hero-logo {
    width: 100%;
    height: auto;
    max-width: 260px;
    object-fit: contain;
    border-radius: 18px;
  }

  .section {
    margin-bottom: 70px;
  }

  .section-header {
    max-width: 760px;
    margin-bottom: 24px;
  }

  .section-title {
    margin: 0 0 10px 0;
    font-size: 40px;
    line-height: 1.1;
    font-weight: 800;
  }

  .section-text {
    margin: 0;
    color: #c8d4e8;
    font-size: 16px;
    line-height: 1.7;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .feature-card,
  .step-card,
  .quick-card {
    background: rgba(17, 24, 39, 0.72);
    border: 1px solid rgba(148, 163, 184, 0.10);
    border-radius: 24px;
    padding: 24px;
    min-width: 0;
  }

  .feature-number {
    color: #60a5fa;
    font-size: 14px;
    font-weight: 800;
    margin-bottom: 12px;
    letter-spacing: 0.08em;
  }

  .feature-title,
  .step-title,
  .quick-title {
    margin: 0 0 10px 0;
    font-size: 24px;
    line-height: 1.2;
    font-weight: 700;
    color: white;
  }

  .feature-text,
  .step-text,
  .quick-text {
    margin: 0;
    color: #cbd5e1;
    font-size: 15px;
    line-height: 1.7;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .step-number {
    margin-bottom: 12px;
    font-size: 38px;
    line-height: 1;
    font-weight: 800;
    color: #60a5fa;
  }

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }

  .quick-card {
    text-decoration: none;
    transition: transform 0.18s ease, background 0.18s ease;
  }

  .quick-card:hover {
    transform: translateY(-2px);
    background: rgba(23, 32, 49, 0.92);
  }

  .cta-section {
    background: linear-gradient(180deg, rgba(17,24,39,0.92) 0%, rgba(10,15,27,0.95) 100%);
    border: 1px solid rgba(148, 163, 184, 0.10);
    border-radius: 30px;
    padding: 38px 24px;
    text-align: center;
    box-shadow: 0 18px 50px rgba(0,0,0,0.24);
  }

  .cta-badge {
    display: inline-block;
    margin-bottom: 16px;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(59, 130, 246, 0.14);
    border: 1px solid rgba(59, 130, 246, 0.22);
    color: #bfdbfe;
    font-size: 13px;
    font-weight: 700;
  }

  .cta-title {
    margin: 0 0 14px 0;
    font-size: 42px;
    line-height: 1.1;
    font-weight: 800;
  }

  .cta-text {
    max-width: 760px;
    margin: 0 auto 24px auto;
    color: #cbd5e1;
    font-size: 17px;
    line-height: 1.75;
  }

  .cta-buttons {
    justify-content: center;
  }

  @media (max-width: 1024px) {
    .hero-section {
      grid-template-columns: 1fr;
    }

    .features-grid,
    .steps-grid {
      grid-template-columns: 1fr;
    }

    .quick-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hero-title {
      font-size: 60px;
    }

    .hero-subtitle {
      font-size: 28px;
    }

    .section-title {
      font-size: 34px;
    }

    .cta-title {
      font-size: 34px;
    }
  }

  @media (max-width: 768px) {
    .home-page {
      padding: 34px 16px 52px;
    }

    .hero-section {
      gap: 24px;
      margin-bottom: 52px;
    }

    .hero-title {
      font-size: 42px;
    }

    .hero-subtitle {
      font-size: 22px;
    }

    .hero-description {
      font-size: 15px;
      margin-bottom: 22px;
    }

    .hero-buttons,
    .cta-buttons {
      flex-direction: column;
      align-items: stretch;
    }

    .btn {
      width: 100%;
    }

    .hero-tags {
      gap: 8px;
    }

    .hero-tag {
      font-size: 12px;
    }

    .logo-card {
      max-width: 320px;
      padding: 18px;
      border-radius: 22px;
    }

    .hero-logo {
      max-width: 240px;
    }

    .section {
      margin-bottom: 52px;
    }

    .section-title {
      font-size: 28px;
    }

    .section-text {
      font-size: 14px;
    }

    .feature-card,
    .step-card,
    .quick-card {
      padding: 18px;
      border-radius: 18px;
    }

    .feature-title,
    .step-title,
    .quick-title {
      font-size: 21px;
    }

    .feature-text,
    .step-text,
    .quick-text {
      font-size: 14px;
    }

    .quick-grid {
      grid-template-columns: 1fr;
    }

    .cta-section {
      padding: 28px 16px;
      border-radius: 22px;
    }

    .cta-title {
      font-size: 28px;
    }

    .cta-text {
      font-size: 15px;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 36px;
    }

    .hero-subtitle {
      font-size: 20px;
    }

    .section-title {
      font-size: 24px;
    }

    .cta-title {
      font-size: 24px;
    }
  }
`;