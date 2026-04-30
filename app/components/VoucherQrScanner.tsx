"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onScan: (value: string) => void;
  onError?: (error: string) => void;
};

export default function VoucherQrScanner({ onScan, onError }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("voucher-qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (cancelled) return;

            onScan(decodedText);

            try {
              if (isRunningRef.current && scannerRef.current) {
                await scannerRef.current.stop();
                isRunningRef.current = false;
              }
            } catch {}
          },
          () => {}
        );

        isRunningRef.current = true;
      } catch (err) {
        if (onError) onError(String(err));
      }
    };

    startScanner();

    return () => {
      cancelled = true;

      const scanner = scannerRef.current;

      if (scanner && isRunningRef.current) {
        scanner
          .stop()
          .then(() => {
            isRunningRef.current = false;
            scanner.clear();
          })
          .catch(() => {});
      }
    };
  }, [onScan, onError]);

  return <div id="voucher-qr-reader" style={{ width: "100%" }} />;
}