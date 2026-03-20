import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

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
      <body style={{ margin: 0, background: "#020617", color: "white" }}>
        <Sidebar />
        <div
          style={{
            padding: "20px",
            paddingLeft: "70px",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}