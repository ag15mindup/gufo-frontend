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
        
        {/* Sidebar */}
        <Sidebar />

        {/* Contenuto principale */}
        <div
          style={{
            padding: "20px",
            paddingLeft: "70px", // spazio per bottone sidebar
          }}
        >
          {children}
        </div>

      </body>
    </html>
  );
}