"use client"

import * as React from "react"
import { Button } from "./ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { EllipsisVerticalIcon, CircleUserRoundIcon, CreditCardIcon, BellIcon, LogOutIcon } from "lucide-react"
import { signOut } from "next-auth/react";
import { hr } from "zod/v4/locales"

type Props = {
  user?: {
    name?: string | null
    email?: string | null
    avatar?: string | null
  }
}

export function NavUser({ user }: Props) {
  const { isMobile } = useSidebar()
  const effectiveUser = user ?? { name: "", email: "", avatar: "" }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={effectiveUser.avatar ?? undefined} alt={effectiveUser.name ?? ""} />
                <AvatarFallback className="rounded-lg">User</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{effectiveUser.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {effectiveUser.email}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={effectiveUser.avatar ?? undefined} alt={effectiveUser.name ?? ""} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{effectiveUser.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {effectiveUser.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <CircleUserRoundIcon />
                <a href="/profile" className=""/>
                Profile
              </DropdownMenuItem>
              
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Button
                onClick={() => signOut()}
                variant="outline"
                className="w-full"
              >
                Logout
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem>

                <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = "/dashboard/users"}
              >
                Access Site Users
              </Button>
              </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// named export only
// named export only
