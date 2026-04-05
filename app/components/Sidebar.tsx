"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Sidebar.module.css";

type NavLink = {
  href: string;
  label: string;
  sub: string;
  icon: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1100) {
        setOpen(false);
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const links = useMemo<NavLink[]>(
    () => [
      {
        href: "/dashboard",
        label: "Dashboard",
        sub: "Control center",
        icon: "◈",
      },
      {
        href: "/wallet",
        label: "Wallet",
        sub: "Saldo e movimenti",
        icon: "◎",
      },
      {
        href: "/transactions",
        label: "Transazioni",
        sub: "Storico attività",
        icon: "◌",
      },
      {
        href: "/membership",
        label: "Membership",
        sub: "Livello stagionale",
        icon: "⬒",
      },
      {
        href: "/rewards",
        label: "Rewards",
        sub: "Bonus e premi",
        icon: "✦",
      },
      {
        href: "/profile",
        label: "Profilo",
        sub: "Identità account",
        icon: "◉",
      },
      {
        href: "/customer-code",
        label: "QR Code",
        sub: "Codice cliente",
        icon: "▣",
      },
      {
        href: "/partner-demo",
        label: "Partner Demo",
        sub: "Anteprima partner",
        icon: "△",
      },
      {
        href: "/partner-dashboard",
        label: "Partner Dashboard",
        sub: "Pannello business",
        icon: "▤",
      },
    ],
    []
  );

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
          aria-label="Chiudi overlay menu"
          className={styles.overlay}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.auroraA} />
        <div className={styles.auroraB} />
        <div className={styles.auroraC} />
        <div className={styles.starField} />
        <div className={styles.gridGlow} />
        <div className={styles.scanline} />

        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.brandBlock}>
              <div className={styles.brandBadge}>GUFO CORE</div>

              <div className={styles.logoCluster}>
                <div className={styles.logoHalo} />
                <div className={styles.logoRing} />
                <div className={styles.logoDisc} />
                <div className={styles.logoOwl}>🦉</div>
              </div>

              <div className={styles.brandText}>
                <div className={styles.brandKicker}>Rainbow Cashback Network</div>
                <div className={styles.brandTitle}>GUFO</div>
                <div className={styles.brandSubtitle}>Neon Loyalty OS</div>
              </div>
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

          <section className={styles.orbitalPanel}>
            <div className={styles.panelTop}>
              <div>
                <div className={styles.panelLabel}>System status</div>
                <div className={styles.panelTitle}>Network online</div>
              </div>

              <div className={styles.liveBadge}>
                <span className={styles.liveDot} />
                LIVE
              </div>
            </div>

            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span>Mode</span>
                <strong>Private</strong>
              </div>

              <div className={styles.statusItem}>
                <span>Layer</span>
                <strong>Premium</strong>
              </div>

              <div className={styles.statusItem}>
                <span>UI</span>
                <strong>Cosmic</strong>
              </div>

              <div className={styles.statusItem}>
                <span>Phase</span>
                <strong>Demo</strong>
              </div>
            </div>
          </section>

          <div className={styles.navLabel}>Navigation</div>

          <nav className={styles.nav}>
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                >
                  <div className={styles.navMain}>
                    <div className={styles.navIcon}>{link.icon}</div>

                    <div className={styles.navText}>
                      <span className={styles.navTitle}>{link.label}</span>
                      <span className={styles.navSub}>{link.sub}</span>
                    </div>
                  </div>

                  <div className={styles.navArrow}>›</div>
                </Link>
              );
            })}
          </nav>

          <section className={styles.signalCard}>
            <div className={styles.signalTag}>DEMO SIGNAL</div>
            <div className={styles.signalTitle}>Futuristic loyalty cockpit</div>
            <p className={styles.signalText}>
              Cashback, premi, membership e strumenti partner dentro una esperienza
              visiva più forte, luminosa e credibile.
            </p>

            <div className={styles.signalBar}>
              <span />
            </div>
          </section>

          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            <span className={styles.logoutGlow} />
            <span className={styles.logoutIcon}>↗</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}