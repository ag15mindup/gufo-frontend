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
        <style>{`
          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            overflow-x: hidden;
          }

          .gufo-layout {
            display: flex;
            min-height: 100vh;
            width: 100%;
          }

          .gufo-sidebar {
            width: 220px;
            background: #111;
            color: white;
            padding: 20px;
            flex-shrink: 0;
          }

          .gufo-logo {
            margin: 0 0 20px 0;
            font-size: 32px;
            line-height: 1.1;
          }

          .gufo-nav {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .gufo-link {
            color: white;
            text-decoration: none;
            display: block;
            font-size: 18px;
            line-height: 1.4;
            word-break: break-word;
          }

          .gufo-main {
            flex: 1;
            min-width: 0;
            background: #0b1220;
            padding: 20px;
          }

          @media (max-width: 768px) {
            .gufo-layout {
              flex-direction: column;
            }

            .gufo-sidebar {
              width: 100%;
              padding: 20px 16px;
            }

            .gufo-logo {
              font-size: 28px;
              margin-bottom: 16px;
            }

            .gufo-nav {
              gap: 8px;
            }

            .gufo-link {
              font-size: 16px;
            }

            .gufo-main {
              width: 100%;
              padding: 16px;
            }
          }
        `}</style>

        <div className="gufo-layout">
          <aside className="gufo-sidebar">
            <h2 className="gufo-logo">GUFO</h2>

            <nav className="gufo-nav">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="gufo-link"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>

          <main className="gufo-main">{children}</main>
        </div>
      </body>
    </html>
  );
}