"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PartnerScanPage() {
  const router = useRouter();

  useEffect(() => {
    let scanner: any = null;
    let stopped = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        scanner = new Html5Qrcode("reader");

        const devices = await Html5Qrcode.getCameras();

        if (!devices || devices.length === 0) {
          alert("Nessuna fotocamera trovata. Collega una webcam o prova da telefono.");
          return;
        }

        const backCamera =
          devices.find((device: any) =>
            String(device.label || "").toLowerCase().includes("back")
          ) || devices[0];

        await scanner.start(
          backCamera.id,
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
          },
          async (decodedText: string) => {
            if (stopped) return;
            stopped = true;

            const raw = decodedText.trim();
            const match = raw.match(/GUFO-[A-Z0-9]+/i);
            const customerCode = match ? match[0].toUpperCase() : raw.toUpperCase();

            try {
              await scanner.stop();
              await scanner.clear();
            } catch {}

            router.push(
              `/partner-console?customerCode=${encodeURIComponent(customerCode)}`
            );
          },
          () => {}
        );
      } catch (error) {
        console.error("QR scanner error:", error);
        alert(
          "Errore apertura fotocamera. Controlla permessi browser, webcam collegata e HTTPS."
        );
      }
    }

    startScanner();

    return () => {
      stopped = true;

      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #050816, #090b22)",
        color: "white",
        padding: "28px",
      }}
    >
      <a
        href="/partner-dashboard"
        style={{
          color: "rgba(255,255,255,0.75)",
          textDecoration: "none",
          fontWeight: 800,
        }}
      >
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
        <div
          style={{
            display: "inline-flex",
            padding: "8px 14px",
            borderRadius: "999px",
            background: "rgba(124,58,237,0.24)",
            fontWeight: 900,
            marginBottom: "16px",
          }}
        >
          GUFO QR SCANNER
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "42px",
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          Scansiona QR cliente
        </h1>

        <p
          style={{
            marginTop: "14px",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.5,
          }}
        >
          Inquadra il QR del cliente GUFO. Dopo la scansione verrai portato alla
          Partner Console con il codice cliente già compilato.
        </p>

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