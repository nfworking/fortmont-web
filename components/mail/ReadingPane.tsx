"use client"

import * as React from "react"
import { Email } from "./mail"
import { extractEmail, formatFullDate, getInitials } from "./formatters"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  AlertTriangle,
  Archive,
  Clock,
  CornerUpLeft,
  CornerUpRight,
  Loader2,
  Mail,
  MoreVertical,
  Trash2,
} from "lucide-react"

interface ReadingPaneProps {
  selectedEmail: Email | null
  selectedName: string
  selectedContact: string
  replyBody: string
  sending: boolean
  sendError: string | null
  sendSuccess: boolean
  muteThread: boolean
  replyRef: React.RefObject<HTMLTextAreaElement | null>
  setReplyBody: (val: string) => void
  setMuteThread: (val: boolean) => void
  handleSendReply: (e: React.FormEvent) => void
  openForwardCompose: (email: Email) => void
}

export function ReadingPane({
  selectedEmail,
  selectedName,
  selectedContact,
  replyBody,
  sending,
  sendError,
  sendSuccess,
  muteThread,
  replyRef,
  setReplyBody,
  setMuteThread,
  handleSendReply,
  openForwardCompose,
}: ReadingPaneProps) {
  return (
    <main className="flex-1 bg-transparent flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/60 bg-muted/10 flex-shrink-0 h-12">
        <Button variant="ghost" size="icon" title="Archive" className="size-8 cursor-pointer">
          <Archive className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
        <Button variant="ghost" size="icon" title="Junk" className="size-8 cursor-pointer">
          <AlertTriangle className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
        <Button variant="ghost" size="icon" title="Delete" className="size-8 cursor-pointer">
          <Trash2 className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
        
        <div className="flex-1" />
        
        <Button variant="ghost" size="icon" title="Snooze" className="size-8 cursor-pointer">
          <Clock className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
        
        {selectedEmail && (
          <>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <Button variant="ghost" size="icon" title="Reply" onClick={() => replyRef.current?.focus()} className="size-8 cursor-pointer">
              <CornerUpLeft className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
            <Button variant="ghost" size="icon" title="Reply all" onClick={() => replyRef.current?.focus()} className="size-8 cursor-pointer">
              <CornerUpLeft className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
            <Button variant="ghost" size="icon" title="Forward" onClick={() => openForwardCompose(selectedEmail)} className="size-8 cursor-pointer">
              <CornerUpRight className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          </>
        )}
        
        <Separator orientation="vertical" className="mx-1 h-4" />
        
        <Button variant="ghost" size="icon" title="More" className="size-8 cursor-pointer">
          <MoreVertical className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
        </Button>
      </div>

      {selectedEmail ? (
        <>
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-4">
              <div className="flex items-start gap-3 min-w-0">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                    {getInitials(selectedName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate leading-tight">
                    {selectedName}
                  </h3>
                  <p className="text-xs text-foreground/80 font-medium truncate mt-0.5">
                    {selectedEmail.subject || "(no subject)"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    Reply-To: <span className="font-mono">{extractEmail(selectedContact)}</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground/80 whitespace-nowrap pt-0.5">
                {formatFullDate(selectedEmail.date)}
              </span>
            </div>

            <div className="flex-1 text-sm text-foreground/90 leading-relaxed font-sans min-h-[200px]">
              {selectedEmail.body.html && typeof selectedEmail.body.html === "string" ? (
                <div 
                  className="bg-card text-card-foreground p-6 rounded-lg border border-border/50 shadow-sm max-w-none break-words email-body-html" 
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body.html }} 
                />
              ) : (
                <div className="bg-card text-card-foreground p-6 rounded-lg border border-border/50 shadow-sm">
                  <pre className="white-space-pre-wrap font-sans text-xs leading-relaxed break-words text-foreground/95">
                    {selectedEmail.body.text || "No content"}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border/60 bg-muted/10 flex-shrink-0">
            <form onSubmit={handleSendReply}>
              <div className="bg-card border border-border/60 rounded-xl p-3 flex flex-col gap-3 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 transition-all">
                <Textarea
                  ref={replyRef}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={`Reply ${selectedName}…`}
                  disabled={sending}
                  rows={3}
                  className="min-h-16 max-h-48 text-xs bg-transparent border-none focus-visible:ring-0 p-0 resize-none shadow-none focus-visible:border-none focus-visible:outline-none"
                />

                {sendError && (
                  <div className="text-[11px] text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2 flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>{sendError}</span>
                  </div>
                )}
                {sendSuccess && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md p-2">
                    Message sent.
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="mute-thread"
                      checked={muteThread}
                      onCheckedChange={setMuteThread}
                      size="sm"
                    />
                    <label htmlFor="mute-thread" className="text-xs text-muted-foreground/80 cursor-pointer select-none font-medium">
                      Mute this thread
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={sending || !replyBody.trim()}
                    size="sm"
                    className="h-8 px-4 font-medium cursor-pointer"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="size-3 animate-spin mr-1.5" />
                        Sending…
                      </>
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 gap-2.5">
          <Mail className="size-8 text-muted-foreground/30" />
          <div className="text-xs font-medium text-muted-foreground/70">Select an email to read</div>
        </div>
      )}
      <style>{`
        .email-body-html img {
          max-width: 100%;
          height: auto;
        }
        .email-body-html a {
          color: var(--primary);
          text-decoration: underline;
        }
      `}</style>
    </main>
  )
}