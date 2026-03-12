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
  return (
    <html lang="en">
      <body>

        <div style={{ display: "flex", minHeight: "100vh" }}>

          {/* Sidebar */}
          <div
            style={{
              width: "220px",
              background: "#111",
              color: "white",
              padding: "20px",
            }}
          >
            <h2>GUFO</h2>
<Link
  href="/dashboard/1f49b570-08ea-4151-9999-825fa0c77d6e"
  style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}
>
  Dashboard
</Link>
           <Link href="/wallet" style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}>
  Wallet
</Link>

<Link href="/rewards" style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}>
  Rewards
</Link>

<Link href="/membership" style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}>
  Membership
</Link>

<Link href="/profile" style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}>
  Profilo
</Link>
<Link href="/partner-demo" style={{ color: "white", display: "block", marginTop: "10px", textDecoration: "none" }}>
  Partner Demo
</Link>
          </div>

          {/* Contenuto */}
          <div style={{ flex: 1, padding: "30px" }}>
            {children}
          </div>

        </div>

      </body>
    </html>
  );
}