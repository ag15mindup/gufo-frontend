"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function PartnerScanPage() {
  const router = useRouter();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      (decodedText: string) => {
        scanner.clear();

        router.push(
          `/partner-console?customerCode=${encodeURIComponent(decodedText)}`
        );
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050816",
        color: "white",
        padding: "40px",
      }}
    >
      <h1>Scanner QR Cliente</h1>
      <p>Inquadra il QR del cliente GUFO</p>

      <div id="reader" style={{ width: "100%" }} />
    </div>
  );
}