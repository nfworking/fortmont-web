"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationPanel } from "@/components/notificationUi"
import { CommandDemo } from "@/components/dashboard_res/command"
import { DashboardNavbar } from "@fortmont/fortmont-ui"

type SiteHeaderProps = {
  title?: string
}

export function SiteHeader({ title = "LXC and registry information" }: SiteHeaderProps) {
  return (
    <DashboardNavbar
      title={title}
      centerContent={<CommandDemo />}
      actions={
        <>
          <ThemeToggle />
          <NotificationPanel />
        </>
      }
    />
  )
}
