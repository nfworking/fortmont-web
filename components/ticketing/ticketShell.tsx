"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/ticketing/app-sidebar";
import { SiteHeader } from "@/components/ticketing/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type TicketProps = {
  className?: string;
  children: ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null;
};

const DASHBOARD_TITLES: Array<{ path: string; title: string }> = [
  { path: "/dashboard/server-settings", title: "Server settings" },
  { path: "/dashboard/server-registry", title: "Server Registry" },
  { path: "/dashboard/lxc-registry", title: "LXC Registry" },
  { path: "/dashboard/certs", title: "SSL Certificates" },
  { path: "/dashboard/dns", title: "DNS Records" },
  { path: "/dashboard/users", title: "Site Users" },
  { path: "/dashboard/proxy", title: "Proxy" },
  { path: "/dashboard", title: "Dashboard" },
];

function getDashboardTitle(pathname: string) {
  const match = DASHBOARD_TITLES.find(
    ({ path }) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return match?.title ?? "Dashboard";
}

export function TicketShell({ className, children, user }: TicketProps) {
  const pathname = usePathname();
  const title = getDashboardTitle(pathname);

  return (
    <SidebarProvider
      className={cn(className, "bg-transparent")}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user ?? null} className="bg-transparent" />
      <SidebarInset className="bg-transparent">
        <SiteHeader title={title} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
