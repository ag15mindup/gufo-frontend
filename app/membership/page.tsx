"use client";

import { useEffect, useState } from "react";

export default function MembershipPage() {
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
      console.error("Errore membership:", error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const totalSpent = transactions.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const levels = [
    { name: "Basic", min: 0, next: 100 },
    { name: "Bronze", min: 100, next: 500 },
    { name: "Silver", min: 500, next: 1000 },
    { name: "Gold", min: 1000, next: 2500 },
    { name: "Platinum", min: 2500, next: 5000 },
    { name: "VIP", min: 5000, next: 10000 },
    { name: "Elite", min: 10000, next: 50000 },
    { name: "Millionaire", min: 50000, next: null },
  ];

  const currentLevel = wallet?.level_name ?? "Basic";

  const currentLevelData = levels.find((level) => level.name === currentLevel);

  const nextLevelData = currentLevelData
    ? levels[levels.findIndex((l) => l.name === currentLevel) + 1]
    : null;

  const amountToNextLevel =
    currentLevelData && currentLevelData.next
      ? Math.max(currentLevelData.next - totalSpent, 0)
      : 0;

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Membership GUFO</h1>
      <p>Controlla il tuo livello attuale e i progressi per salire di status.</p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "20px",
          marginTop: "30px",
          backgroundColor: "#fff",
        }}
      >
        <h2>Livello attuale: {currentLevel}</h2>
        <p>Saldo GUFO: {wallet?.balance ?? 0}</p>
        <p>Spesa totale: {totalSpent}€</p>

        {nextLevelData ? (
          <>
            <p>Prossimo livello: {nextLevelData.name}</p>
            <p>Ti mancano: {amountToNextLevel}€ per salire di livello</p>
          </>
        ) : (
          <p>Hai raggiunto il livello massimo.</p>
        )}
      </div>

      <div style={{ marginTop: "30px" }}>
        <h2>Scala livelli</h2>

        {levels.map((level) => (
          <div
            key={level.name}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
              backgroundColor:
                currentLevel === level.name ? "#f0fdf4" : "#ffffff",
            }}
          >
            <h3>{level.name}</h3>
            <p>Soglia minima: {level.min}€</p>
            <p>
              Soglia successiva:{" "}
              {level.next !== null ? `${level.next}€` : "Livello massimo"}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}