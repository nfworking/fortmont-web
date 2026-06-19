"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { 
  CloudIcon, 
  CommandIcon, 
  GitFork, 
  GlobeLock, 
  LayoutDashboardIcon, 
  MailIcon, 
  NetworkIcon, 
  ServerIcon, 
  UsersIcon,
  AlertTriangle 
} from "lucide-react"

// Import your Dialog UI components here (assuming standard shadcn/ui setup)
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Server Settings",
      url: "/dashboard/server-settings",
      icon: <ServerIcon />,
    },
    {
      title: "Site Users",
      url: "/dashboard/users",
      icon: <UsersIcon />,
    },
    {
      title: "DNS Records",
      url: "/dashboard/dns",
      icon: <GlobeLock />,
    },
    {
      title: "Proxy",
      url: "/dashboard/proxy",
      icon: <NetworkIcon />,
    },
    {
      title: "SSL Certificates",
      url: "/dashboard/certs",
      icon: <GlobeLock />,
    },
    {
      title: "Azure",
      url: "/dashboard/entra",
      icon: <CloudIcon />,
    },
    {
      title: "My Github",
      url: "/dashboard/mygithub",
      icon: <GitFork />,
      requiresGithub: true, // Tagging this route to intercept it
    },
    {
      title: "Webmail",
      url: "/mail",
      icon: <MailIcon />,
    },
    {
      title: "Apps",
      url: "/apps",
      icon: <CommandIcon />,
    },
  ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
    isGithubLinked?: boolean | null
  } | null
  isGithubLinked?: boolean // Added prop to verify GitHub link status
}

export function AppSidebar({ user, isGithubLinked = false, ...props }: AppSidebarProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  // Intercept the nav items rendering
  const modifiedNavMain = data.navMain.map((item) => {
    const hasGithub = isGithubLinked || (user as any)?.isGithubLinked || (user as any)?.githubLinked;

  
    if (item.requiresGithub && !hasGithub) {
    return {
      ...item,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDialogOpen(true)
      },
    }
  }
  return item
})

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props} className="h-full">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild size="lg" className="data-[slot=sidebar-menu-button]:p-1.5!">
                <Link href="/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-primary">
                    <CommandIcon className="size-5 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="text-sm font-semibold">Fortmont API</span>
                    <span className="text-xs text-muted-foreground">Admin dashboard</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {/* Pass the modified navigation array down to NavMain */}
          <NavMain items={modifiedNavMain} />
        </SidebarContent>
        <SidebarFooter />
        <SidebarRail />
      </Sidebar>

      {/* Intercept Alert Dialog Box */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">GitHub Account Required</DialogTitle>
            <DialogDescription>
              You cannot access the GitHub dashboard settings until you link your GitHub account to your profile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button asChild onClick={() => setIsDialogOpen(false)}>
              <Link href="/dashboard/settings/accounts">
                Link Account Now
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}