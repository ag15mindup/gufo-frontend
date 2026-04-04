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
        <div className={styles.sidebarNoise} />
        <div className={styles.sidebarGrid} />
        <div className={`${styles.sidebarBeam} ${styles.sidebarBeamTop}`} />
        <div className={`${styles.sidebarBeam} ${styles.sidebarBeamBottom}`} />
        <div className={`${styles.sidebarOrb} ${styles.sidebarOrbCyan}`} />
        <div className={`${styles.sidebarOrb} ${styles.sidebarOrbPink}`} />
        <div className={`${styles.sidebarOrb} ${styles.sidebarOrbViolet}`} />

        <div className={styles.sidebarInner}>
          <div className={styles.sidebarHeader}>
            <div className={styles.brandWrap}>
              <div className={styles.brandLogoShell}>
                <div className={styles.brandLogoHalo} />
                <div className={styles.brandLogoDisc} />
                <div className={styles.brandLogoCore}>
                  <span className={styles.brandLogoOwl}>🦉</span>
                </div>
              </div>

              <div className={styles.brandText}>
                <div className={styles.brandKicker}>Neon Loyalty OS</div>
                <div className={styles.brandName}>GUFO</div>
                <div className={styles.brandSubtitle}>Rainbow Cashback Network</div>
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

          <div className={styles.sidebarStatusCard}>
            <div className={styles.statusScan} />
            <div className={styles.statusTop}>
              <div>
                <div className={styles.statusLabel}>System Status</div>
                <div className={styles.statusTitle}>GUFO Network Live</div>
              </div>

              <div className={styles.statusPill}>
                <span className={styles.statusDot} />
                Online
              </div>
            </div>

            <div className={styles.statusGrid}>
              <div className={styles.statusBox}>
                <span>Mode</span>
                <strong>Private</strong>
              </div>
              <div className={styles.statusBox}>
                <span>Layer</span>
                <strong>Premium</strong>
              </div>
            </div>
          </div>

          <div className={styles.sidebarSectionHead}>
            <span className={styles.sectionLine} />
            <span className={styles.sidebarSectionLabel}>Navigation</span>
          </div>

          <nav className={styles.sidebarNav}>
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.sidebarLink} ${isActive ? styles.active : ""}`}
                >
                  <span className={styles.sidebarLinkGlow} />
                  <span className={styles.sidebarLinkIconWrap}>
                    <span className={styles.sidebarLinkIcon}>{link.icon}</span>
                  </span>

                  <span className={styles.sidebarLinkLabelWrap}>
                    <span className={styles.sidebarLinkLabel}>{link.label}</span>
                    <span className={styles.sidebarLinkSub}>{link.sub}</span>
                  </span>

                  <span className={styles.sidebarLinkArrow}>›</span>
                  {isActive && <span className={styles.sidebarLinkActiveDot} />}
                </Link>
              );
            })}
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.sidebarFooterCard}>
              <div className={styles.footerCardKicker}>GUFO Core</div>
              <div className={styles.sidebarFooterTitle}>
                Futuristic loyalty dashboard
              </div>
              <div className={styles.sidebarFooterText}>
                Cashback, membership, rewards e partner tools in un solo ecosistema.
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={styles.logoutButton}
              type="button"
            >
              <span className={styles.logoutIcon}>↗</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}