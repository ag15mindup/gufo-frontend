"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Sidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
};

function IconDiamond() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6 18 12 12 18 6 12 12 6Z" fill="currentColor" opacity="0.18" />
    </svg>
  );
}

function IconWallet() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 11h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15.4" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

function IconTransactions() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M7 7h10M7 12h10M7 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
    </svg>
  );
}

function IconCube() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M12 4 18.5 7.5v9L12 20 5.5 16.5v-9L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4v16M5.5 7.5 12 12l6.5-4.5" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="m12 3 2.2 5.5L20 10.2l-4.4 3.3 1.6 5.5L12 16l-5.2 3 1.6-5.5L4 10.2l5.8-1.7L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19c1.7-2.9 4-4.2 6.5-4.2s4.8 1.3 6.5 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconQr() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 15h2v2h-2zM18 18h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2z" fill="currentColor" />
    </svg>
  );
}

function IconTriangle() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M12 4 20 18H4L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="13.2" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 1100) setOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const items = useMemo<NavItem[]>(
    () => [
      { href: "/dashboard", label: "Dashboard", sub: "Control center", icon: <IconDiamond /> },
      { href: "/wallet", label: "Wallet", sub: "Saldo e movimenti", icon: <IconWallet /> },
      { href: "/transactions", label: "Transazioni", sub: "Storico attività", icon: <IconTransactions /> },
      { href: "/membership", label: "Membership", sub: "Livello stagionale", icon: <IconCube /> },
      { href: "/rewards", label: "Rewards", sub: "Bonus e premi", icon: <IconStar /> },
      { href: "/profile", label: "Profilo", sub: "Identità account", icon: <IconUser /> },
      { href: "/customer-code", label: "QR Code", sub: "Codice cliente", icon: <IconQr /> },
      { href: "/partner-demo", label: "Partner Demo", sub: "Anteprima partner", icon: <IconTriangle /> },
      { href: "/partner-dashboard", label: "Partner Dashboard", sub: "Pannello business", icon: <IconGrid /> },
    ],
    []
  );

  const active =
    items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ||
    items[0];

  return (
    <>
      <button
        type="button"
        aria-label="Apri menu"
        className={styles.mobileToggle}
        onClick={() => setOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <button
          type="button"
          aria-label="Chiudi menu"
          className={styles.overlay}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.neonBorder} />
        <div className={styles.verticalGlow} />
        <div className={styles.starDust} />

        <div className={styles.hud}>
          <div className={styles.rail}>
            <div className={styles.brandBlock}>
              <div className={styles.logoOrb}>
                <div className={styles.logoGlow} />
                <div className={styles.logoCircle} />
                <div className={styles.logoDisc} />
                <div className={styles.logoOwl}>🦉</div>
              </div>

              <div className={styles.brandName}>GUFO</div>
              <div className={styles.brandSub}>Neon OS</div>
            </div>

            <div className={styles.livePill}>
              <span className={styles.liveDot} />
              LIVE
            </div>

            <nav className={styles.iconNav}>
              {items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.iconButton} ${isActive ? styles.iconButtonActive : ""}`}
                    title={item.label}
                  >
                    <span className={styles.iconButtonHalo} />
                    <span className={styles.iconInner}>{item.icon}</span>
                  </Link>
                );
              })}
            </nav>

            <div className={styles.railFooter}>
              <div className={styles.coreWrap}>
                <div className={styles.coreTrack}>
                  <div className={styles.coreFill} />
                </div>
                <div className={styles.coreText}>CORE</div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className={styles.logoutButton}
                title="Logout"
                aria-label="Logout"
              >
                ↗
              </button>
            </div>
          </div>

          <div className={styles.menuPanel}>
            <div className={styles.menuHead}>
              <div className={styles.menuHeadText}>
                <div className={styles.panelTag}>GUFO ORBITAL PANEL</div>
                <div className={styles.panelKicker}>Rainbow Cashback Network</div>
              </div>

              <button
                type="button"
                aria-label="Chiudi menu"
                className={styles.closeButton}
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.activeCard}>
              <div className={styles.activeArrow} />
              <div className={styles.activeIcon}>{active.icon}</div>

              <div className={styles.activeText}>
                <div className={styles.activeLabel}>{active.label}</div>
                <div className={styles.activeSub}>{active.sub}</div>
              </div>
            </div>

            <div className={styles.menuList}>
              {items
                .filter((item) => item.href !== active.href)
                .map((item) => (
                  <Link key={item.href} href={item.href} className={styles.menuRow}>
                    <div className={styles.menuRowIcon}>{item.icon}</div>

                    <div className={styles.menuRowText}>
                      <div className={styles.menuRowLabel}>{item.label}</div>
                      <div className={styles.menuRowSub}>{item.sub}</div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}