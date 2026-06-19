"use client"

import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "./nav-user"
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
import { CloudIcon, CommandIcon, DatabaseIcon, GitFork, GlobeLock, LayoutDashboardIcon, MailIcon, NetworkIcon, ServerIcon, UsersIcon } from "lucide-react"

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
      icon: (
        <LayoutDashboardIcon
        />
      ),
    },
    {
      title: "Server Settings",
      url: "/dashboard/server-settings",
      icon: (
        <ServerIcon
        />
      ),
    },
    
    {
      title: "Site Users",
      url: "/dashboard/users",
      icon: (
        <UsersIcon
        />
      ),
     },
     {
      title: "DNS Records",
      url: "/dashboard/dns",
      icon: (
        <GlobeLock
        />
      ),
     },
     {
      title: "Proxy",
      url: "/dashboard/proxy",
      icon: (
        <NetworkIcon
        />
      ),
     },
     {
      title: "SSL Certificates",
      url: "/dashboard/certs",
      icon: (
        <GlobeLock />
      )
    },
       {
      title: "Azure",
      url: "/dashboard/entra",
      icon: (
        <CloudIcon /> 
      )
     },
     {
      title: "My Github",
      url: "/dashboard/mygithub",
      icon: (
        <GitFork />
      )
     },

    {
      title: "Webmail",
      url: "/mail",
      icon: (
        <MailIcon />
      ),
     },

     {
      title: "Apps",
      url: "/apps",
      icon: (
        <CommandIcon />
      ),
     }
  
    ],
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
  } | null
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar  collapsible="offcanvas" {...props} className="h-full">
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
