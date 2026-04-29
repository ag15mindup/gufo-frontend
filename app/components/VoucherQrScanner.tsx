"use client";

import { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onScan: (value: string) => void;
  onError?: (error: string) => void;
};

export default function VoucherQrScanner({ onScan, onError }: Props) {
  useEffect(() => {
    const scanner = new Html5Qrcode("voucher-qr-reader");

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          onScan(decodedText);

          try {
            await scanner.stop();
          } catch {}
        },
        (errorMessage) => {
          if (onError) onError(errorMessage);
        }
      )
      .catch((err) => {
        if (onError) onError(String(err));
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan, onError]);

  return <div id="voucher-qr-reader" style={{ width: "100%" }} />;
}