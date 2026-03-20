"use client";

import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { usePathname } from "next/navigation";

export const metadata: Metadata = {
  title: "GUFO Dashboard",
  description: "GUFO Web App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Mostra sidebar SOLO nelle pagine private
  const showSidebar =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/profile") ||
    pathname?.startsWith("/wallet");

  return (
    <html lang="it">
      <body style={{ margin: 0, background: "#020617", color: "white" }}>
        
        {showSidebar && <Sidebar />}

        <div
          style={{
            padding: "20px",
            paddingLeft: showSidebar ? "70px" : "20px",
          }}
        >
          {children}
        </div>

      </body>
    </html>
  );
}