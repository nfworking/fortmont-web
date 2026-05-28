import type { CSSProperties } from "react";
import { auth } from "@/lib/auth";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <UsersTable />
      </SidebarInset>
    </SidebarProvider>
  );
}