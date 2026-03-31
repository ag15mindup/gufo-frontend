import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "./components/LayoutShell";

export const metadata: Metadata = {
  title: "GUFO Dashboard",
  description: "GUFO Web App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="gufo-body">
        <div className="layout-root">
          <div className="layout-shell-frame">
            <LayoutShell>{children}</LayoutShell>
          </div>
        </div>
      </body>
    </html>
  );
}