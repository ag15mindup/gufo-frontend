"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./Sidebar.module.css";

type HudRoute = {
  href: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
};

function PrismGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path
        d="M12 3 21 12 12 21 3 12 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 6 18 12 12 18 6 12 12 6Z"
        fill="currentColor"
        opacity="0.18"
      />
    </svg>
  );
}

function OrbitGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <path
        d="M5.4 12c0-3.8 3-6.8 6.6-6.8 3.7 0 6.6 3 6.6 6.8S15.7 18.8 12 18.8c-3.6 0-6.6-3-6.6-6.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.65"
      />
      <path
        d="M8.2 6.2c2.6 1 5 4 5.8 7.2M16.2 8c-2 0-5.3 2-7.2 5.6"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.42"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LedgerGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CrystalGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path
        d="M12 4 18.5 7.5v9L12 20 5.5 16.5v-9L12 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 4v16M5.5 7.5 12 12l6.5-4.5"
        stroke="currentColor"
        strokeWidth="1.3"
        opacity="0.5"
      />
    </svg>
  );
}

function NovaGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path
        d="M12 3.5 14 9l5.5 2-4.2 3.2 1.5 5.3L12 16.7 7.2 19.5l1.5-5.3L4.5 11 10 9l2-5.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function PersonaGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5.5 19c1.8-3 4-4.2 6.5-4.2S16.7 16 18.5 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MatrixGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15 15h2v2h-2zM18 18h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2z"
        fill="currentColor"
      />
    </svg>
  );
}

function BeaconGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <path
        d="M12 4 20 18H4L12 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="13.1" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ClusterGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={styles.glyphSvg} aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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
    const handleResize = () => {
      if (window.innerWidth >= 1140) {
        setDrawerOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function exitSession() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const routes = useMemo<HudRoute[]>(
    () => [
      {
        href: "/dashboard",
        title: "Dashboard",
        subtitle: "Control center",
        icon: <PrismGlyph />,
      },
      {
        href: "/wallet",
        title: "Wallet",
        subtitle: "Saldo e movimenti",
        icon: <OrbitGlyph />,
      },
      {
        href: "/transactions",
        title: "Transazioni",
        subtitle: "Storico attività",
        icon: <LedgerGlyph />,
      },
      {
        href: "/membership",
        title: "Membership",
        subtitle: "Livello stagionale",
        icon: <CrystalGlyph />,
      },
      {
        href: "/rewards",
        title: "Rewards",
        subtitle: "Bonus e premi",
        icon: <NovaGlyph />,
      },
      {
        href: "/profile",
        title: "Profilo",
        subtitle: "Identità account",
        icon: <PersonaGlyph />,
      },
      {
        href: "/customer-code",
        title: "QR Code",
        subtitle: "Codice cliente",
        icon: <MatrixGlyph />,
      },
      {
        href: "/partner-demo",
        title: "Partner Demo",
        subtitle: "Anteprima partner",
        icon: <BeaconGlyph />,
      },
      {
        href: "/partner-dashboard",
        title: "Partner Dashboard",
        subtitle: "Pannello business",
        icon: <ClusterGlyph />,
      },
    ],
    []
  );

  const activeRoute =
    routes.find((route) => pathname === route.href || pathname.startsWith(`${route.href}/`)) ??
    routes[0];

  const secondaryRoutes = routes.filter((route) => route.href !== activeRoute.href);

  return (
    <>
      <button
        type="button"
        className={styles.hudToggle}
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
          className={styles.backdrop}
          aria-label="Chiudi menu"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside className={`${styles.sidebarHud} ${drawerOpen ? styles.sidebarHudOpen : ""}`}>
        <div className={styles.sidebarGlowA} />
        <div className={styles.sidebarGlowB} />
        <div className={styles.sidebarStars} />
        <div className={styles.sidebarEdge} />

        <div className={styles.sidebarShell}>
          <div className={styles.rail}>
            <div className={styles.logoBlock}>
              <div className={styles.logoOrb}>
                <div className={styles.logoOrbGlow} />
                <div className={styles.logoOrbRing} />

                <div className={styles.owlAvatar}>
                  <Image
                    src="/gufo-sidebar-logo.png"
                    alt="Logo GUFO"
                    width={54}
                    height={54}
                    className={styles.owlLogoImg}
                    priority
                  />
                </div>
              </div>

              <div className={styles.brandName}>GUFO</div>
              <div className={styles.brandSub}>Neon OS</div>
            </div>

            <div className={styles.statusPill}>
              <span className={styles.statusDot} />
              LIVE
            </div>

            <nav className={styles.iconStack}>
              {routes.map((route) => {
                const isActive =
                  pathname === route.href || pathname.startsWith(`${route.href}/`);

                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`${styles.iconNode} ${isActive ? styles.iconNodeActive : ""}`}
                    title={route.title}
                  >
                    <span className={styles.iconNodeGlow} />
                    <span className={styles.iconNodeGlyph}>{route.icon}</span>
                  </Link>
                );
              })}
            </nav>

            <div className={styles.coreMeter}>
              <div className={styles.coreTrack}>
                <div className={styles.coreFill} />
              </div>
              <div className={styles.coreLabel}>CORE</div>
            </div>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={exitSession}
              aria-label="Logout"
              title="Logout"
            >
              ↗
            </button>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelTag}>SPECTRAL HUD</div>
                <div className={styles.panelCaption}>Rainbow Cashback Network</div>
              </div>

              <button
                type="button"
                className={styles.mobileClose}
                aria-label="Chiudi menu"
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.activeDock}>
              <div className={styles.activeDockArrow} />
              <div className={styles.activeDockGlow} />

              <div className={styles.activeIcon}>{activeRoute.icon}</div>

              <div className={styles.activeCopy}>
                <div className={styles.activeTitle}>{activeRoute.title}</div>
                <div className={styles.activeSubtitle}>{activeRoute.subtitle}</div>
              </div>
            </div>

            <div className={styles.menuList}>
              {secondaryRoutes.map((route) => (
                <Link key={route.href} href={route.href} className={styles.menuRow}>
                  <div className={styles.menuIcon}>{route.icon}</div>

                  <div className={styles.menuText}>
                    <div className={styles.menuTitle}>{route.title}</div>
                    <div className={styles.menuSubtitle}>{route.subtitle}</div>
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