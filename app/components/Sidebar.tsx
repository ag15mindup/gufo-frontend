"use client";

import { useState } from "react";
import Link from "next/link";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Bottone mobile */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          top: 10,
          left: 10,
          zIndex: 1000,
          background: "#111",
          color: "white",
          padding: "10px",
          borderRadius: "8px",
          border: "none",
        }}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: open ? "220px" : "0px",
          background: "#111",
          color: "white",
          overflow: "hidden",
          transition: "0.3s",
          padding: open ? "20px" : "0px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>🦉 GUFO</h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/wallet">Wallet</Link>
          <Link href="/transactions">Transactions</Link>
          <Link href="/membership">Membership</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/customer-code">QR Code</Link>
          <Link href="/partner-demo">Partner Demo</Link>
          <Link href="/partner-dashboard">Partner Dashboard</Link>
        </nav>
      </div>
    </div>
  );
}