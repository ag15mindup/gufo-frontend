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
        <LayoutShell>{children}</LayoutShell>

        <style>{`
          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            min-height: 100%;
          }

          /* ROOT LAYOUT */
          .layout-root {
            position: relative;
            min-height: 100vh;
          }

          /* SFONDO BASE (viene arricchito da globals.css) */
          .gufo-body {
            background:
              radial-gradient(circle at 12% 16%, rgba(236, 72, 153, 0.08), transparent 18%),
              radial-gradient(circle at 82% 12%, rgba(56, 189, 248, 0.08), transparent 18%),
              radial-gradient(circle at 18% 84%, rgba(34, 197, 94, 0.06), transparent 18%),
              radial-gradient(circle at 82% 84%, rgba(250, 204, 21, 0.06), transparent 18%),
              linear-gradient(180deg, #081120 0%, #0b1424 48%, #081120 100%);
            color: white;
            font-family: Arial, Helvetica, sans-serif;
          }

          /* SHELL */
          .app-shell {
            min-height: 100vh;
            transition: padding-left 0.25s ease;
          }

          .app-shell.with-sidebar {
            padding-left: 280px;
          }

          .app-shell.no-sidebar {
            padding-left: 0;
          }

          /* MAIN */
          .app-main {
            min-height: 100vh;
            padding: 24px;
          }

          .app-main.public-page {
            padding: 0;
          }

          .app-main.private-page {
            position: relative;
          }

          /* FRAME PAGINE INTERNE */
          .gufo-page-frame {
            position: relative;
            min-height: calc(100vh - 48px);
          }

          /* RESPONSIVE */
          @media (max-width: 1024px) {
            .app-shell.with-sidebar,
            .app-shell.no-sidebar {
              padding-left: 0;
            }

            .app-main {
              padding: 78px 16px 20px;
            }

            .app-main.public-page {
              padding: 0;
            }
          }

          @media (max-width: 480px) {
            .app-main {
              padding: 74px 14px 18px;
            }

            .app-main.public-page {
              padding: 0;
            }
          }
        `}</style>
      </body>
    </html>
  );
}