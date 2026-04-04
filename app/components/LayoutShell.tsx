"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export default function LayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_ROUTES.includes(pathname);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "#050816",
      }}
    >
      {!isPublicPage && <Sidebar />}

      <div
        style={{
          flex: 1,
          width: "100%",
          marginLeft: isPublicPage ? 0 : "300px",
          transition: "margin-left 0.28s ease",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            width: "100%",
          }}
        >
          {isPublicPage ? (
            children
          ) : (
            <div
              style={{
                position: "relative",
                minHeight: "100vh",
                width: "100%",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "radial-gradient(circle at 10% 20%, rgba(56,189,248,0.08), transparent 22%), radial-gradient(circle at 88% 18%, rgba(236,72,153,0.08), transparent 20%), radial-gradient(circle at 52% 70%, rgba(139,92,246,0.08), transparent 24%)",
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
                  backgroundSize: "36px 36px",
                }}
              />

              <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}