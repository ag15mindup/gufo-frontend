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
    { href: "/dashboard", label: "Dashboard", sub: "Control center", icon: "◈" },
    { href: "/wallet", label: "Wallet", sub: "Assets & balance", icon: "◎" },
    { href: "/transactions", label: "Transactions", sub: "Activity log", icon: "◌" },
    { href: "/membership", label: "Membership", sub: "Season level", icon: "✦" },
    { href: "/rewards", label: "Rewards", sub: "Bonuses & gifts", icon: "✪" },
    { href: "/profile", label: "Profile", sub: "Identity layer", icon: "◉" },
    { href: "/customer-code", label: "QR Code", sub: "Customer access", icon: "▣" },
    { href: "/partner-demo", label: "Partner Demo", sub: "Merchant preview", icon: "△" },
    { href: "/partner-dashboard", label: "Partner Dashboard", sub: "Business panel", icon: "▤" },
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
        <div className="sidebar-noise" />
        <div className="sidebar-grid" />
        <div className="sidebar-beam sidebar-beam-top" />
        <div className="sidebar-beam sidebar-beam-bottom" />
        <div className="sidebar-orb sidebar-orb-cyan" />
        <div className="sidebar-orb sidebar-orb-pink" />
        <div className="sidebar-orb sidebar-orb-violet" />

        <div className="sidebar-inner">
          <div className="sidebar-header">
            <div className="brand-wrap">
              <div className="brand-logo-shell">
                <div className="brand-logo-halo" />
                <div className="brand-logo-disc" />
                <div className="brand-logo-core">
                  <span className="brand-logo-owl">🦉</span>
                </div>
              </div>

              <div className="brand-text">
                <div className="brand-kicker">Neon Loyalty OS</div>
                <div className="brand-name">GUFO</div>
                <div className="brand-subtitle">Rainbow Cashback Network</div>
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

          <div className="sidebar-status-card">
            <div className="status-scan" />
            <div className="status-top">
              <div>
                <div className="status-label">System Status</div>
                <div className="status-title">GUFO Network Live</div>
              </div>

              <div className="status-pill">
                <span className="status-dot" />
                Online
              </div>
            </div>

            <div className="status-grid">
              <div className="status-box">
                <span>Mode</span>
                <strong>Private</strong>
              </div>
              <div className="status-box">
                <span>Layer</span>
                <strong>Premium</strong>
              </div>
            </div>
          </div>

          <div className="sidebar-section-head">
            <span className="section-line" />
            <span className="sidebar-section-label">Navigation</span>
          </div>

          <nav className="sidebar-nav">
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-link-glow" />
                  <span className="sidebar-link-icon-wrap">
                    <span className="sidebar-link-icon">{link.icon}</span>
                  </span>

                  <span className="sidebar-link-label-wrap">
                    <span className="sidebar-link-label">{link.label}</span>
                    <span className="sidebar-link-sub">{link.sub}</span>
                  </span>

                  <span className="sidebar-link-arrow">›</span>
                  {isActive && <span className="sidebar-link-active-dot" />}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-footer-card">
              <div className="footer-card-kicker">GUFO Core</div>
              <div className="sidebar-footer-title">
                Futuristic loyalty dashboard
              </div>
              <div className="sidebar-footer-text">
                Cashback, membership, rewards e partner tools in un solo ecosistema.
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="logout-button"
              type="button"
            >
              <span className="logout-icon">↗</span>
              <span>Logout</span>
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
    z-index: 1400;
    width: 58px;
    height: 58px;
    border: none;
    border-radius: 18px;
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 5px;
    cursor: pointer;
    background:
      linear-gradient(180deg, rgba(8, 14, 28, 0.95), rgba(11, 18, 36, 0.88));
    box-shadow:
      0 18px 36px rgba(0, 0, 0, 0.34),
      0 0 18px rgba(56, 189, 248, 0.14),
      0 0 28px rgba(139, 92, 246, 0.12),
      inset 0 1px 0 rgba(255,255,255,0.05);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    overflow: hidden;
  }

  .sidebar-toggle::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 18px;
    padding: 1px;
    background: linear-gradient(
      90deg,
      rgba(56, 189, 248, 0.95),
      rgba(139, 92, 246, 0.92),
      rgba(236, 72, 153, 0.92),
      rgba(250, 204, 21, 0.88),
      rgba(34, 197, 94, 0.9)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .sidebar-toggle span {
    width: 22px;
    height: 2px;
    border-radius: 999px;
    background: #f8fafc;
    position: relative;
    z-index: 1;
    box-shadow: 0 0 8px rgba(255,255,255,0.18);
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.68);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 1290;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 320px;
    height: 100vh;
    z-index: 1300;
    overflow: hidden;
    background:
      linear-gradient(
        180deg,
        rgba(4, 8, 18, 0.9) 0%,
        rgba(7, 13, 28, 0.86) 34%,
        rgba(10, 18, 38, 0.92) 100%
      );
    backdrop-filter: blur(28px);
    -webkit-backdrop-filter: blur(28px);
    box-shadow:
      18px 0 48px rgba(0, 0, 0, 0.4),
      0 0 24px rgba(56, 189, 248, 0.08),
      0 0 34px rgba(139, 92, 246, 0.08),
      inset -1px 0 0 rgba(255,255,255,0.05);
  }

  .sidebar::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1px;
    background: linear-gradient(
      180deg,
      rgba(56, 189, 248, 0.95),
      rgba(139, 92, 246, 0.92),
      rgba(236, 72, 153, 0.88),
      rgba(250, 204, 21, 0.82),
      rgba(34, 197, 94, 0.82)
    );
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.92;
  }

  .sidebar-noise {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.08;
    background-image:
      radial-gradient(rgba(255,255,255,0.35) 0.6px, transparent 0.7px);
    background-size: 8px 8px;
    mix-blend-mode: screen;
  }

  .sidebar-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.06;
    background-image:
      linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: linear-gradient(180deg, rgba(0,0,0,0.9), transparent 96%);
  }

  .sidebar-beam {
    position: absolute;
    left: -20%;
    width: 140%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(56, 189, 248, 0.22),
      rgba(236, 72, 153, 0.18),
      transparent
    );
    opacity: 0.45;
    pointer-events: none;
  }

  .sidebar-beam-top {
    top: 92px;
  }

  .sidebar-beam-bottom {
    bottom: 108px;
  }

  .sidebar-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(30px);
    pointer-events: none;
    opacity: 0.42;
  }

  .sidebar-orb-cyan {
    top: -40px;
    left: -40px;
    width: 220px;
    height: 220px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.34), transparent 70%);
  }

  .sidebar-orb-pink {
    top: 180px;
    right: -80px;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(236, 72, 153, 0.24), transparent 72%);
  }

  .sidebar-orb-violet {
    bottom: -50px;
    left: 20px;
    width: 210px;
    height: 210px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.24), transparent 70%);
  }

  .sidebar-inner {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 18px 16px 18px;
  }

  .sidebar-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;
  }

  .brand-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .brand-logo-shell {
    position: relative;
    width: 66px;
    height: 66px;
    flex-shrink: 0;
  }

  .brand-logo-halo {
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(96, 165, 250, 0.26),
      rgba(139, 92, 246, 0.18),
      transparent 72%
    );
    filter: blur(12px);
  }

  .brand-logo-disc {
    position: absolute;
    left: 7px;
    right: 7px;
    bottom: 3px;
    height: 18px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(56, 189, 248, 0.9),
      rgba(139, 92, 246, 0.92),
      rgba(236, 72, 153, 0.9),
      rgba(250, 204, 21, 0.86)
    );
    box-shadow:
      0 0 18px rgba(96, 165, 250, 0.24),
      0 0 24px rgba(236, 72, 153, 0.18);
    opacity: 0.95;
  }

  .brand-logo-core {
    position: absolute;
    inset: 0;
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 34%),
      linear-gradient(
        135deg,
        rgba(244, 114, 182, 0.95) 0%,
        rgba(96, 165, 250, 0.96) 28%,
        rgba(139, 92, 246, 0.96) 56%,
        rgba(74, 222, 128, 0.92) 78%,
        rgba(250, 204, 21, 0.92) 100%
      );
    box-shadow:
      0 0 18px rgba(96, 165, 250, 0.22),
      0 0 28px rgba(236, 72, 153, 0.14),
      inset 0 1px 0 rgba(255,255,255,0.28);
  }

  .brand-logo-owl {
    position: relative;
    z-index: 1;
    font-size: 28px;
    color: #081120;
  }

  .brand-text {
    min-width: 0;
    padding-top: 3px;
  }

  .brand-kicker {
    color: rgba(184, 196, 222, 0.8);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .brand-name {
    color: #ffffff;
    font-size: 26px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.05em;
    text-shadow:
      0 0 18px rgba(56, 189, 248, 0.24),
      0 0 24px rgba(139, 92, 246, 0.16);
  }

  .brand-subtitle {
    margin-top: 6px;
    color: #b8c4de;
    font-size: 12px;
    line-height: 1.3;
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

  .sidebar-status-card {
    position: relative;
    overflow: hidden;
    padding: 14px;
    border-radius: 22px;
    margin-bottom: 18px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.04),
      0 12px 26px rgba(0, 0, 0, 0.18);
  }

  .status-scan {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(56, 189, 248, 0.06) 50%,
      transparent 100%
    );
    opacity: 0.9;
  }

  .status-top {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .status-label {
    color: rgba(184, 196, 222, 0.72);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 5px;
  }

  .status-title {
    color: #ffffff;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.1;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: #eef2ff;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: linear-gradient(180deg, #4ade80, #22c55e);
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.45);
  }

  .status-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .status-box {
    padding: 12px 10px;
    border-radius: 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
  }

  .status-box span {
    display: block;
    color: #9fb0d3;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 5px;
  }

  .status-box strong {
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
  }

  .sidebar-section-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding-left: 2px;
  }

  .section-line {
    width: 18px;
    height: 1px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgba(56, 189, 248, 0.8),
      rgba(236, 72, 153, 0.75)
    );
  }

  .sidebar-section-label {
    color: rgba(184, 196, 222, 0.78);
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

  .sidebar-nav::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar-nav::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.12);
    border-radius: 999px;
  }

  .sidebar-link {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 62px;
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

  .sidebar-link-glow {
    position: absolute;
    inset: auto auto -28px -10px;
    width: 120px;
    height: 72px;
    background: radial-gradient(circle, rgba(56, 189, 248, 0.18), transparent 70%);
    filter: blur(16px);
    opacity: 0;
    transition: opacity 0.18s ease;
    pointer-events: none;
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
    box-shadow:
      0 12px 24px rgba(0, 0, 0, 0.16),
      0 0 14px rgba(56, 189, 248, 0.06);
  }

  .sidebar-link:hover::before,
  .sidebar-link:hover .sidebar-link-glow {
    opacity: 1;
  }

  .sidebar-link.active {
    color: #ffffff;
    background:
      linear-gradient(
        90deg,
        rgba(244, 114, 182, 0.13),
        rgba(96, 165, 250, 0.14),
        rgba(139, 92, 246, 0.12),
        rgba(74, 222, 128, 0.1),
        rgba(250, 204, 21, 0.1)
      );
    border-color: rgba(96, 165, 250, 0.32);
    box-shadow:
      0 0 18px rgba(56, 189, 248, 0.12),
      0 0 24px rgba(139, 92, 246, 0.1),
      inset 0 1px 0 rgba(255,255,255,0.05);
  }

  .sidebar-link.active::before,
  .sidebar-link.active .sidebar-link-glow {
    opacity: 1;
  }

  .sidebar-link-icon-wrap {
    width: 38px;
    height: 38px;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
  }

  .sidebar-link-icon {
    font-size: 14px;
    color: inherit;
    line-height: 1;
  }

  .sidebar-link-label-wrap {
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
  }

  .sidebar-link-label {
    font-size: 14px;
    font-weight: 800;
    line-height: 1.2;
    color: inherit;
  }

  .sidebar-link-sub {
    margin-top: 3px;
    font-size: 11px;
    color: rgba(184, 196, 222, 0.68);
    line-height: 1.2;
  }

  .sidebar-link-arrow {
    margin-left: auto;
    color: rgba(255,255,255,0.38);
    font-size: 18px;
    line-height: 1;
    position: relative;
    z-index: 1;
  }

  .sidebar-link-active-dot {
    position: absolute;
    right: 10px;
    top: 10px;
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
    z-index: 1;
  }

  .sidebar-footer {
    margin-top: auto;
    padding-top: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .sidebar-footer-card {
    position: relative;
    overflow: hidden;
    padding: 15px;
    border-radius: 20px;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.03));
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.03),
      0 10px 24px rgba(0, 0, 0, 0.16);
  }

  .sidebar-footer-card::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        90deg,
        rgba(56, 189, 248, 0.06),
        rgba(139, 92, 246, 0.05),
        rgba(236, 72, 153, 0.05)
      );
    pointer-events: none;
  }

  .footer-card-kicker {
    position: relative;
    z-index: 1;
    color: #9fb0d3;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 7px;
  }

  .sidebar-footer-title {
    position: relative;
    z-index: 1;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    margin-bottom: 7px;
    line-height: 1.3;
  }

  .sidebar-footer-text {
    position: relative;
    z-index: 1;
    color: #aeb9d4;
    font-size: 12px;
    line-height: 1.5;
  }

  .logout-button {
    width: 100%;
    min-height: 54px;
    border: none;
    border-radius: 18px;
    cursor: pointer;
    color: white;
    font-weight: 800;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: linear-gradient(
      90deg,
      rgba(239, 68, 68, 0.95) 0%,
      rgba(220, 38, 38, 0.95) 100%
    );
    box-shadow:
      0 12px 24px rgba(239, 68, 68, 0.2),
      0 0 18px rgba(239, 68, 68, 0.1);
    transition:
      transform 0.18s ease,
      opacity 0.18s ease,
      box-shadow 0.18s ease;
  }

  .logout-button:hover {
    transform: translateY(-1px);
    opacity: 0.97;
    box-shadow:
      0 14px 28px rgba(239, 68, 68, 0.24),
      0 0 22px rgba(239, 68, 68, 0.14);
  }

  .logout-icon {
    font-size: 15px;
    line-height: 1;
  }

  @media (max-width: 1024px) {
    .sidebar-toggle {
      display: flex;
    }

    .sidebar {
      transform: translateX(-100%);
      transition: transform 0.28s ease;
      width: 300px;
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
      font-size: 22px;
    }

    .brand-subtitle {
      font-size: 11px;
    }

    .sidebar-link {
      min-height: 56px;
      padding: 0 12px;
      border-radius: 16px;
    }

    .sidebar-link-icon-wrap {
      width: 34px;
      height: 34px;
      border-radius: 11px;
    }

    .logout-button {
      min-height: 50px;
      border-radius: 16px;
    }
  }
`;