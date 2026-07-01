import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { ThemeToggle } from "@/components/theme-toggle"
import {NotificationPanel} from "@/components/notificationUi"
import { NavUser } from "@/components/nav-user"
import { CommandDemo } from "@/components/dashboard_res/command"

type SiteHeaderProps = {
  title?: string
}

export function SiteHeader({ title = "LXC and registry information" }: SiteHeaderProps) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="flex w-full items-center gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <h1 className="truncate text-base font-medium text-foreground">{title}</h1>
        </div>

        <div className="flex flex-1 justify-center">
          <CommandDemo />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationPanel />
          <NavUser />
        </div>
      </div>
    </header>
  )
}
