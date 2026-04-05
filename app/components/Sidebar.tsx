"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Sidebar.module.css";

type SpectrumRoute = {
  href: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
};

function PrismGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 6 18 12 12 18 6 12 12 6Z" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

function OrbitGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <path d="M5.4 12c0-3.8 3-6.8 6.6-6.8 3.7 0 6.6 3 6.6 6.8S15.7 18.8 12 18.8c-3.6 0-6.6-3-6.6-6.8Z" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.65" />
      <path d="M8.2 6.2c2.6 1 5 4 5.8 7.2M16.2 8c-2 0-5.3 2-7.2 5.6" stroke="currentColor" strokeWidth="1.3" opacity="0.42" strokeLinecap="round" />
    </svg>
  );
}

function LedgerGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CrystalGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path d="M12 4 18.5 7.5v9L12 20 5.5 16.5v-9L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4v16M5.5 7.5 12 12l6.5-4.5" stroke="currentColor" strokeWidth="1.3" opacity="0.5" />
    </svg>
  );
}

function NovaGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path d="M12 3.5 14 9l5.5 2-4.2 3.2 1.5 5.3L12 16.7 7.2 19.5l1.5-5.3L4.5 11 10 9l2-5.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function PersonaGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 19c1.8-3 4-4.2 6.5-4.2S16.7 16 18.5 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MatrixGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 15h2v2h-2zM18 18h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2z" fill="currentColor" />
    </svg>
  );
}

function BeaconGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path d="M12 4 20 18H4L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="13.1" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ClusterGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleViewport = () => {
      if (window.innerWidth >= 1140) {
        setDrawerOpen(false);
      }
    };

    handleViewport();
    window.addEventListener("resize", handleViewport);

    return () => window.removeEventListener("resize", handleViewport);
  }, []);

  async function exitSession() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const routes = useMemo<SpectrumRoute[]>(
    () => [
      { href: "/dashboard", title: "Dashboard", subtitle: "Control center", icon: <PrismGlyph /> },
      { href: "/wallet", title: "Wallet", subtitle: "Saldo e movimenti", icon: <OrbitGlyph /> },
      { href: "/transactions", title: "Transazioni", subtitle: "Storico attività", icon: <LedgerGlyph /> },
      { href: "/membership", title: "Membership", subtitle: "Livello stagionale", icon: <CrystalGlyph /> },
      { href: "/rewards", title: "Rewards", subtitle: "Bonus e premi", icon: <NovaGlyph /> },
      { href: "/profile", title: "Profilo", subtitle: "Identità account", icon: <PersonaGlyph /> },
      { href: "/customer-code", title: "QR Code", subtitle: "Codice cliente", icon: <MatrixGlyph /> },
      { href: "/partner-demo", title: "Partner Demo", subtitle: "Anteprima partner", icon: <BeaconGlyph /> },
      { href: "/partner-dashboard", title: "Partner Dashboard", subtitle: "Pannello business", icon: <ClusterGlyph /> },
    ],
    []
  );

  const focused =
    routes.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`)) ??
    routes[0];

  const secondary = routes.filter((route) => route.href !== focused.href);

  return (
    <>
      <button
        type="button"
        className={styles.sparkToggle}
        aria-label="Apri menu"
        onClick={() => setDrawerOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      {drawerOpen && (
        <button
          type="button"
          className={styles.voidLayer}
          aria-label="Chiudi menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside className={`${styles.rainbowHud} ${drawerOpen ? styles.rainbowHudOpen : ""}`}>
        <div className={styles.rainbowLine} />
        <div className={styles.glareA} />
        <div className={styles.glareB} />
        <div className={styles.pixelDust} />

        <div className={styles.hudGrid}>
          <div className={styles.spectrumRail}>
            <div className={styles.coreBadge}>
              <div className={styles.owlSphere}>
                <div className={styles.owlBloom} />
                <div className={styles.owlRing} />
                <div className={styles.owlPlatform} />
                <div className={styles.owlAvatar}>🦉</div>
              </div>

              <div className={styles.coreName}>GUFO</div>
              <div className={styles.coreSub}>Neon OS</div>
            </div>

            <div className={styles.liveNode}>
              <span className={styles.liveOrb} />
              LIVE
            </div>

            <nav className={styles.iconColumn}>
              {routes.map((route) => {
                const isFocused =
                  pathname === route.href || pathname.startsWith(`${route.href}/`);

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`${styles.pulseKey} ${isFocused ? styles.pulseKeyOn : ""}`}
                    title={route.title}
                  >
                    <span className={styles.pulseAura} />
                    <span className={styles.pulseGlyph}>{route.icon}</span>
                  </Link>
                );
              })}
            </nav>

            <div className={styles.energyCore}>
              <div className={styles.energyTube}>
                <div className={styles.energyRainbow} />
              </div>
              <div className={styles.energyText}>CORE</div>
            </div>

            <button
              type="button"
              className={styles.escapeButton}
              onClick={exitSession}
              aria-label="Logout"
              title="Logout"
            >
              ↗
            </button>
          </div>

          <div className={styles.spectrumPanel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.miniTag}>SPECTRAL HUD</div>
                <div className={styles.panelTiny}>Rainbow Cashback Network</div>
              </div>

              <button
                type="button"
                className={styles.panelClose}
                aria-label="Chiudi menu"
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.focusCard}>
              <div className={styles.focusPointer} />
              <div className={styles.focusHalo} />

              <div className={styles.focusGlyph}>{focused.icon}</div>

              <div className={styles.focusCopy}>
                <div className={styles.focusTitle}>{focused.title}</div>
                <div className={styles.focusSubtitle}>{focused.subtitle}</div>
              </div>
            </div>

            <div className={styles.streamList}>
              {secondary.map((route) => (
                <Link key={route.href} href={route.href} className={styles.streamRow}>
                  <div className={styles.streamGlyph}>{route.icon}</div>

                  <div className={styles.streamCopy}>
                    <div className={styles.streamTitle}>{route.title}</div>
                    <div className={styles.streamSubtitle}>{route.subtitle}</div>
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