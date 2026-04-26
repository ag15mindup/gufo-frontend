"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function PartnerScanPage() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);

  const [status, setStatus] = useState("Premi il bottone per avviare la fotocamera.");
  const [scanning, setScanning] = useState(false);

  async function startScanner() {
    try {
      setStatus("Richiesta accesso fotocamera...");
      setScanning(true);

      const { Html5Qrcode } = await import("html5-qrcode");

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        setStatus("Nessuna fotocamera trovata. Prova da telefono o collega una webcam.");
        setScanning(false);
        return;
      }

      const backCamera =
        cameras.find((camera: any) =>
          String(camera.label || "").toLowerCase().includes("back")
        ) || cameras[0];

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await scanner.start(
        backCamera.id,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
        },
        async (decodedText: string) => {
          const raw = decodedText.trim();
          const match = raw.match(/GUFO-[A-Z0-9]+/i);
          const customerCode = match ? match[0].toUpperCase() : raw.toUpperCase();

          setStatus(`Codice letto: ${customerCode}`);

          try {
            await scanner.stop();
            await scanner.clear();
          } catch {}

          router.push(`/partner-console?customerCode=${encodeURIComponent(customerCode)}`);
        },
        () => {}
      );

      setStatus("Scanner attivo. Inquadra il QR cliente.");
    } catch (err) {
      console.error("Scanner error:", err);
      setStatus("Errore fotocamera: controlla permessi browser, HTTPS e webcam.");
      setScanning(false);
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch {}

    setScanning(false);
    setStatus("Scanner fermato.");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #050816, #090b22)",
        color: "white",
        padding: "28px",
      }}
    >
      <a href="/partner-dashboard" style={{ color: "white", textDecoration: "none" }}>
        ← Torna alla dashboard partner
      </a>

      <section
        style={{
          maxWidth: "760px",
          margin: "32px auto 0",
          padding: "24px",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <h1>Scansiona QR cliente</h1>

        <p style={{ color: "rgba(255,255,255,0.75)" }}>{status}</p>

        {!scanning ? (
          <button
            type="button"
            onClick={startScanner}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "16px",
              border: "0",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
              background: "linear-gradient(135deg, #06b6d4, #7c3aed)",
              marginTop: "16px",
            }}
          >
            📷 Avvia scanner
          </button>
        ) : (
          <button
            type="button"
            onClick={stopScanner}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "16px",
              border: "0",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
              background: "linear-gradient(135deg, #ef4444, #7c2d12)",
              marginTop: "16px",
            }}
          >
            Ferma scanner
          </button>
        )}

        <div
          id="reader"
          style={{
            width: "100%",
            marginTop: "24px",
            overflow: "hidden",
            borderRadius: "20px",
            background: "rgba(0,0,0,0.32)",
          }}
        />
      </section>
    </main>
  );
}