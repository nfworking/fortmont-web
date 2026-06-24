"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HardDrive, LayoutDashboard, Files } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
 
  { title: "My Storage", url: "/dashboard/account/storage", icon: LayoutDashboard },
{ title: "Files", url: "/my-storage", icon: Files },
];

interface SidebarAccount {
  username: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

interface AppSidebarProps {
  account: SidebarAccount | null;
}

export function AppSidebar({ account }: AppSidebarProps) {
  const pathname = usePathname();

  const name = account?.displayName || account?.username || "Guest";
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <HardDrive className="h-4 w-4" strokeWidth={2} />
          </div>
          <span className="font-display text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Vault
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Storage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" strokeWidth={1.75} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <Avatar className="h-8 w-8 shrink-0 rounded-md">
            {account?.avatarUrl ? (
              <AvatarImage src={account.avatarUrl} alt={name} />
            ) : null}
            <AvatarFallback className="rounded-md bg-secondary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium leading-tight">{name}</p>
            {account?.email ? (
              <p className="truncate text-xs text-muted-foreground">
                {account.email}
              </p>
            ) : null}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}