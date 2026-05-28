import type { CSSProperties } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { DashboardStatusPanel } from "@/components/dashboard-status-panel";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <DashboardStatusPanel />
      </SidebarInset>
    </SidebarProvider>
  )
}
