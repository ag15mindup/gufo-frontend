"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Tesseract from "tesseract.js";

const supabase = createClient();

const API_URL = "http://localhost:3001";

function ReceiptScanContent() {
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("partnerId");

  const [partner, setPartner] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [amountConfirmed, setAmountConfirmed] = useState(false);

  useEffect(() => {
    if (partnerId) loadPartner();
  }, [partnerId]);

  async function loadPartner() {
    try {
      const res = await fetch(`${API_URL}/partners/${partnerId}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setPartner(data.partner);
      }
    } catch (err) {
      console.error("Errore caricamento partner:", err);
    }
  }

  async function uploadReceiptImage(file: File) {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${partnerId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from("receipt-claims")
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("receipt-claims")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  async function extractAmountFromReceipt(file: File) {
    try {
      setOcrLoading(true);
      setAmountConfirmed(false);
      setError("");
      setMessage("");

      const {
        data: { text },
      } = await Tesseract.recognize(file, "ita");

      console.log("OCR TEXT:", text);

      const normalizedText = text.replace(/,/g, ".");
      const matches = normalizedText.match(/\d+\.\d{2}/g);

      if (!matches || matches.length === 0) {
        setError("Non sono riuscito a leggere l'importo. Inseriscilo manualmente.");
        return;
      }

      const amounts = matches.map(Number).filter((n) => n > 0 && n < 1000);

      if (amounts.length === 0) {
        setError("Importo non rilevato. Inseriscilo manualmente.");
        return;
      }

      const detectedAmount = Math.max(...amounts);
      setAmount(detectedAmount.toFixed(2));
      setMessage("Importo rilevato automaticamente. Controllalo e conferma.");
    } catch (err) {
      console.error("Errore OCR:", err);
      setError("Errore lettura scontrino. Puoi inserire l'importo manualmente.");
    } finally {
      setOcrLoading(false);
    }
  }

  async function submitClaim() {
    try {
      console.log("CLICK INVIA SCONTRINO");
      console.log("partnerId:", partnerId);
      console.log("amount:", amount);
      console.log("amountConfirmed:", amountConfirmed);
      console.log("receiptFile:", receiptFile);

      setLoading(true);
      setError("");
      setMessage("");

      if (!partnerId) throw new Error("Partner non valido");
      if (!amount || Number(amount) <= 0) throw new Error("Inserisci un importo valido");
      if (!amountConfirmed) throw new Error("Devi confermare che l'importo è corretto");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) throw new Error("Devi essere loggato");

      let receiptImageUrl = "test-receipt";

      if (receiptFile) {
        receiptImageUrl = await uploadReceiptImage(receiptFile);
      }

      console.log("INVIO AL BACKEND:", {
        partner_id: Number(partnerId),
        amount_euro: Number(amount),
        receipt_image_url: receiptImageUrl,
      });

      const res = await fetch(`${API_URL}/receipt-claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partner_id: Number(partnerId),
          amount_euro: Number(amount),
          receipt_image_url: receiptImageUrl,
        }),
      });

      const data = await res.json();

      console.log("RISPOSTA BACKEND:", data);

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Errore invio scontrino");
      }

      setMessage(data.message || "Scontrino inviato correttamente.");
      setAmount("");
      setReceiptFile(null);
      setAmountConfirmed(false);
    } catch (err: any) {
      setError(err.message || "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  const isDisabled = loading || ocrLoading || !amountConfirmed;

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-8 backdrop-blur-xl">
          <div className="mb-8">
            <div className="text-cyan-300 text-sm mb-2">Cashback GUFO</div>

            <h1 className="text-4xl font-bold mb-3">Carica scontrino</h1>

            <p className="text-white/70">
              Carica lo scontrino, controlla l’importo rilevato e conferma.
            </p>
          </div>

          {partner && (
            <div className="mb-6 rounded-2xl border border-white/10 p-4">
              <div className="text-2xl font-bold">{partner.name}</div>
              <div className="text-green-400 mt-1">
                Cashback {partner.cashback_percent || 0}%
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-sm text-white/70">
                Foto scontrino
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  setReceiptFile(file);
                  setAmountConfirmed(false);

                  if (file) {
                    await extractAmountFromReceipt(file);
                  }
                }}
                className="w-full"
              />
            </div>

            {ocrLoading && (
              <div className="text-cyan-300 text-sm">
                Lettura automatica scontrino...
              </div>
            )}

            <div>
              <label className="block mb-2 text-sm text-white/70">
                Importo scontrino
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountConfirmed(false);
                }}
                placeholder="Es. 12.50"
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-4 outline-none"
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/80">
              <input
                type="checkbox"
                checked={amountConfirmed}
                onChange={(e) => setAmountConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>
                Confermo che l’importo dello scontrino è corretto. Il cashback
                può essere approvato automaticamente solo se supera i controlli
                anti-frode.
              </span>
            </label>

            <button
              type="button"
              onClick={submitClaim}
              disabled={isDisabled}
              className={`w-full rounded-2xl font-bold py-4 transition ${
                isDisabled
                  ? "bg-white/20 text-white/40 cursor-not-allowed"
                  : "bg-cyan-500 text-black hover:scale-[1.01]"
              }`}
            >
              {loading
                ? "Invio scontrino..."
                : ocrLoading
                ? "Lettura scontrino..."
                : !amountConfirmed
                ? "Conferma l'importo per continuare"
                : "Invia scontrino"}
            </button>

            {message && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-green-300">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ReceiptScanPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black text-white p-6">Caricamento...</main>}>
      <ReceiptScanContent />
    </Suspense>
  );
}