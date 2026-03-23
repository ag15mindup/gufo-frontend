"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "◈" },
    { href: "/wallet", label: "Wallet", icon: "◎" },
    { href: "/transactions", label: "Transactions", icon: "◌" },
    { href: "/membership", label: "Membership", icon: "✦" },
    { href: "/profile", label: "Profile", icon: "◉" },
    { href: "/customer-code", label: "QR Code", icon: "▣" },
    { href: "/partner-demo", label: "Partner Demo", icon: "△" },
    { href: "/partner-dashboard", label: "Partner Dashboard", icon: "▤" },
  ];

  return (
    <>
      <style>{sidebarStyles}</style>

      <button
        onClick={() => setOpen(true)}
        className="sidebar-toggle"
        aria-label="Apri menu"
      >
        <span />
        <span />
        <span />
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-inner">
          <div className="sidebar-header">
            <div className="brand-wrap">
              <div className="brand-logo">🦉</div>
              <div>
                <div className="brand-name">GUFO</div>
                <div className="brand-subtitle">Rainbow Cashback</div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="sidebar-close"
              aria-label="Chiudi menu"
            >
              ✕
            </button>
          </div>

          <div className="sidebar-divider" />

          <nav className="sidebar-nav">
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-link-icon">{link.icon}</span>
                  <span className="sidebar-link-label">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

const sidebarStyles = `
  * {
    box-sizing: border-box;
  }

  .sidebar-toggle {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1200;
    width: 52px;
    height: 52px;
    border: none;
    border-radius: 16px;
    background:
      linear-gradient(180deg, rgba(10, 16, 32, 0.94), rgba(15, 23, 42, 0.90));
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255,255,255,0.04);
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
  }

  .sidebar-toggle::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1.3px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.95),
      rgba(56, 189, 248, 0.95),
      rgba(34, 197, 94, 0.95),
      rgba(250, 204, 21, 0.95),
      rgba(168, 85, 247, 0.95)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .sidebar-toggle span {
    width: 20px;
    height: 2px;
    border-radius: 999px;
    background: #f8fafc;
    display: block;
    position: relative;
    z-index: 1;
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.62);
    backdrop-filter: blur(2px);
    z-index: 1090;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    z-index: 1100;
    background:
      linear-gradient(180deg, rgba(8, 12, 24, 0.96), rgba(15, 23, 42, 0.94));
    box-shadow:
      18px 0 40px rgba(0, 0, 0, 0.30),
      inset -1px 0 0 rgba(255,255,255,0.04);
    overflow: hidden;
  }

  .sidebar::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1.4px;
    background: linear-gradient(
      180deg,
      rgba(236, 72, 153, 0.85),
      rgba(56, 189, 248, 0.85),
      rgba(34, 197, 94, 0.85),
      rgba(250, 204, 21, 0.85),
      rgba(168, 85, 247, 0.85)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .sidebar-inner {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 22px 16px 18px;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .brand-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .brand-logo {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    background: linear-gradient(
      135deg,
      #f472b6 0%,
      #60a5fa 35%,
      #4ade80 70%,
      #facc15 100%
    );
    color: #111827;
    box-shadow: 0 0 20px rgba(96, 165, 250, 0.20);
    flex-shrink: 0;
  }

  .brand-name {
    color: #fffaf0;
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .brand-subtitle {
    margin-top: 4px;
    color: #cbd5e1;
    font-size: 12px;
    line-height: 1.2;
  }

  .sidebar-close {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #f8fafc;
    cursor: pointer;
    display: none;
    flex-shrink: 0;
  }

  .sidebar-divider {
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.35),
      rgba(56, 189, 248, 0.35),
      rgba(34, 197, 94, 0.35),
      rgba(250, 204, 21, 0.35)
    );
    margin: 12px 0 18px;
    border-radius: 999px;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    overflow-y: auto;
    padding-right: 4px;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 50px;
    padding: 0 14px;
    border-radius: 16px;
    text-decoration: none;
    color: #dbe4f0;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    transition:
      transform 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease;
  }

  .sidebar-link:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.10);
  }

  .sidebar-link.active {
    color: #fffaf0;
    background:
      linear-gradient(90deg,
        rgba(244, 114, 182, 0.12),
        rgba(96, 165, 250, 0.12),
        rgba(74, 222, 128, 0.10),
        rgba(250, 204, 21, 0.10)
      );
    border-color: rgba(96, 165, 250, 0.30);
    box-shadow: 0 0 20px rgba(96, 165, 250, 0.08);
  }

  .sidebar-link-icon {
    width: 22px;
    flex-shrink: 0;
    text-align: center;
    font-size: 14px;
    color: inherit;
  }

  .sidebar-link-label {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
    color: inherit;
  }

  .sidebar-footer {
    margin-top: auto;
    padding-top: 18px;
  }

  .logout-button {
    width: 100%;
    min-height: 50px;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    color: white;
    font-weight: 800;
    font-size: 14px;
    background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
    box-shadow: 0 10px 24px rgba(239, 68, 68, 0.18);
    transition: transform 0.18s ease, opacity 0.18s ease;
  }

  .logout-button:hover {
    transform: translateY(-1px);
    opacity: 0.96;
  }

  @media (max-width: 1024px) {
    .sidebar-toggle {
      display: flex;
    }

    .sidebar {
      transform: translateX(-100%);
      transition: transform 0.28s ease;
      width: 280px;
    }

    .sidebar.sidebar-open {
      transform: translateX(0);
    }

    .sidebar-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }

  @media (min-width: 1025px) {
    .sidebar {
      transform: translateX(0);
    }
  }

  @media (max-width: 480px) {
    .sidebar {
      width: 88vw;
      max-width: 320px;
    }

    .brand-name {
      font-size: 18px;
    }

    .sidebar-link {
      min-height: 48px;
      padding: 0 12px;
    }
  }
`;