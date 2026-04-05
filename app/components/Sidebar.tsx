"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Sidebar.module.css";

type LinkItem = {
  href: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
};

function DiamondIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6 18 12 12 18 6 12 12 6Z" fill="currentColor" opacity="0.22" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 11h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15.5" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M7 7h10M7 12h10M7 17h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
    </svg>
  );
}

function MembershipIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M12 4 18.5 7.5v9L12 20 5.5 16.5v-9L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4v16M5.5 7.5 12 12l6.5-4.5" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
    </svg>
  );
}

function RewardsIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="m12 3 2.1 5.4L20 10.2l-4.6 3.5 1.7 5.8L12 16.3 6.9 19.5l1.7-5.8L4 10.2l5.9-1.8L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19c1.8-3 4-4.2 6.5-4.2S16.7 16 18.5 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 15h2v2h-2zM18 18h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2z" fill="currentColor" />
    </svg>
  );
}

function PartnerIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
      <path d="M12 4 20 18H4L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="13.2" r="1.3" fill="currentColor" />
    </svg>
  );
}

function DashboardBusinessIcon() {
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
      if (window.innerWidth > 1100) {
        setOpen(false);
      }
    };

    onResize();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const links = useMemo<LinkItem[]>(
    () => [
      { href: "/dashboard", label: "Dashboard", sub: "Control center", icon: <DiamondIcon /> },
      { href: "/wallet", label: "Wallet", sub: "Saldo e movimenti", icon: <WalletIcon /> },
      { href: "/transactions", label: "Transazioni", sub: "Storico attività", icon: <TransactionsIcon /> },
      { href: "/membership", label: "Membership", sub: "Livello stagionale", icon: <MembershipIcon /> },
      { href: "/rewards", label: "Rewards", sub: "Bonus e premi", icon: <RewardsIcon /> },
      { href: "/profile", label: "Profilo", sub: "Identità account", icon: <ProfileIcon /> },
      { href: "/customer-code", label: "QR Code", sub: "Codice cliente", icon: <QrIcon /> },
      { href: "/partner-demo", label: "Partner Demo", sub: "Anteprima partner", icon: <PartnerIcon /> },
      { href: "/partner-dashboard", label: "Partner Dashboard", sub: "Pannello business", icon: <DashboardBusinessIcon /> },
    ],
    []
  );

  const activeLink =
    links.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`)) ||
    links[0];

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
        <div className={styles.stars} />
        <div className={styles.glowA} />
        <div className={styles.glowB} />

        <div className={styles.shell}>
          <div className={styles.rail}>
            <div className={styles.railTop}>
              <div className={styles.logoWrap}>
                <div className={styles.logoHalo} />
                <div className={styles.logoRing} />
                <div className={styles.logoDisc} />
                <div className={styles.logoOwl}>🦉</div>
              </div>

              <div className={styles.brandText}>
                <span className={styles.brandTitle}>GUFO</span>
                <span className={styles.brandSub}>Neon OS</span>
              </div>
            </div>

            <div className={styles.liveBadge}>
              <span className={styles.liveDot} />
              LIVE
            </div>

            <nav className={styles.railNav}>
              {links.map((link) => {
                const isActive =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${styles.railItem} ${isActive ? styles.railItemActive : ""}`}
                    title={link.label}
                  >
                    <span className={styles.railItemGlow} />
                    <span className={styles.railIcon}>{link.icon}</span>
                  </Link>
                );
              })}
            </nav>

            <div className={styles.railBottom}>
              <div className={styles.energyBlock}>
                <div className={styles.energyTrack}>
                  <div className={styles.energyFill} />
                </div>
                <span className={styles.energyLabel}>CORE</span>
              </div>

              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
              >
                ↗
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelBadge}>GUFO ORBITAL PANEL</div>
                <div className={styles.panelKicker}>Rainbow Cashback Network</div>
                <div className={styles.panelTitle}>{activeLink.label}</div>
                <div className={styles.panelSub}>{activeLink.sub}</div>
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

            <div className={styles.panelList}>
              {links.map((link) => {
                const isActive =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${styles.panelItem} ${isActive ? styles.panelItemActive : ""}`}
                  >
                    <div className={styles.panelItemIcon}>{link.icon}</div>

                    <div className={styles.panelItemText}>
                      <span className={styles.panelItemLabel}>{link.label}</span>
                      <span className={styles.panelItemSub}>{link.sub}</span>
                    </div>

                    <div className={styles.panelItemArrow}>›</div>
                  </Link>
                );
              })}
            </div>

            <div className={styles.panelFooter}>
              <div className={styles.footerLabel}>SYSTEM NOTE</div>
              <div className={styles.footerTitle}>Sidebar nuova, non derivata dalla vecchia</div>
              <div className={styles.footerText}>
                Rail luminosa a sinistra, pannello navigazione a destra, look più
                spaziale e base migliore per uniformare tutto GUFO.
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}