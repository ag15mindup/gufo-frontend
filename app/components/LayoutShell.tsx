"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const PUBLIC_ROUTES = ["/", "/login", "/register"];
const DESKTOP_SIDEBAR_WIDTH = 380;

export default function LayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_ROUTES.includes(pathname);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function checkViewport() {
      setIsDesktop(window.innerWidth > 1100);
    }

    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,0.10), transparent 18%), radial-gradient(circle at top right, rgba(244,114,182,0.09), transparent 20%), radial-gradient(circle at bottom center, rgba(139,92,246,0.10), transparent 25%), linear-gradient(180deg, #030611 0%, #050816 45%, #060b1c 100%)",
        overflowX: "hidden",
      }}
    >
      {!isPublicPage && <Sidebar />}

      <div
        style={{
          flex: 1,
          width: "100%",
          minWidth: 0,
          marginLeft: !isPublicPage && isDesktop ? `${DESKTOP_SIDEBAR_WIDTH}px` : 0,
          transition: "margin-left 0.28s ease",
        }}
      >
        <main
          style={{
            position: "relative",
            minHeight: "100vh",
            width: "100%",
            minWidth: 0,
            overflowX: "hidden",
          }}
        >
          {!isPublicPage && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "radial-gradient(circle at 8% 18%, rgba(56,189,248,0.10), transparent 18%), radial-gradient(circle at 84% 14%, rgba(236,72,153,0.10), transparent 18%), radial-gradient(circle at 58% 68%, rgba(168,85,247,0.10), transparent 22%)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  opacity: 0.08,
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                  backgroundSize: "34px 34px",
                  maskImage:
                    "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.2))",
                  WebkitMaskImage:
                    "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.2))",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  opacity: 0.2,
                  backgroundImage:
                    "radial-gradient(circle at 12% 22%, rgba(255,255,255,0.95) 0 1px, transparent 1.5px), radial-gradient(circle at 32% 72%, rgba(255,255,255,0.72) 0 1px, transparent 1.5px), radial-gradient(circle at 72% 18%, rgba(255,255,255,0.9) 0 1px, transparent 1.5px), radial-gradient(circle at 82% 56%, rgba(255,255,255,0.75) 0 1px, transparent 1.5px), radial-gradient(circle at 52% 36%, rgba(255,255,255,0.78) 0 1px, transparent 1.5px), radial-gradient(circle at 24% 88%, rgba(255,255,255,0.7) 0 1px, transparent 1.5px)",
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