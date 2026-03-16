"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #0f172a 0%, #172554 45%, #0f172a 100%)",
        color: "white",
        padding: "60px 24px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "32px",
            alignItems: "center",
            marginBottom: "70px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "#1e293b",
                color: "#cbd5e1",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              Cashback • Loyalty • Partner network
            </div>

            <h1
              style={{
                fontSize: "64px",
                lineHeight: 1.05,
                margin: "0 0 20px 0",
                fontWeight: "bold",
              }}
            >
              GUFO
            </h1>

            <p
              style={{
                fontSize: "28px",
                lineHeight: 1.3,
                color: "#e2e8f0",
                margin: "0 0 18px 0",
                fontWeight: 600,
              }}
            >
              Il cashback intelligente per i negozi locali.
            </p>

            <p
              style={{
                fontSize: "18px",
                lineHeight: 1.6,
                color: "#cbd5e1",
                maxWidth: "700px",
                marginBottom: "32px",
              }}
            >
              Con GUFO gli utenti ricevono cashback dopo ogni acquisto nei negozi
              partner, mentre i partner monitorano transazioni, premi e
              fidelizzazione da una dashboard dedicata.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <Link
                href="/partner-demo"
                style={{
                  background: "#3b82f6",
                  color: "white",
                  textDecoration: "none",
                  padding: "14px 24px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                }}
              >
                Prova la demo partner
              </Link>

              <Link
                href="/customer-code"
                style={{
                  background: "#22c55e",
                  color: "white",
                  textDecoration: "none",
                  padding: "14px 24px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                }}
              >
                Vedi il codice GUFO
              </Link>

              <Link
                href="/partner-dashboard"
                style={{
                  background: "#1e293b",
                  color: "white",
                  textDecoration: "none",
                  padding: "14px 24px",
                  borderRadius: "12px",
                  fontWeight: "bold",
                  border: "1px solid #334155",
                }}
              >
                Dashboard partner
              </Link>
            </div>
          </div>

          <div
            style={{
              background: "rgba(30, 41, 59, 0.9)",
              border: "1px solid #334155",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "30px", marginBottom: "22px" }}>
              Perché GUFO
            </h2>

            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "16px",
                  padding: "18px",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "6px" }}>
                  Cashback automatico
                </div>
                <div style={{ color: "#cbd5e1" }}>
                  L’utente riceve GUFO in base al livello e alla spesa effettuata.
                </div>
              </div>

              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "16px",
                  padding: "18px",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "6px" }}>
                  Dashboard partner
                </div>
                <div style={{ color: "#cbd5e1" }}>
                  Il negozio monitora transazioni, importi e GUFO distribuiti.
                </div>
              </div>

              <div
                style={{
                  background: "#0f172a",
                  borderRadius: "16px",
                  padding: "18px",
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "6px" }}>
                  Codice cliente + QR
                </div>
                <div style={{ color: "#cbd5e1" }}>
                  Il pagamento viene associato rapidamente tramite codice GUFO o QR.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "70px" }}>
          <h2
            style={{
              fontSize: "40px",
              marginBottom: "24px",
            }}
          >
            Come funziona
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "20px",
            }}
          >
            <div
              style={{
                background: "#1e293b",
                borderRadius: "20px",
                padding: "24px",
              }}
            >
              <div style={{ fontSize: "42px", fontWeight: "bold", color: "#60a5fa" }}>
                1
              </div>
              <h3 style={{ fontSize: "24px", marginBottom: "12px" }}>
                Mostra il codice GUFO
              </h3>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                L’utente mostra il suo codice cliente o il QR al partner.
              </p>
            </div>

            <div
              style={{
                background: "#1e293b",
                borderRadius: "20px",
                padding: "24px",
              }}
            >
              <div style={{ fontSize: "42px", fontWeight: "bold", color: "#60a5fa" }}>
                2
              </div>
              <h3 style={{ fontSize: "24px", marginBottom: "12px" }}>
                Il partner registra il pagamento
              </h3>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                Il negozio inserisce importo e merchant nella Partner Demo.
              </p>
            </div>

            <div
              style={{
                background: "#1e293b",
                borderRadius: "20px",
                padding: "24px",
              }}
            >
              <div style={{ fontSize: "42px", fontWeight: "bold", color: "#60a5fa" }}>
                3
              </div>
              <h3 style={{ fontSize: "24px", marginBottom: "12px" }}>
                Cashback nel wallet
              </h3>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
                GUFO aggiorna wallet, livello, storico transazioni e statistiche.
              </p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "70px" }}>
          <h2 style={{ fontSize: "40px", marginBottom: "24px" }}>
            Accesso rapido alla demo
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "18px",
            }}
          >
            <Link
              href="/dashboard"
              style={{
                background: "#1e293b",
                borderRadius: "18px",
                padding: "22px",
                textDecoration: "none",
                color: "white",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "8px" }}>
                Dashboard
              </div>
              <div style={{ color: "#cbd5e1" }}>Panoramica utente e statistiche.</div>
            </Link>

            <Link
              href="/wallet"
              style={{
                background: "#1e293b",
                borderRadius: "18px",
                padding: "22px",
                textDecoration: "none",
                color: "white",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "8px" }}>
                Wallet
              </div>
              <div style={{ color: "#cbd5e1" }}>Saldo, livello e transazioni.</div>
            </Link>

            <Link
              href="/partner-demo"
              style={{
                background: "#1e293b",
                borderRadius: "18px",
                padding: "22px",
                textDecoration: "none",
                color: "white",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "8px" }}>
                Partner Demo
              </div>
              <div style={{ color: "#cbd5e1" }}>
                Simulazione pagamento partner.
              </div>
            </Link>

            <Link
              href="/partner-dashboard"
              style={{
                background: "#1e293b",
                borderRadius: "18px",
                padding: "22px",
                textDecoration: "none",
                color: "white",
              }}
            >
              <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "8px" }}>
                Partner Dashboard
              </div>
              <div style={{ color: "#cbd5e1" }}>
                Statistiche partner e ultime transazioni.
              </div>
            </Link>
          </div>
        </section>

        <section
          style={{
            background: "#1e293b",
            borderRadius: "28px",
            padding: "36px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: "40px", marginTop: 0, marginBottom: "14px" }}>
            GUFO è già online
          </h2>
          <p
            style={{
              color: "#cbd5e1",
              fontSize: "18px",
              lineHeight: 1.6,
              maxWidth: "760px",
              margin: "0 auto 24px auto",
            }}
          >
            Il progetto è già deployato con frontend, backend, database,
            dashboard utente, wallet, codice cliente, demo partner e dashboard
            partner.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <Link
              href="/dashboard"
              style={{
                background: "#3b82f6",
                color: "white",
                textDecoration: "none",
                padding: "14px 24px",
                borderRadius: "12px",
                fontWeight: "bold",
              }}
            >
              Apri la dashboard
            </Link>

            <Link
              href="/partner-demo"
              style={{
                background: "#22c55e",
                color: "white",
                textDecoration: "none",
                padding: "14px 24px",
                borderRadius: "12px",
                fontWeight: "bold",
              }}
            >
              Avvia una demo
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}