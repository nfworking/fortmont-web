// @/components/email-sidebar.tsx
"use client"

import * as React from "react"
import { ArchiveX, File, Inbox, Send, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  categories: [
    { title: "Inbox", icon: Inbox },
    { title: "Drafts", icon: File },
    { title: "Sent", icon: Send },
    { title: "Junk", icon: ArchiveX },
    { title: "Trash", icon: Trash2 },
  ],
  mails: [
    {
      name: "William Smith",
      email: "williamsmith@example.com",
      subject: "Meeting Tomorrow",
      date: "09:34 AM",
      teaser: "Hi team, just a reminder about our meeting tomorrow at 10 AM.\nPlease come prepared with your project updates.",
    },
    {
      name: "Alice Smith",
      email: "alicesmith@example.com",
      subject: "Re: Project Update",
      date: "Yesterday",
      teaser: "Thanks for the update. The progress looks great so far.\nLet's schedule a call to discuss the next steps.",
    },
  ],
}

export function EmailSidebar() {
  const [activeCategory, setActiveCategory] = React.useState(data.categories[0])

  return (
    <Sidebar collapsible="none" className="hidden h-screen w-[280px] flex-col border-r bg-background md:flex">
      <SidebarHeader className="gap-3.5 border-b p-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-base font-medium text-foreground">Email Client</div>
          <Label className="flex items-center gap-2 text-sm">
            <span>Unreads</span>
            <Switch className="shadow-none" />
          </Label>
        </div>
        <SidebarInput placeholder="Type to search..." />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-2 border-b pb-2">
          <SidebarMenu>
            {data.categories.map((category) => (
              <SidebarMenuItem key={category.title}>
                <SidebarMenuButton
                  onClick={() => setActiveCategory(category)}
                  isActive={activeCategory.title === category.title}
                >
                  <category.icon className="size-4" />
                  <span>{category.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="px-0">
          <SidebarGroupContent>
            {data.mails.map((mail) => (
              <a
                href="#"
                key={mail.email}
                className="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <div className="flex w-full items-center gap-2">
                  <span className="font-semibold">{mail.name}</span>{" "}
                  <span className="ml-auto text-xs text-muted-foreground">{mail.date}</span>
                </div>
                <span className="font-medium text-xs">{mail.subject}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground whitespace-break-spaces">
                  {mail.teaser}
                </span>
              </a>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}