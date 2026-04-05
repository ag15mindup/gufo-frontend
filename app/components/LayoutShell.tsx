"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const FREE_PAGES = ["/", "/login", "/register"];
const HUD_WIDTH = 356;

export default function LayoutShell({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const isFreePage = FREE_PAGES.includes(pathname);
  const [desktopMode, setDesktopMode] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setDesktopMode(window.innerWidth >= 1140);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        overflowX: "hidden",
        background:
          "radial-gradient(circle at 12% 18%, rgba(73,202,255,0.12), transparent 18%), radial-gradient(circle at 82% 14%, rgba(244,114,182,0.10), transparent 18%), radial-gradient(circle at 56% 76%, rgba(147,51,234,0.12), transparent 22%), radial-gradient(circle at 35% 48%, rgba(34,197,94,0.06), transparent 18%), linear-gradient(180deg, #02040d 0%, #050916 48%, #060a18 100%)",
      }}
    >
      {!isFreePage && <Sidebar />}

      <div
        style={{
          flex: 1,
          width: "100%",
          minWidth: 0,
          marginLeft: !isFreePage && desktopMode ? `${HUD_WIDTH}px` : 0,
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
          {!isFreePage && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  opacity: 0.14,
                  backgroundImage:
                    "radial-gradient(circle at 12% 12%, rgba(255,255,255,0.95) 0 1px, transparent 1.5px), radial-gradient(circle at 24% 72%, rgba(255,255,255,0.72) 0 1px, transparent 1.5px), radial-gradient(circle at 72% 18%, rgba(255,255,255,0.90) 0 1px, transparent 1.5px), radial-gradient(circle at 84% 58%, rgba(255,255,255,0.72) 0 1px, transparent 1.5px), radial-gradient(circle at 56% 36%, rgba(255,255,255,0.76) 0 1px, transparent 1.5px), radial-gradient(circle at 40% 88%, rgba(255,255,255,0.62) 0 1px, transparent 1.5px)",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  opacity: 0.04,
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                  backgroundSize: "38px 38px",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  pointerEvents: "none",
                  background:
                    "linear-gradient(90deg, transparent, rgba(73,202,255,0.42), rgba(168,85,247,0.38), rgba(244,114,182,0.34), transparent)",
                  boxShadow: "0 0 18px rgba(73,202,255,0.2)",
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