"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Sidebar.module.css";

type RouteCard = {
  href: string;
  title: string;
  caption: string;
  glyph: React.ReactNode;
};

function GemMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.mark} aria-hidden="true">
      <path d="M12 3 21 12 12 21 3 12 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M12 6 18 12 12 18 6 12 12 6Z" fill="currentColor" opacity="0.18" />
    </svg>
  );
}

function VaultMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.mark} aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M15.2 11h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15.3" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

function LedgerMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.mark} aria-hidden="true">
      <path d="M7 7h10M7 12h10M7 17h6.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
    </svg>
  );
}

function TierMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.mark} aria-hidden="true">
      <path d="M12 4 18.5 7.5v9L12 20 5.5 16.5v-9L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4v16M5.5 7.5 12 12l6.5-4.5" stroke="currentColor" strokeWidth="1.4" opacity="0.48" />
    </svg>
  );
}

function PulseMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.mark} aria-hidden="true">
      <path d="m12 3 2.2 5.5L20 10.2l-4.4 3.3 1.6 5.5L12 16l-5.2 3 1.6-5.5L4 10.2l5.8-1.7L12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IdentityMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.mark} aria-hidden="true">
      <circle cx="12" cy="8" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.7 19c1.7-2.9 4-4.2 6.3-4.2s4.6 1.3 6.3 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MatrixMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.mark} aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 15h2v2h-2zM18 18h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2z" fill="currentColor" />
    </svg>
  );
}

function BeaconMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.mark} aria-hidden="true">
      <path d="M12 4 20 18H4L12 4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="13.1" r="1.2" fill="currentColor" />
    </svg>
  );
}

function GridMark() {
  return (
    <svg viewBox="0 0 24 24" className={styles.mark} aria-hidden="true">
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const sync = () => {
      if (window.innerWidth >= 1120) {
        setMobileOpen(false);
      }
    };

    sync();
    window.addEventListener("resize", sync);

    return () => window.removeEventListener("resize", sync);
  }, []);

  async function signOutNow() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const routes = useMemo<RouteCard[]>(
    () => [
      { href: "/dashboard", title: "Dashboard", caption: "Control center", glyph: <GemMark /> },
      { href: "/wallet", title: "Wallet", caption: "Saldo e movimenti", glyph: <VaultMark /> },
      { href: "/transactions", title: "Transazioni", caption: "Storico attività", glyph: <LedgerMark /> },
      { href: "/membership", title: "Membership", caption: "Livello stagionale", glyph: <TierMark /> },
      { href: "/rewards", title: "Rewards", caption: "Bonus e premi", glyph: <PulseMark /> },
      { href: "/profile", title: "Profilo", caption: "Identità account", glyph: <IdentityMark /> },
      { href: "/customer-code", title: "QR Code", caption: "Codice cliente", glyph: <MatrixMark /> },
      { href: "/partner-demo", title: "Partner Demo", caption: "Anteprima partner", glyph: <BeaconMark /> },
      { href: "/partner-dashboard", title: "Partner Dashboard", caption: "Pannello business", glyph: <GridMark /> },
    ],
    []
  );

  const selected =
    routes.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`)) ??
    routes[0];

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Apri navigazione"
        onClick={() => setMobileOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      {mobileOpen && (
        <button
          type="button"
          className={styles.shade}
          aria-label="Chiudi navigazione"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`${styles.wrap} ${mobileOpen ? styles.wrapOpen : ""}`}>
        <div className={styles.sparkA} />
        <div className={styles.sparkB} />
        <div className={styles.mesh} />

        <div className={styles.frame}>
          <section className={styles.spine}>
            <div className={styles.owlDock}>
              <div className={styles.owlAura} />
              <div className={styles.owlRing} />
              <div className={styles.owlPad} />
              <div className={styles.owlFace}>🦉</div>
            </div>

            <div className={styles.identity}>
              <div className={styles.identityMain}>GUFO</div>
              <div className={styles.identitySub}>Neon OS</div>
            </div>

            <div className={styles.statusChip}>
              <span className={styles.statusDot} />
              LIVE
            </div>

            <nav className={styles.lane}>
              {routes.map((route) => {
                const enabled =
                  pathname === route.href || pathname.startsWith(`${route.href}/`);

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`${styles.node} ${enabled ? styles.nodeOn : ""}`}
                    title={route.title}
                  >
                    <span className={styles.nodeGlow} />
                    <span className={styles.nodeGlyph}>{route.glyph}</span>
                  </Link>
                );
              })}
            </nav>

            <div className={styles.engine}>
              <div className={styles.engineTube}>
                <div className={styles.engineCharge} />
              </div>
              <div className={styles.engineLabel}>CORE</div>
            </div>

            <button
              type="button"
              className={styles.quit}
              aria-label="Logout"
              title="Logout"
              onClick={signOutNow}
            >
              ↗
            </button>
          </section>

          <section className={styles.slate}>
            <div className={styles.slateTop}>
              <div className={styles.slateMeta}>
                <div className={styles.chip}>GUIDE ARRAY</div>
                <div className={styles.overline}>Rainbow Cashback Network</div>
              </div>

              <button
                type="button"
                className={styles.dismiss}
                aria-label="Chiudi navigazione"
                onClick={() => setMobileOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.hero}>
              <div className={styles.pointer} />
              <div className={styles.heroGlyph}>{selected.glyph}</div>

              <div className={styles.heroCopy}>
                <div className={styles.heroTitle}>{selected.title}</div>
                <div className={styles.heroSub}>{selected.caption}</div>
              </div>
            </div>

            <div className={styles.catalog}>
              {routes
                .filter((route) => route.href !== selected.href)
                .map((route) => (
                  <Link key={route.href} href={route.href} className={styles.entry}>
                    <div className={styles.entryGlyph}>{route.glyph}</div>

                    <div className={styles.entryCopy}>
                      <div className={styles.entryTitle}>{route.title}</div>
                      <div className={styles.entrySub}>{route.caption}</div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}