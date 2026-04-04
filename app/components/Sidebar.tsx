"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Sidebar.module.css";

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
    { href: "/dashboard", label: "Dashboard", sub: "Control center", icon: "✦" },
    { href: "/wallet", label: "Wallet", sub: "Saldo e movimenti", icon: "◎" },
    { href: "/transactions", label: "Transactions", sub: "Storico attività", icon: "◌" },
    { href: "/membership", label: "Membership", sub: "Livello stagionale", icon: "⬒" },
    { href: "/rewards", label: "Rewards", sub: "Bonus e premi", icon: "✪" },
    { href: "/profile", label: "Profile", sub: "Identità account", icon: "◉" },
    { href: "/customer-code", label: "QR Code", sub: "Codice cliente", icon: "▣" },
    { href: "/partner-demo", label: "Partner Demo", sub: "Anteprima partner", icon: "△" },
    { href: "/partner-dashboard", label: "Partner Dashboard", sub: "Pannello business", icon: "▤" },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={styles.sidebarToggle}
        aria-label="Apri menu"
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarBgGlowA} />
        <div className={styles.sidebarBgGlowB} />
        <div className={styles.sidebarBgGlowC} />
        <div className={styles.sidebarStars} />

        <div className={styles.sidebarInner}>
          <div className={styles.sidebarTop}>
            <div className={styles.brandRow}>
              <div className={styles.brandLogo}>
                <div className={styles.brandLogoHalo} />
                <div className={styles.brandLogoDisc} />
                <div className={styles.brandLogoOwl}>🦉</div>
              </div>

              <div className={styles.brandText}>
                <div className={styles.brandEyebrow}>Rainbow Cashback Network</div>
                <div className={styles.brandTitle}>GUFO</div>
                <div className={styles.brandSub}>Neon Loyalty OS</div>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className={styles.sidebarClose}
              aria-label="Chiudi menu"
              type="button"
            >
              ✕
            </button>
          </div>

          <div className={styles.statusCard}>
            <div className={styles.statusTop}>
              <div>
                <div className={styles.statusLabel}>System status</div>
                <div className={styles.statusTitle}>GUFO Network Live</div>
              </div>

              <div className={styles.statusBadge}>
                <span className={styles.statusDot} />
                Online
              </div>
            </div>

            <div className={styles.statusGrid}>
              <div className={styles.statusMiniCard}>
                <span>Mode</span>
                <strong>Private</strong>
              </div>
              <div className={styles.statusMiniCard}>
                <span>Layer</span>
                <strong>Premium</strong>
              </div>
            </div>
          </div>

          <div className={styles.navTitle}>Navigation</div>

          <nav className={styles.nav}>
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                >
                  <div className={styles.navItemLeft}>
                    <div className={styles.navIcon}>{link.icon}</div>

                    <div className={styles.navText}>
                      <span className={styles.navLabel}>{link.label}</span>
                      <span className={styles.navSub}>{link.sub}</span>
                    </div>
                  </div>

                  <div className={styles.navArrow}>›</div>
                </Link>
              );
            })}
          </nav>

          <div className={styles.bottomCard}>
            <div className={styles.bottomKicker}>GUFO CORE</div>
            <div className={styles.bottomTitle}>Futuristic loyalty dashboard</div>
            <div className={styles.bottomText}>
              Cashback, livelli, premi e strumenti partner in un’unica esperienza premium.
            </div>
          </div>

          <button onClick={handleLogout} className={styles.logoutButton} type="button">
            <span className={styles.logoutIcon}>↗</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}