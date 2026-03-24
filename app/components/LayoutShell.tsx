"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebar = PUBLIC_ROUTES.includes(pathname);

  return (
    <div className="layout-root">
      {!hideSidebar && <Sidebar />}

      <div
        className={`app-shell ${hideSidebar ? "no-sidebar" : "with-sidebar"}`}
      >
        <main
          className={`app-main ${hideSidebar ? "public-page" : "private-page"}`}
        >
          {!hideSidebar ? (
            <div className="gufo-page-frame">{children}</div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}