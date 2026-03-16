import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GUFO Dashboard",
  description: "GUFO Web App",
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wallet", label: "Wallet" },
  { href: "/transactions", label: "Transactions" },
  { href: "/membership", label: "Membership" },
  { href: "/profile", label: "Profilo" },
  { href: "/customer-code", label: "Codice GUFO" },
  { href: "/partner-demo", label: "Partner Demo" },
  { href: "/partner-dashboard", label: "Partner Dashboard" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0b1220",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            width: "100%",
            flexWrap: "wrap",
          }}
        >
          <aside
            style={{
              width: "220px",
              maxWidth: "100%",
              background: "#111",
              color: "white",
              padding: "20px",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                fontSize: "32px",
                lineHeight: 1.1,
              }}
            >
              GUFO
            </h2>

            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: "white",
                    textDecoration: "none",
                    display: "block",
                    fontSize: "18px",
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main
            style={{
              flex: 1,
              minWidth: 0,
              background: "#0b1220",
              padding: "20px",
              boxSizing: "border-box",
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}