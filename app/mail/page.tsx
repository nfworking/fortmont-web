"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Archive,
  ArchiveX,
  ArrowLeft,
  File,
  Inbox,
  LogOut,
  Mail,
  Reply,
  ReplyAll,
  Forward,
  Search,
  Send,
  Star,
  Trash2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { signOut } from "next-auth/react";


// Types matching your API response
interface EmailBody {
  text: string
  html: string | false
}

interface Email {
  uid: number
  subject: string
  from?: string
  to?: string
  date: string
  flags: Record<string, boolean>
  body: EmailBody
}

interface MailboxResponse {
  mailbox: string
  folder?: string
  count: number
  emails: Email[]
}

type FolderType = "inbox" | "sent" | "drafts" | "starred" | "archive" | "trash"

const navItems: { title: string; icon: typeof Inbox; folder: FolderType }[] = [
  { title: "Inbox", icon: Inbox, folder: "inbox" },
  { title: "Drafts", icon: File, folder: "drafts" },
  { title: "Sent", icon: Send, folder: "sent" },
  { title: "Starred", icon: Star, folder: "starred" },
  { title: "Archive", icon: Archive, folder: "archive" },
  { title: "Trash", icon: Trash2, folder: "trash" },
]

const labels = [
  { title: "Work", color: "bg-blue-500" },
  { title: "Personal", color: "bg-green-500" },
  { title: "Shopping", color: "bg-orange-500" },
  { title: "Social", color: "bg-purple-500" },
]

interface UserSession {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

function getEmailContact(email: Email, folder: FolderType): string {
  if (folder === "sent") {
    return email.to || ""
  }
  return email.from || ""
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  } else if (days === 1) {
    return "Yesterday"
  } else if (days < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" })
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}

function formatFullDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function extractName(from: string) {
  const match = from.match(/^([^<@]+)/)
  if (match) {
    const name = match[1].trim().replace(/"/g, "")
    return name || from.split("@")[0]
  }
  return from.split("@")[0]
}

function extractEmail(from: string) {
  const match = from.match(/<([^>]+)>/)
  return match ? match[1] : from
}

function getInitials(name: string) {
  return name
    .split(/[\s@]/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getEmailSnippet(body: EmailBody): string {
  const text = body.text || ""
  return text.trim().slice(0, 80) + (text.length > 80 ? "..." : "")
}

export default function MailClient() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [mailbox, setMailbox] = useState<MailboxResponse | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeFolder, setActiveFolder] = useState<FolderType>("inbox")
  const [loading, setLoading] = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" })
        const data = await res.json()
        setSession(data)
        if (data?.user) {
          fetchEmails("inbox")
        }
      } catch (error) {
        console.error("Failed to fetch session:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [])

  async function fetchEmails(folder: FolderType) {
    setEmailsLoading(true)
    setSelectedEmail(null)
    try {
      // Different API endpoints for different folders
      const endpoint = folder === "sent" ? "/api/mailbox/send/get" : "/api/mailbox/inbox"
      const res = await fetch(endpoint, { credentials: "include" })
      if (res.ok) {
        const data: MailboxResponse = await res.json()
        setMailbox(data)
      }
    } catch (error) {
      console.error("Failed to fetch emails:", error)
    } finally {
      setEmailsLoading(false)
    }
  }

  function handleFolderChange(folder: FolderType) {
    if (folder !== activeFolder) {
      setActiveFolder(folder)
      fetchEmails(folder)
    }
  }

  const emails = mailbox?.emails || []
  const filteredEmails = emails.filter(
    (email) => {
      const contact = getEmailContact(email, activeFolder)
      return (
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.body.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
  )

  const unreadCount = emails.filter((e) => !e.flags?.seen).length

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Mail className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Mail Client</h1>
          <p className="text-muted-foreground">Sign in to access your emails</p>
          <Button size="lg" onClick={() => (window.location.href = "/api/auth/signin")}>
            Sign In
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Mail className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Mail</span>
                    <span className="truncate text-xs text-muted-foreground">{mailbox?.mailbox || session.user.email}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Folders</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item, index) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={activeFolder === item.folder}
                        tooltip={item.title}
                        onClick={() => handleFolderChange(item.folder)}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {item.folder === "inbox" && unreadCount > 0 && <SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Labels</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {labels.map((label) => (
                    <SidebarMenuItem key={label.title}>
                      <SidebarMenuButton tooltip={label.title}>
                        <span className={`size-2 rounded-full ${label.color}`} />
                        <span>{label.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                      <Avatar className="size-8">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                        <AvatarFallback>{getInitials(session.user.name || session.user.email || "U")}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{session.user.name || extractName(session.user.email || "")}</span>
                        <span className="truncate text-xs text-muted-foreground">{session.user.email}</span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" side="top" align="start">
                    <DropdownMenuLabel><button onClick={() => (window.location.href = "/dashboard/account")}>
         
                      My Account
                      </button></DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* FIX AUTH TO ACUTALLY SIGN OUT */}
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="mr-2 size-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search emails..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {mailbox && `${filteredEmails.length} of ${mailbox.count}`}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => fetchEmails(activeFolder)} disabled={emailsLoading}>
                    <RefreshCw className={`size-4 ${emailsLoading ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </div>
          </header>
          <div className="flex flex-1 overflow-hidden">
            {/* Email List - Fixed width, always visible */}
            <motion.div
              className="w-[350px] flex-shrink-0 border-r bg-muted/30"
              initial={false}
              animate={{ width: selectedEmail ? 350 : 400 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ScrollArea className="h-[calc(100vh-3.5rem)]">
                {emailsLoading && emails.length === 0 ? (
                  <div className="space-y-1 p-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="rounded-lg p-3">
                        <div className="flex gap-3">
                          <Skeleton className="size-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-8 text-center"
                  >
                    <Inbox className="mb-4 size-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No emails match your search" : "No emails found"}
                    </p>
                  </motion.div>
                ) : (
                  <div className="p-2">
                    <AnimatePresence>
                      {filteredEmails.map((email, index) => {
                        const isRead = email.flags?.seen || activeFolder === "sent"
                        const isSelected = selectedEmail?.uid === email.uid
                        const contact = getEmailContact(email, activeFolder)
                        return (
                          <motion.button
                            key={email.uid}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.2 }}
                            onClick={() => setSelectedEmail(email)}
                            className={`mb-1 w-full rounded-lg p-3 text-left transition-all duration-200 ${
                              isSelected
                                ? "bg-primary/10 ring-1 ring-primary/20"
                                : "hover:bg-muted"
                            } ${!isRead && !isSelected ? "bg-background" : ""}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative">
                                <Avatar className="size-10">
                                  <AvatarFallback
                                    className={
                                      !isRead
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                    }
                                  >
                                    {getInitials(extractName(contact))}
                                  </AvatarFallback>
                                </Avatar>
                                {!isRead && (
                                  <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`truncate text-sm ${
                                      !isRead ? "font-semibold text-foreground" : "text-foreground"
                                    }`}
                                  >
                                    {activeFolder === "sent" ? "To: " : ""}{extractName(contact)}
                                  </span>
                                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                                    {formatDate(email.date)}
                                  </span>
                                </div>
                                <p
                                  className={`truncate text-sm ${
                                    !isRead ? "font-medium text-foreground" : "text-muted-foreground"
                                  }`}
                                >
                                  {email.subject || "(no subject)"}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                  {getEmailSnippet(email.body)}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </motion.div>

            {/* Email Content - Reading Pane */}
            <div className="flex-1 overflow-hidden bg-background">
              <AnimatePresence mode="wait">
                {selectedEmail ? (
                  <motion.div
                    key={selectedEmail.uid}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="h-full"
                  >
                    <ScrollArea className="h-[calc(100vh-3.5rem)]">
                      <div className="mx-auto max-w-4xl p-6">
                        {/* Email Header */}
                        <div className="mb-6">
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={() => setSelectedEmail(null)}
                                  >
                                    <ArrowLeft className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to list</TooltipContent>
                              </Tooltip>
                              <h1 className="text-xl font-semibold leading-tight">
                                {selectedEmail.subject || "(no subject)"}
                              </h1>
                            </div>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Star className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Star</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <ArchiveX className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Archive</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                                  <DropdownMenuItem>Mark as spam</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>Print</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Sender/Recipient Info */}
                          <div className="flex items-start gap-4 rounded-lg bg-muted/50 p-4">
                            <Avatar className="size-12">
                              <AvatarFallback className="text-lg">
                                {getInitials(extractName(getEmailContact(selectedEmail, activeFolder)))}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {activeFolder === "sent" ? "To:" : "From:"}
                                </span>
                                <span className="font-semibold">
                                  {extractName(getEmailContact(selectedEmail, activeFolder))}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {extractEmail(getEmailContact(selectedEmail, activeFolder))}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatFullDate(selectedEmail.date)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Reply className="mr-2 size-4" />
                                    Reply
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reply to sender</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <ReplyAll className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reply all</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Forward className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Forward</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Email Body */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.2 }}
                          className="prose prose-sm max-w-none dark:prose-invert"
                        >
                          {selectedEmail.body.html &&
                          typeof selectedEmail.body.html === "string" ? (
                            <div
                              dangerouslySetInnerHTML={{ __html: selectedEmail.body.html }}
                              className="[&_a]:text-primary [&_a]:underline"
                            />
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                              {selectedEmail.body.text || "No content"}
                            </p>
                          )}
                        </motion.div>
                      </div>
                    </ScrollArea>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col items-center justify-center text-center"
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <Mail className="size-10 text-muted-foreground" />
                      </div>
                    </motion.div>
                    <h2 className="text-xl font-semibold">Select an email</h2>
                    <p className="mt-1 text-muted-foreground">
                      Choose an email from the list to read it
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
