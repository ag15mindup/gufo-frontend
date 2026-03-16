"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type CustomerData = {
  id: string;
  customer_code: string;
  balance_gufo: number;
  balance_eur: number;
  level: string;
  cashback_percent: number;
  season_spent: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CUSTOMER_CODE = "GUFO-123456";

async function safeJsonFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error("L'API non ha restituito JSON");
  }

  const data = text ? JSON.parse(text) : {};
  return { response, data };
}

function formatLevel(level: string) {
  if (!level) return "Basic";
  if (level.toLowerCase() === "vip") return "VIP";
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

export default function CustomerCodePage() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError("");

        const { response, data } = await safeJsonFetch(
          `${API_URL}/partner/customer?code=${encodeURIComponent(CUSTOMER_CODE)}`
        );

        if (!response.ok) {
          throw new Error(data?.error || "Cliente non trovato");
        }

        setCustomer(data);
      } catch (err: any) {
        setError(err.message || "Errore nel caricamento codice cliente");
      } finally {
        setLoading(false);
      }
    }

    loadCustomer();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
        <h1 className="text-4xl font-bold mb-6">Il tuo codice GUFO</h1>
        <p>Caricamento...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
        <h1 className="text-4xl font-bold mb-6">Il tuo codice GUFO</h1>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-3">Il tuo codice GUFO</h1>
        <p className="text-slate-300 mb-8">
          Mostra questo codice al negozio partner per ricevere cashback e GUFO.
        </p>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl bg-slate-800 p-5">
              <p className="text-sm text-slate-400 mb-2">Saldo GUFO</p>
              <p className="text-3xl font-bold">
                {Number(customer?.balance_gufo || 0).toFixed(2)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-5">
              <p className="text-sm text-slate-400 mb-2">Livello</p>
              <p className="text-3xl font-bold">
                {formatLevel(customer?.level || "Basic")}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800 p-5">
              <p className="text-sm text-slate-400 mb-2">Cashback</p>
              <p className="text-3xl font-bold">
                {Number(customer?.cashback_percent || 0).toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-8 text-center mb-8">
            <p className="text-slate-300 text-sm mb-3">Codice cliente</p>
            <p className="text-4xl md:text-6xl font-extrabold tracking-wider text-yellow-300">
              {customer?.customer_code}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 flex justify-center">
            <QRCodeCanvas
              value={customer?.customer_code || CUSTOMER_CODE}
              size={220}
            />
          </div>

          <p className="text-center text-slate-400 text-sm mt-4">
            Il negozio partner può scansionare questo QR code per identificarti.
          </p>
        </div>
      </div>
    </main>
  );
}