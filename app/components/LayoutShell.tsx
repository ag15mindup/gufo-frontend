"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export default function LayoutShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_ROUTES.includes(pathname);

  return (
    <div className="layout-root">
      {!isPublicPage && <Sidebar />}

      <div className={`app-shell ${isPublicPage ? "no-sidebar" : "with-sidebar"}`}>
        <main className={`app-main ${isPublicPage ? "public-page" : "private-page"}`}>
          {isPublicPage ? (
            children
          ) : (
            <div className="gufo-page-frame">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}