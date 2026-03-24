import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "./components/LayoutShell";

export const metadata: Metadata = {
  title: "GUFO Dashboard",
  description: "GUFO Web App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="gufo-body">
        <div className="layout-root">
          <LayoutShell>{children}</LayoutShell>
        </div>
      </body>
    </html>
  );
}