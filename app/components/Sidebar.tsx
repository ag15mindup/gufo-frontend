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

  const activeLink =
    links.find((link) => pathname === link.href || pathname.startsWith(`${link.href}/`)) ??
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
        <div className={styles.nebulaA} />
        <div className={styles.nebulaB} />
        <div className={styles.stars} />
        <div className={styles.scanGlow} />

        <div className={styles.sidebarInner}>
          <div className={styles.rail}>
            <div className={styles.brandWrap}>
              <div className={styles.logoShell}>
                <div className={styles.logoHalo} />
                <div className={styles.logoRing} />
                <div className={styles.logoDisc} />
                <div className={styles.logoOwl}>🦉</div>
              </div>

              <div className={styles.brandMini}>GUFO</div>
              <div className={styles.brandSub}>Neon OS</div>
            </div>

            <div className={styles.liveCore}>
              <span className={styles.liveDot} />
              <span>LIVE</span>
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
                    title={`${link.label} · ${link.sub}`}
                  >
                    <span className={styles.railGlow} />
                    <span className={styles.railIcon}>{link.icon}</span>
                  </Link>
                );
              })}
            </nav>

            <div className={styles.railFooter}>
              <div className={styles.coreMeter}>
                <div className={styles.coreTrack}>
                  <div className={styles.coreFill} />
                </div>
                <div className={styles.coreLabel}>CORE</div>
              </div>

              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogout}
                title="Logout"
              >
                <span className={styles.logoutIcon}>↗</span>
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelTop}>
              <div>
                <div className={styles.panelBadge}>GUFO ORBITAL PANEL</div>
                <div className={styles.panelHeading}>Rainbow Cashback Network</div>
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

            <div className={styles.panelNav}>
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

                    <div className={styles.panelArrow}>›</div>
                  </Link>
                );
              })}
            </div>

            <div className={styles.panelFooter}>
              <div className={styles.footerLabel}>SYSTEM NOTE</div>
              <div className={styles.footerTitle}>Interfaccia più credibile da startup</div>
              <div className={styles.footerText}>
                Rail laterale, pannello orbitale, glow neon e struttura pronta per
                dashboard, wallet e transazioni in stile spaziale.
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}