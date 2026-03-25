"use client";

import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="home-page">
      <style>{homeStyles}</style>

      <div className="home-container">
        <header className="topbar">
          <div className="topbar-brand">
            <div className="brand-pill">GUFO Rainbow</div>
          </div>

          <div className="topbar-actions">
            <Link href="/login" className="topbar-btn topbar-btn-secondary">
              Login
            </Link>
            <Link href="/register" className="topbar-btn topbar-btn-primary">
              Register
            </Link>
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              Cashback • Loyalty • Membership • Partner Network
            </div>

            <h1 className="hero-title">
              GUFO
              <span className="hero-title-glow"> Rainbow Cashback</span>
            </h1>

            <p className="hero-subtitle">
              Il cashback intelligente che collega utenti, partner e loyalty in
              un’unica esperienza premium.
            </p>

            <p className="hero-description">
              GUFO permette al cliente di mostrare il proprio codice o QR, al
              partner di registrare il pagamento e al wallet di aggiornarsi in
              tempo reale con cashback, livello membership, saldo e storico
              transazioni.
            </p>

            <div className="hero-buttons">
              <Link href="/register" className="btn btn-primary">
                Crea account
              </Link>

              <Link href="/login" className="btn btn-secondary">
                Accedi
              </Link>

              <Link href="/partner-demo" className="btn btn-dark">
                Prova demo partner
              </Link>
            </div>

            <div className="hero-tags">
              <span className="hero-tag">Wallet live</span>
              <span className="hero-tag">Membership</span>
              <span className="hero-tag">QR cliente</span>
              <span className="hero-tag">Dashboard partner</span>
              <span className="hero-tag">Cashback in tempo reale</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card neon-border">
              <div className="visual-orb orb-one" />
              <div className="visual-orb orb-two" />
              <div className="visual-orb orb-three" />

              <div className="visual-topline">GUFO PREMIUM INTERFACE</div>

              <div className="logo-shell">
                <Image
                  src="/logo-gufo.png"
                  alt="Logo GUFO"
                  width={420}
                  height={420}
                  className="hero-logo"
                  priority
                />
              </div>

              <div className="visual-stats">
                <div className="visual-stat">
                  <span className="visual-stat-label">Wallet</span>
                  <strong className="visual-stat-value">Saldo + Rewards</strong>
                </div>

                <div className="visual-stat">
                  <span className="visual-stat-label">Partner</span>
                  <strong className="visual-stat-value">Pagamento live</strong>
                </div>

                <div className="visual-stat">
                  <span className="visual-stat-label">Membership</span>
                  <strong className="visual-stat-value">Livelli & progressi</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hero-stats">
          <div className="hero-stat-card neon-border">
            <div className="hero-stat-label">Wallet</div>
            <div className="hero-stat-value">Saldo + GUFO</div>
            <div className="hero-stat-text">
              Controlla saldo, cashback, valore accumulato e movimenti in un’unica dashboard.
            </div>
          </div>

          <div className="hero-stat-card neon-border">
            <div className="hero-stat-label">Membership</div>
            <div className="hero-stat-value">Progressione livelli</div>
            <div className="hero-stat-text">
              Basic, Bronze, Silver, Gold, Platino, VIP, Elite, Diamond e Millionaire.
            </div>
          </div>

          <div className="hero-stat-card neon-border">
            <div className="hero-stat-label">Partner</div>
            <div className="hero-stat-value">Cashback registrato</div>
            <div className="hero-stat-text">
              Il partner cerca il cliente, registra il pagamento e il wallet si aggiorna.
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Perché GUFO</h2>
            <p className="section-text">
              Un sistema loyalty moderno, visivo e semplice da usare, pensato
              per clienti reali, negozi locali e demo startup di alto livello.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card neon-border">
              <div className="feature-number">01</div>
              <h3 className="feature-title">Cashback automatico</h3>
              <p className="feature-text">
                Ogni pagamento aggiorna il saldo GUFO e il cashback in base al livello del cliente.
              </p>
            </div>

            <div className="feature-card neon-border">
              <div className="feature-number">02</div>
              <h3 className="feature-title">Esperienza semplice</h3>
              <p className="feature-text">
                Codice cliente, QR code, ricerca rapida e registrazione pagamento in pochi secondi.
              </p>
            </div>

            <div className="feature-card neon-border">
              <div className="feature-number">03</div>
              <h3 className="feature-title">Controllo completo</h3>
              <p className="feature-text">
                Dashboard, wallet, membership, profilo e transazioni in un’unica esperienza coerente.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Come funziona</h2>
            <p className="section-text">
              Un flusso semplice, veloce e già pronto per una demo reale.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card neon-border">
              <div className="step-number">1</div>
              <h3 className="step-title">Registrati o accedi</h3>
              <p className="step-text">
                L’utente entra nella piattaforma e accede alla propria area personale GUFO.
              </p>
            </div>

            <div className="step-card neon-border">
              <div className="step-number">2</div>
              <h3 className="step-title">Mostra codice o QR</h3>
              <p className="step-text">
                Il cliente apre il codice GUFO e lo mostra al partner per essere riconosciuto.
              </p>
            </div>

            <div className="step-card neon-border">
              <div className="step-number">3</div>
              <h3 className="step-title">Wallet aggiornato</h3>
              <p className="step-text">
                Cashback, saldo, livello membership e storico si aggiornano in tempo reale.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Accesso rapido</h2>
            <p className="section-text">
              Le sezioni principali della web app già disponibili.
            </p>
          </div>

          <div className="quick-grid">
            <Link href="/dashboard" className="quick-card neon-border">
              <div className="quick-title">Dashboard</div>
              <div className="quick-text">
                Panoramica account, statistiche e attività recenti.
              </div>
            </Link>

            <Link href="/wallet" className="quick-card neon-border">
              <div className="quick-title">Wallet</div>
              <div className="quick-text">
                Saldo GUFO, saldo euro, cashback e storico movimenti.
              </div>
            </Link>

            <Link href="/membership" className="quick-card neon-border">
              <div className="quick-title">Membership</div>
              <div className="quick-text">
                Livello attuale, progressi e percorso fino a Diamond e Millionaire.
              </div>
            </Link>

            <Link href="/customer-code" className="quick-card neon-border">
              <div className="quick-title">Codice GUFO</div>
              <div className="quick-text">
                Codice cliente e QR per identificazione rapida presso i partner.
              </div>
            </Link>

            <Link href="/transactions" className="quick-card neon-border">
              <div className="quick-title">Transazioni</div>
              <div className="quick-text">
                Storico completo con filtri e riepilogo movimenti.
              </div>
            </Link>

            <Link href="/profile" className="quick-card neon-border">
              <div className="quick-title">Profilo</div>
              <div className="quick-text">
                Dati utente, livello, cashback e ultime attività.
              </div>
            </Link>

            <Link href="/partner-demo" className="quick-card neon-border">
              <div className="quick-title">Partner Demo</div>
              <div className="quick-text">
                Ricerca cliente e simulazione di pagamento partner.
              </div>
            </Link>

            <Link href="/partner-dashboard" className="quick-card neon-border">
              <div className="quick-title">Partner Dashboard</div>
              <div className="quick-text">
                Statistiche aggregate e ultime transazioni partner.
              </div>
            </Link>
          </div>
        </section>

        <section className="cta-section neon-border">
          <div className="cta-badge">Web app GUFO online</div>
          <h2 className="cta-title">Accedi o crea il tuo account</h2>
          <p className="cta-text">
            La piattaforma GUFO integra frontend, backend, wallet, membership,
            profilo, codice cliente, dashboard partner e demo pagamento in
            un’unica esperienza moderna, pronta per test reali e demo investitori.
          </p>

          <div className="cta-buttons">
            <Link href="/register" className="btn btn-primary">
              Register
            </Link>

            <Link href="/login" className="btn btn-secondary">
              Login
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
    position: relative;
    color: white;
    padding: 30px 20px 70px;
    background:
      radial-gradient(circle at 12% 16%, rgba(236, 72, 153, 0.12), transparent 18%),
      radial-gradient(circle at 82% 12%, rgba(56, 189, 248, 0.12), transparent 18%),
      radial-gradient(circle at 18% 84%, rgba(34, 197, 94, 0.10), transparent 18%),
      radial-gradient(circle at 82% 84%, rgba(250, 204, 21, 0.10), transparent 18%),
      linear-gradient(180deg, #081120 0%, #0b1424 48%, #081120 100%);
    overflow: hidden;
  }

  .home-page::before {
    content: "";
    position: fixed;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at center, rgba(255,255,255,0.03), transparent 45%);
    z-index: 0;
  }

  .home-container {
    max-width: 1220px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }

  .brand-pill {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #f8fafc;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .topbar-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .topbar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    padding: 0 18px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 700;
    transition: transform 0.18s ease, opacity 0.18s ease;
  }

  .topbar-btn:hover,
  .btn:hover,
  .quick-card:hover {
    transform: translateY(-1px);
    opacity: 0.97;
  }

  .topbar-btn-primary {
    color: #111827;
    background: linear-gradient(
      90deg,
      #f472b6 0%,
      #60a5fa 35%,
      #4ade80 70%,
      #facc15 100%
    );
  }

  .topbar-btn-secondary {
    color: white;
    background: rgba(15, 23, 42, 0.82);
    border: 1px solid rgba(255, 255, 255, 0.10);
  }

  .hero-section {
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 34px;
    align-items: center;
    margin-bottom: 34px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.76);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #dbe7ff;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 18px;
  }

  .hero-title {
    margin: 0 0 14px 0;
    font-size: 78px;
    line-height: 0.95;
    font-weight: 800;
    letter-spacing: -0.05em;
    color: #fffaf0;
  }

  .hero-title-glow {
    display: block;
    background: linear-gradient(
      90deg,
      #f472b6 0%,
      #60a5fa 25%,
      #4ade80 55%,
      #facc15 80%,
      #c084fc 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-top: 8px;
  }

  .hero-subtitle {
    margin: 0 0 16px 0;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 700;
    color: #f3f7ff;
    max-width: 720px;
  }

  .hero-description {
    margin: 0 0 26px 0;
    max-width: 720px;
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
    min-height: 52px;
    padding: 14px 22px;
    border-radius: 14px;
    text-decoration: none;
    font-weight: 700;
    transition: transform 0.18s ease, opacity 0.18s ease;
  }

  .btn-primary {
    color: #111827;
    background: linear-gradient(
      90deg,
      #f472b6 0%,
      #60a5fa 35%,
      #4ade80 70%,
      #facc15 100%
    );
    box-shadow: 0 14px 34px rgba(96, 165, 250, 0.18);
  }

  .btn-secondary {
    color: white;
    background: rgba(15, 23, 42, 0.86);
    border: 1px solid rgba(255, 255, 255, 0.10);
  }

  .btn-dark {
    color: white;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
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
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
    font-size: 13px;
    font-weight: 600;
  }

  .hero-visual {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .neon-border {
    position: relative;
  }

  .neon-border::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1.4px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.95),
      rgba(56, 189, 248, 0.95),
      rgba(34, 197, 94, 0.95),
      rgba(250, 204, 21, 0.95),
      rgba(168, 85, 247, 0.95)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .visual-card {
    position: relative;
    width: 100%;
    max-width: 470px;
    min-height: 500px;
    background:
      linear-gradient(180deg, rgba(10, 16, 32, 0.92), rgba(15, 23, 42, 0.88));
    border-radius: 30px;
    padding: 26px;
    box-shadow:
      0 24px 60px rgba(0,0,0,0.28),
      inset 0 1px 0 rgba(255,255,255,0.04);
    overflow: hidden;
  }

  .visual-topline {
    position: relative;
    z-index: 1;
    margin-bottom: 20px;
    color: #9fb0d3;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .visual-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(26px);
    opacity: 0.34;
  }

  .orb-one {
    width: 140px;
    height: 140px;
    background: rgba(236, 72, 153, 0.44);
    top: 26px;
    left: 24px;
  }

  .orb-two {
    width: 160px;
    height: 160px;
    background: rgba(56, 189, 248, 0.42);
    bottom: 22px;
    right: 20px;
  }

  .orb-three {
    width: 140px;
    height: 140px;
    background: rgba(74, 222, 128, 0.34);
    bottom: 60px;
    left: 80px;
  }

  .logo-shell {
    position: relative;
    z-index: 1;
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

  .hero-logo {
    width: 100%;
    height: auto;
    max-width: 280px;
    object-fit: contain;
    border-radius: 18px;
  }

  .visual-stats {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 12px;
  }

  .visual-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border-radius: 18px;
    padding: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .visual-stat-label {
    color: #9fb0d3;
    font-size: 12px;
    font-weight: 700;
  }

  .visual-stat-value {
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
  }

  .hero-stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 64px;
  }

  .hero-stat-card,
  .feature-card,
  .step-card,
  .quick-card,
  .cta-section {
    background:
      linear-gradient(180deg, rgba(10, 16, 32, 0.92), rgba(15, 23, 42, 0.88));
    border-radius: 24px;
    padding: 24px;
    box-shadow:
      0 14px 38px rgba(0,0,0,0.22),
      inset 0 1px 0 rgba(255,255,255,0.03);
  }

  .hero-stat-label {
    color: #a8a29e;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .hero-stat-value {
    color: #fff7ed;
    font-size: 25px;
    font-weight: 800;
    margin-bottom: 10px;
    line-height: 1.2;
  }

  .hero-stat-text {
    color: #cbd5e1;
    font-size: 14px;
    line-height: 1.7;
  }

  .section {
    margin-bottom: 68px;
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
    color: #fff7ed;
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
  }

  .cta-section {
    text-align: center;
    padding: 40px 24px;
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
    color: #fff7ed;
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

    .hero-stats,
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
      font-size: 27px;
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
      padding: 24px 16px 52px;
    }

    .topbar {
      flex-direction: column;
      align-items: stretch;
      margin-bottom: 22px;
    }

    .topbar-actions {
      width: 100%;
    }

    .topbar-btn {
      flex: 1 1 0;
    }

    .hero-section {
      gap: 24px;
      margin-bottom: 26px;
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

    .visual-card {
      max-width: 340px;
      min-height: 390px;
      padding: 18px;
      border-radius: 22px;
    }

    .hero-logo {
      max-width: 220px;
    }

    .hero-stats {
      margin-bottom: 52px;
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

    .hero-stat-card,
    .feature-card,
    .step-card,
    .quick-card,
    .cta-section {
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
    .quick-text,
    .hero-stat-text {
      font-size: 14px;
    }

    .quick-grid {
      grid-template-columns: 1fr;
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