"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const userId = "1f49b570-08ea-4151-9999-825fa0c77d6e";

  const [wallet, setWallet] = useState<any>(null);
const [transactions, setTransactions] = useState<any[]>([]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`http://localhost:3001/dashboard/${userId}`);
      const data = await res.json();

      setWallet(data.wallet);
      setTransactions(data.transactions ?? []);
    } catch (error) {
      console.error("Errore dashboard:", error);
    }
  };

  const simulatePurchase = async () => {
    try {
      const res = await fetch("http://localhost:3001/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          amount: 50,
        }),
      });

      const data = await res.json();
      console.log("PURCHASE RESPONSE:", data);

      if (!res.ok) {
        alert(data.error || "Errore durante il pagamento");
        return;
      }

      alert("Pagamento simulato completato!");
      fetchDashboard();
    } catch (error) {
      console.error("Errore pagamento:", error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Dashboard GUFO</h1>

      {wallet && (
        <div>
          <h2>Saldo GUFO: {wallet.balance}</h2>
          <p>Livello: {wallet.level_name}</p>
        </div>
      )}

      <button
        onClick={simulatePurchase}
        style={{
          padding: "12px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "6px",
          marginTop: "20px",
          cursor: "pointer",
        }}
      >
        Simula pagamento
      </button>

      <h2 style={{ marginTop: "40px" }}>Transazioni</h2>

      <ul>
        {transactions.map((t) => (
          <li key={t.id}>
            €{t.amount} - Cashback {t.cashback} GUFO
          </li>
        ))}
      </ul>
    </main>
  );
}