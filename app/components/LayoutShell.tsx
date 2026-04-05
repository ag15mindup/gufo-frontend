"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const PUBLIC_ROUTES = ["/", "/login", "/register"];
const DESKTOP_SIDEBAR_WIDTH = 372;

export default function LayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_ROUTES.includes(pathname);

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth > 1100);
    };

    onResize();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        background:
          "radial-gradient(circle at 15% 20%, rgba(56,189,248,0.10), transparent 20%), radial-gradient(circle at 80% 16%, rgba(244,114,182,0.10), transparent 20%), radial-gradient(circle at 55% 72%, rgba(168,85,247,0.10), transparent 24%), linear-gradient(180deg, #030614 0%, #060b1d 55%, #050915 100%)",
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
                  opacity: 0.15,
                  backgroundImage:
                    "radial-gradient(circle at 14% 20%, rgba(255,255,255,0.95) 0 1px, transparent 1.4px), radial-gradient(circle at 28% 76%, rgba(255,255,255,0.72) 0 1px, transparent 1.4px), radial-gradient(circle at 72% 18%, rgba(255,255,255,0.86) 0 1px, transparent 1.4px), radial-gradient(circle at 84% 56%, rgba(255,255,255,0.72) 0 1px, transparent 1.4px), radial-gradient(circle at 54% 38%, rgba(255,255,255,0.72) 0 1px, transparent 1.4px)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  opacity: 0.05,
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                  backgroundSize: "34px 34px",
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