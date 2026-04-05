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
    function onResize() {
      if (window.innerWidth > 1100) {
        setOpen(false);
      }
    }

    window.addEventListener("resize", onResize);
    onResize();

    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const links = useMemo<NavLink[]>(
    () => [
      { href: "/dashboard", label: "Dashboard", sub: "Control center", icon: "◈" },
      { href: "/wallet", label: "Wallet", sub: "Saldo e movimenti", icon: "◎" },
      { href: "/transactions", label: "Transazioni", sub: "Storico attività", icon: "◌" },
      { href: "/membership", label: "Membership", sub: "Livello stagionale", icon: "⬒" },
      { href: "/rewards", label: "Rewards", sub: "Bonus e premi", icon: "✦" },
      { href: "/profile", label: "Profilo", sub: "Identità account", icon: "◉" },
      { href: "/customer-code", label: "QR Code", sub: "Codice cliente", icon: "▣" },
      { href: "/partner-demo", label: "Partner Demo", sub: "Anteprima partner", icon: "△" },
      { href: "/partner-dashboard", label: "Partner Dashboard", sub: "Pannello business", icon: "▤" },
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
          aria-label="Chiudi menu"
          className={styles.overlay}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
        <div className={styles.stars} />
        <div className={styles.glowA} />
        <div className={styles.glowB} />
        <div className={styles.glowC} />
        <div className={styles.edgeLight} />

        <div className={styles.inner}>
          <div className={styles.topbar}>
            <div className={styles.kicker}>GUFO ORBITAL PANEL</div>

            <button
              type="button"
              aria-label="Chiudi menu"
              className={styles.closeButton}
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className={styles.brandCard}>
            <div className={styles.brandLeft}>
              <div className={styles.reactor}>
                <div className={styles.reactorRing} />
                <div className={styles.reactorCore}>🦉</div>
                <div className={styles.reactorDisc} />
              </div>
            </div>

            <div className={styles.brandRight}>
              <div className={styles.brandMini}>Rainbow Cashback Network</div>
              <div className={styles.brandTitle}>GUFO</div>
              <div className={styles.brandSub}>Neon loyalty cockpit</div>
            </div>
          </div>

          <div className={styles.commandCard}>
            <div className={styles.commandHeader}>
              <div>
                <div className={styles.commandLabel}>Status</div>
                <div className={styles.commandTitle}>Network online</div>
              </div>

              <div className={styles.livePill}>
                <span className={styles.liveDot} />
                LIVE
              </div>
            </div>

            <div className={styles.commandGrid}>
              <div className={styles.commandCell}>
                <span>Mode</span>
                <strong>Private</strong>
              </div>
              <div className={styles.commandCell}>
                <span>Layer</span>
                <strong>Premium</strong>
              </div>
              <div className={styles.commandCell}>
                <span>UI</span>
                <strong>Cosmic</strong>
              </div>
              <div className={styles.commandCell}>
                <span>Stage</span>
                <strong>Demo</strong>
              </div>
            </div>
          </div>

          <div className={styles.navHeader}>
            <span className={styles.navHeaderLine} />
            Navigation
          </div>

          <nav className={styles.nav}>
            {links.map((link, index) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                >
                  <div className={styles.navIndex}>
                    {(index + 1).toString().padStart(2, "0")}
                  </div>

                  <div className={styles.navIcon}>{link.icon}</div>

                  <div className={styles.navText}>
                    <span className={styles.navLabel}>{link.label}</span>
                    <span className={styles.navSub}>{link.sub}</span>
                  </div>

                  <div className={styles.navArrow}>›</div>
                </Link>
              );
            })}
          </nav>

          <div className={styles.bottomPanel}>
            <div className={styles.bottomPanelLabel}>SYSTEM NOTE</div>
            <div className={styles.bottomPanelTitle}>Esperienza più credibile da startup</div>
            <p className={styles.bottomPanelText}>
              Sidebar più forte, struttura più premium e base pronta per dashboard,
              wallet e transazioni con stile galattico.
            </p>

            <div className={styles.energyBar}>
              <div className={styles.energyFill} />
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <span className={styles.logoutGlow} />
            <span className={styles.logoutIcon}>↗</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}