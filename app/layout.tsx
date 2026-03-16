import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GUFO Dashboard",
  description: "GUFO Web App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = "1f49b570-08ea-4151-9999-825fa0c77d6e";

  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          
          {/* Sidebar */}
          <aside
            style={{
              width: "220px",
              background: "#111",
              color: "white",
              padding: "20px",
              flexShrink: 0,
            }}
          >
            <h2 style={{ marginTop: 0 }}>GUFO</h2>

            <Link
              href="/dashboard"
              style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}
            >
              Dashboard
            </Link>

            <Link
              href="/wallet"
              style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}
            >
              Wallet
            </Link>

            <Link
              href="/transactions"
              style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}
            >
              Transactions
            </Link>

            <Link
              href="/membership"
              style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}
            >
              Membership
            </Link>

            <Link
              href="/profile"
              style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}
            >
              Profilo
            </Link>

            <Link
              href="/customer-code"
              style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}
            >
              Codice GUFO
            </Link>

            <Link
              href="/partner-demo"
              style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}
            >
              Partner Demo
            </Link>

            <Link
              href="/partner-dashboard"
              style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}
            >
              Partner Dashboard
            </Link>
          </aside>

          {/* Contenuto principale */}
          <main
            style={{
              flex: 1,
              background: "#0b1220",
              padding: "30px",
            }}
          >
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}