"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const OPEN_ROUTES = ["/", "/login", "/register"];
const RAIL_SPACE = 366;

export default function LayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isOpenRoute = OPEN_ROUTES.includes(pathname);
  const [wideViewport, setWideViewport] = useState(false);

  useEffect(() => {
    const syncViewport = () => {
      setWideViewport(window.innerWidth >= 1120);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        overflowX: "hidden",
        background:
          "radial-gradient(circle at 12% 18%, rgba(73,202,255,0.10), transparent 20%), radial-gradient(circle at 84% 14%, rgba(245,114,182,0.08), transparent 18%), radial-gradient(circle at 58% 78%, rgba(147,51,234,0.10), transparent 24%), linear-gradient(180deg, #030613 0%, #060b1b 52%, #050915 100%)",
      }}
    >
      {!isOpenRoute && <Sidebar />}

      <div
        style={{
          flex: 1,
          width: "100%",
          minWidth: 0,
          marginLeft: !isOpenRoute && wideViewport ? `${RAIL_SPACE}px` : 0,
          transition: "margin-left 0.26s ease",
        }}
      >
        <main
          style={{
            position: "relative",
            width: "100%",
            minWidth: 0,
            minHeight: "100vh",
            overflowX: "hidden",
          }}
        >
          {!isOpenRoute && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  opacity: 0.12,
                  backgroundImage:
                    "radial-gradient(circle at 12% 14%, rgba(255,255,255,0.95) 0 1px, transparent 1.4px), radial-gradient(circle at 30% 72%, rgba(255,255,255,0.72) 0 1px, transparent 1.4px), radial-gradient(circle at 74% 18%, rgba(255,255,255,0.88) 0 1px, transparent 1.4px), radial-gradient(circle at 86% 56%, rgba(255,255,255,0.70) 0 1px, transparent 1.4px), radial-gradient(circle at 56% 36%, rgba(255,255,255,0.72) 0 1px, transparent 1.4px)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  opacity: 0.045,
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                  backgroundSize: "36px 36px",
                }}
              />
            </>
          )}

          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              minWidth: 0,
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}