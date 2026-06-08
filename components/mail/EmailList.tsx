"use client"

import * as React from "react"
import { Email, FolderType } from "./mail"
import { getEmailContact, extractName, formatDate, getEmailSnippet } from "./formatters"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Inbox, Loader2 } from "lucide-react"

interface EmailListProps {
  activeFolder: FolderType
  emailsLoading: boolean
  filteredEmails: Email[]
  selectedEmail: Email | null
  searchQuery: string
  activeTab: "all" | "unread"
  setActiveTab: (tab: "all" | "unread") => void
  setSearchQuery: (query: string) => void
  setSelectedEmail: (email: Email) => void
}

export function EmailList({
  activeFolder,
  emailsLoading,
  filteredEmails,
  selectedEmail,
  searchQuery,
  activeTab,
  setActiveTab,
  setSearchQuery,
  setSelectedEmail,
}: EmailListProps) {
  return (
    <section className="w-80 flex-shrink-0 border-r border-border bg-background flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border/60 flex-shrink-0 flex flex-col gap-3">
        <h2 className="text-base font-bold text-foreground capitalize leading-none tracking-tight">
          {activeFolder}
        </h2>
        
        <div className="flex gap-1">
          {(["all", "unread"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer border",
                activeTab === tab
                  ? "bg-secondary text-secondary-foreground border-border"
                  : "bg-transparent text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {tab === "all" ? "All mail" : "Unread"}
            </button>
          ))}
        </div>

        <div className="relative flex items-center">
          <svg className="absolute left-2.5 size-3.5 text-muted-foreground/60" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <Input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/20 hover:bg-muted/40 border-border/60 focus-visible:bg-background focus-visible:ring-2"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {emailsLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground/80 gap-2">
            <Inbox className="size-6 text-muted-foreground/50" />
            <span className="text-xs">{searchQuery ? "No results found" : "No emails in this folder"}</span>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isRead     = email.flags?.seen || activeFolder === "sent"
            const isSelected = selectedEmail?.uid === email.uid
            const contact    = getEmailContact(email, activeFolder)
            const name       = extractName(contact)

            const tagWords = [email.subject, email.body.text].join(" ").toLowerCase()
            const tags: string[] = []
            if (tagWords.includes("meeting"))  tags.push("meeting")
            if (tagWords.includes("budget"))   tags.push("budget")
            if (/work|project|update|report|team|announce/i.test(tagWords)) tags.push("work")
            if (/personal|weekend|plan|hike/i.test(tagWords)) tags.push("personal")
            if (/important|urgent|crucial/i.test(tagWords))   tags.push("important")

            return (
              <button
                key={email.uid}
                onClick={() => setSelectedEmail(email)}
                className={cn(
                  "w-full text-left p-4 transition-colors flex flex-col gap-1.5 cursor-pointer relative",
                  isSelected
                    ? "bg-secondary/70 text-secondary-foreground"
                    : "hover:bg-muted/40 text-foreground bg-transparent"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {!isRead && <span className="size-2 rounded-full bg-blue-500 shrink-0" />}
                    <span className={cn(
                      "text-xs truncate",
                      isRead ? "font-normal text-foreground/80" : "font-semibold text-foreground"
                    )}>
                      {activeFolder === "sent" ? `To: ${name}` : name}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/80 whitespace-nowrap shrink-0">
                    {formatDate(email.date)}
                  </span>
                </div>
                
                <h4 className={cn(
                  "text-xs truncate leading-none",
                  isRead ? "font-normal text-muted-foreground" : "font-semibold text-foreground/90"
                )}>
                  {email.subject || "(no subject)"}
                </h4>
                
                <p className="text-[11px] text-muted-foreground/85 line-clamp-2 leading-relaxed">
                  {getEmailSnippet(email.body)}
                </p>
                
                {tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn(
                          "px-1.5 py-0 h-4 text-[9px] rounded font-semibold",
                          tag === "work" && "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/40",
                          tag === "personal" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/40",
                          tag === "important" && "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/40",
                          tag === "budget" && "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400 dark:bg-purple-950/30 dark:border-purple-900/40",
                          tag === "meeting" && "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400 dark:bg-indigo-950/30 dark:border-indigo-900/40",
                          tag === "social" && "bg-pink-500/10 text-pink-600 border-pink-500/20 dark:text-pink-400 dark:bg-pink-950/30 dark:border-pink-900/40"
                        )}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}