"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// Niente piu' hardcoded: usa la env var (fallback in locale).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const RECEIPT_BUCKET = "receipt-claims";

type ResultKind = "success" | "pending" | "error";

function ReceiptScanContent() {
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("partnerId");

  const [partner, setPartner] = useState<any>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ kind: ResultKind; text: string } | null>(null);

  useEffect(() => {
    if (partnerId) loadPartner();
  }, [partnerId]);

  async function loadPartner() {
    try {
      const res = await fetch(`${API_URL}/partners/${partnerId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setPartner(data.partner);
    } catch (err) {
      console.error("Errore caricamento partner:", err);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setReceiptFile(file);
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function submitClaim() {
    try {
      setLoading(true);
      setResult(null);

      if (!partnerId) throw new Error("Partner non valido");
      if (!receiptFile) throw new Error("Carica la foto dello scontrino");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token || !session) throw new Error("Devi essere loggato");

      // 1) carica la foto nel bucket PRIVATO e prendi il path (non l'URL pubblico)
      const fileExt = receiptFile.name.split(".").pop() || "jpg";
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { data: uploaded, error: uploadError } = await supabase.storage
        .from(RECEIPT_BUCKET)
        .upload(filePath, receiptFile, { upsert: false });

      if (uploadError) throw new Error("Errore caricamento foto: " + uploadError.message);

      // 2) manda al backend SOLO partner_id + receipt_path.
      //    L'importo lo legge il server dalla foto: non lo inviamo piu'.
      const res = await fetch(`${API_URL}/receipt-claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partner_id: Number(partnerId),
          receipt_path: uploaded.path,
        }),
      });

      const data = await res.json();

      // 3) interpreta l'esito deciso dal server
      if (res.status === 409) {
        setResult({ kind: "error", text: data.error || "Scontrino gia' registrato." });
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Errore invio scontrino");
      }

      if (data.status === "approved_auto") {
        setResult({ kind: "success", text: data.message });
      } else if (data.status === "rejected") {
        setResult({ kind: "error", text: data.message || "Scontrino non valido." });
      } else {
        // pending_review
        setResult({
          kind: "pending",
          text: data.message || "Scontrino ricevuto. Verra' verificato a breve.",
        });
      }

      // pulizia in caso di esito non rifiutato
      if (data.status !== "rejected") {
        setReceiptFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch (err: any) {
      setResult({ kind: "error", text: err.message || "Errore sconosciuto" });
    } finally {
      setLoading(false);
    }
  }

  const resultStyles: Record<ResultKind, string> = {
    success: "bg-green-500/10 border-green-500/20 text-green-300",
    pending: "bg-cyan-500/10 border-cyan-500/20 text-cyan-200",
    error: "bg-red-500/10 border-red-500/20 text-red-300",
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-8 backdrop-blur-xl">
          <div className="mb-8">
            <div className="text-cyan-300 text-sm mb-2">Cashback GUFO</div>
            <h1 className="text-4xl font-bold mb-3">Carica scontrino</h1>
            <p className="text-white/70">
              Scatta o carica la foto dello scontrino. Al resto pensa il sistema:
              legge l&apos;importo e applica il cashback.
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
              <label className="block mb-2 text-sm text-white/70">Foto scontrino</label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onFileChange}
                className="w-full"
              />
            </div>

            {previewUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Anteprima scontrino" className="w-full object-contain max-h-80" />
              </div>
            )}

            <button
              type="button"
              onClick={submitClaim}
              disabled={loading || !receiptFile}
              className={`w-full rounded-2xl font-bold py-4 transition ${
                loading || !receiptFile
                  ? "bg-white/20 text-white/40 cursor-not-allowed"
                  : "bg-cyan-500 text-black hover:scale-[1.01]"
              }`}
            >
              {loading ? "Invio in corso..." : "Invia scontrino"}
            </button>

            {result && (
              <div className={`rounded-2xl border p-4 ${resultStyles[result.kind]}`}>
                {result.text}
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
    <Suspense
      fallback={<main className="min-h-screen bg-black text-white p-6">Caricamento...</main>}
    >
      <ReceiptScanContent />
    </Suspense>
  );
}