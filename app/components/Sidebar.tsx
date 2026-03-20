"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/wallet", label: "Wallet" },
    { href: "/transactions", label: "Transactions" },
    { href: "/membership", label: "Membership" },
    { href: "/profile", label: "Profile" },
    { href: "/customer-code", label: "QR Code" },
    { href: "/partner-demo", label: "Partner Demo" },
    { href: "/partner-dashboard", label: "Partner Dashboard" },
  ];

  return (
    <>
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
          cursor: "pointer",
        }}
      >
        ☰
      </button>

      {/* Overlay mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: open ? "240px" : "0px",
          background: "#0f172a",
          color: "white",
          overflow: "hidden",
          transition: "0.3s",
          padding: open ? "20px" : "0px",
          zIndex: 1000,
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>🦉 GUFO</h2>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: isActive ? "#facc15" : "white",
                  background: isActive ? "#1e293b" : "transparent",
                  fontWeight: isActive ? "700" : "400",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              marginTop: "20px",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: "#ef4444",
              color: "white",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>
        </nav>
      </div>
    </>
  );
}