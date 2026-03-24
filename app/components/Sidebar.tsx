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
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-inner">
          <div className="sidebar-top-glow" />

          <div className="sidebar-header">
            <div className="brand-wrap">
              <div className="brand-logo">🦉</div>

              <div className="brand-text">
                <div className="brand-name">GUFO</div>
                <div className="brand-subtitle">Rainbow Cashback</div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="sidebar-close"
              aria-label="Chiudi menu"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-section-label">Navigation</div>

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
                  {isActive && <span className="sidebar-link-active-dot" />}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-card">
              <div className="sidebar-footer-title">GUFO Network</div>
              <div className="sidebar-footer-text">
                Cashback, loyalty e partner ecosystem in un’unica piattaforma.
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="logout-button"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

const sidebarStyles = `
  .sidebar-toggle {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1300;
    width: 54px;
    height: 54px;
    border: none;
    border-radius: 18px;
    background:
      linear-gradient(180deg, rgba(9, 15, 29, 0.86), rgba(15, 23, 42, 0.82));
    box-shadow:
      0 16px 34px rgba(0, 0, 0, 0.34),
      0 0 18px rgba(56, 189, 248, 0.10),
      inset 0 1px 0 rgba(255,255,255,0.05);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    overflow: hidden;
  }

  .sidebar-toggle::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 18px;
    padding: 1.2px;
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
    background: rgba(2, 6, 23, 0.50);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    z-index: 1190;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    z-index: 1200;
    overflow: hidden;
    background:
      linear-gradient(180deg, rgba(8, 12, 24, 0.62), rgba(15, 23, 42, 0.58));
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    box-shadow:
      18px 0 44px rgba(0, 0, 0, 0.28),
      0 0 30px rgba(56, 189, 248, 0.05),
      inset -1px 0 0 rgba(255,255,255,0.05);
  }

  .sidebar::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1.2px;
    background: linear-gradient(
      180deg,
      rgba(236, 72, 153, 0.9),
      rgba(56, 189, 248, 0.9),
      rgba(34, 197, 94, 0.85),
      rgba(250, 204, 21, 0.85),
      rgba(168, 85, 247, 0.9)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.9;
  }

  .sidebar::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 0%, rgba(56, 189, 248, 0.10), transparent 24%),
      radial-gradient(circle at 90% 15%, rgba(236, 72, 153, 0.08), transparent 22%),
      radial-gradient(circle at 30% 100%, rgba(139, 92, 246, 0.08), transparent 28%);
    pointer-events: none;
  }

  .sidebar-inner {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px 16px 18px;
  }

  .sidebar-top-glow {
    position: absolute;
    top: -80px;
    left: -50px;
    width: 220px;
    height: 220px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 68%);
    filter: blur(8px);
    pointer-events: none;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .brand-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .brand-logo {
    width: 52px;
    height: 52px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background: linear-gradient(
      135deg,
      #f472b6 0%,
      #60a5fa 32%,
      #4ade80 68%,
      #facc15 100%
    );
    color: #111827;
    box-shadow:
      0 0 18px rgba(96, 165, 250, 0.18),
      0 0 26px rgba(236, 72, 153, 0.12);
    flex-shrink: 0;
  }

  .brand-text {
    min-width: 0;
  }

  .brand-name {
    color: #ffffff;
    font-size: 21px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.03em;
    text-shadow:
      0 0 14px rgba(56, 189, 248, 0.20),
      0 0 20px rgba(139, 92, 246, 0.12);
  }

  .brand-subtitle {
    margin-top: 5px;
    color: #b8c4de;
    font-size: 12px;
    line-height: 1.25;
    letter-spacing: 0.02em;
  }

  .sidebar-close {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #f8fafc;
    cursor: pointer;
    display: none;
    flex-shrink: 0;
    transition:
      transform 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease;
  }

  .sidebar-close:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.14);
  }

  .sidebar-divider {
    height: 1px;
    background: linear-gradient(
      90deg,
      rgba(236, 72, 153, 0.34),
      rgba(56, 189, 248, 0.34),
      rgba(34, 197, 94, 0.28),
      rgba(250, 204, 21, 0.28)
    );
    margin: 10px 0 18px;
    border-radius: 999px;
  }

  .sidebar-section-label {
    margin-bottom: 10px;
    padding-left: 4px;
    color: rgba(184, 196, 222, 0.75);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
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
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 0 14px;
    border-radius: 18px;
    text-decoration: none;
    color: #dbe4f0;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.05);
    transition:
      transform 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease,
      color 0.18s ease,
      box-shadow 0.18s ease;
    overflow: hidden;
  }

  .sidebar-link::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      rgba(56, 189, 248, 0.04),
      rgba(139, 92, 246, 0.04),
      rgba(236, 72, 153, 0.04)
    );
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  .sidebar-link:hover {
    transform: translateY(-1px);
    background: rgba(255,255,255,0.055);
    border-color: rgba(255,255,255,0.11);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16);
  }

  .sidebar-link:hover::before {
    opacity: 1;
  }

  .sidebar-link.active {
    color: #ffffff;
    background:
      linear-gradient(
        90deg,
        rgba(244, 114, 182, 0.13),
        rgba(96, 165, 250, 0.13),
        rgba(74, 222, 128, 0.10),
        rgba(250, 204, 21, 0.10)
      );
    border-color: rgba(96, 165, 250, 0.30);
    box-shadow:
      0 0 18px rgba(56, 189, 248, 0.10),
      0 0 24px rgba(139, 92, 246, 0.08),
      inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .sidebar-link-icon {
    width: 22px;
    flex-shrink: 0;
    text-align: center;
    font-size: 14px;
    color: inherit;
    position: relative;
    z-index: 1;
  }

  .sidebar-link-label {
    font-size: 14px;
    font-weight: 800;
    line-height: 1.2;
    color: inherit;
    position: relative;
    z-index: 1;
  }

  .sidebar-link-active-dot {
    margin-left: auto;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(
      180deg,
      rgba(56, 189, 248, 1),
      rgba(236, 72, 153, 1)
    );
    box-shadow:
      0 0 10px rgba(56, 189, 248, 0.8),
      0 0 16px rgba(236, 72, 153, 0.45);
    position: relative;
    z-index: 1;
    flex-shrink: 0;
  }

  .sidebar-footer {
    margin-top: auto;
    padding-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .sidebar-footer-card {
    padding: 14px;
    border-radius: 18px;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.06);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.03),
      0 10px 24px rgba(0, 0, 0, 0.16);
  }

  .sidebar-footer-title {
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    margin-bottom: 6px;
  }

  .sidebar-footer-text {
    color: #aeb9d4;
    font-size: 12px;
    line-height: 1.45;
  }

  .logout-button {
    width: 100%;
    min-height: 52px;
    border: none;
    border-radius: 18px;
    cursor: pointer;
    color: white;
    font-weight: 800;
    font-size: 14px;
    background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
    box-shadow:
      0 12px 24px rgba(239, 68, 68, 0.18),
      0 0 18px rgba(239, 68, 68, 0.10);
    transition:
      transform 0.18s ease,
      opacity 0.18s ease,
      box-shadow 0.18s ease;
  }

  .logout-button:hover {
    transform: translateY(-1px);
    opacity: 0.97;
    box-shadow:
      0 14px 28px rgba(239, 68, 68, 0.22),
      0 0 22px rgba(239, 68, 68, 0.14);
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

    .brand-subtitle {
      font-size: 11px;
    }

    .sidebar-link {
      min-height: 48px;
      padding: 0 12px;
      border-radius: 16px;
    }

    .logout-button {
      min-height: 50px;
      border-radius: 16px;
    }
  }
`;