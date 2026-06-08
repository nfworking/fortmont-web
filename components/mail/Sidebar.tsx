"use client"

import * as React from "react"
import { FolderType } from "./mail"
import { getInitials } from "./formatters"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Archive,
  ChevronDown,
  Clock,
  File,
  Inbox,
  LogOut,
  MessageCircle,
  Send,
  ShoppingCart,
  Megaphone,
  Star,
  Trash2,
  Users,
} from "lucide-react"

interface SidebarProps {
  userName: string
  activeFolder: FolderType
  unreadCount: number
  onFolderChange: (folder: FolderType) => void
}

export function Sidebar({ userName, activeFolder, unreadCount, onFolderChange }: SidebarProps) {
  const userInitials = getInitials(userName)

  const FOLDER_NAV: { label: string; folder: FolderType; icon: React.ReactNode }[] = [
    { label: "Inbox",   folder: "inbox",   icon: <Inbox   className="size-4" /> },
    { label: "Drafts",  folder: "drafts",  icon: <File    className="size-4" /> },
    { label: "Sent",    folder: "sent",    icon: <Send    className="size-4" /> },
    { label: "Starred", folder: "starred", icon: <Star    className="size-4" /> },
    { label: "Archive", folder: "archive", icon: <Archive className="size-4" /> },
    { label: "Trash",   folder: "trash",   icon: <Trash2  className="size-4" /> },
  ]

  const CATEGORY_NAV = [
    { label: "Social",     icon: <Users         className="size-4" />, count: 972  },
    { label: "Updates",    icon: <Clock         className="size-4" />, count: 342  },
    { label: "Forums",     icon: <MessageCircle className="size-4" />, count: 128 },
    { label: "Shopping",   icon: <ShoppingCart  className="size-4" />, count: 8   },
    { label: "Promotions", icon: <Megaphone     className="size-4" />, count: 21  },
  ]

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-muted/20 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border/60">
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold border border-primary/20">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <span className="flex-1 text-xs font-semibold text-foreground truncate">
          {userName}
        </span>
        <ChevronDown className="size-3 text-muted-foreground/60" />
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {FOLDER_NAV.map(({ label, folder, icon }) => {
          const isActive = activeFolder === folder
          return (
            <button
              key={folder}
              onClick={() => onFolderChange(folder)}
              className={cn(
                "flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <span className={cn(isActive ? "text-foreground" : "text-muted-foreground/80")}>
                {icon}
              </span>
              <span className="flex-1 text-left">{label}</span>
              {folder === "inbox" && unreadCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px] bg-primary/10 text-primary border-none font-semibold">
                  {unreadCount}
                </Badge>
              )}
            </button>
          )
        })}

        <div className="px-3 pt-4 pb-1.5 text-[9px] font-bold tracking-wider text-muted-foreground/60 uppercase">
          Categories
        </div>

        {CATEGORY_NAV.map(({ label, icon, count }) => (
          <button
            key={label}
            className="flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="text-muted-foreground/80">{icon}</span>
            <span className="flex-1 text-left">{label}</span>
            <span className="text-[10px] text-muted-foreground/50 font-mono pr-0.5">{count}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border/60">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}