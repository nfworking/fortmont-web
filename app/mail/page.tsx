"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import {
  Archive,
  AlertTriangle,
  CornerUpLeft,
  CornerUpRight,
  ChevronDown,
  Clock,
  MoreVertical,
  File,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  Send,
  ShoppingCart,
  Megaphone,
  Star,
  Trash2,
  Users,
} from "lucide-react"
import { signOut } from "next-auth/react"

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface UserSession {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEmailContact(email: Email, folder: FolderType): string {
  return folder === "sent" ? email.to || "" : email.from || ""
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (days === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  if (days === 1) return "Yesterday"
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" })
  if (days < 365) return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatFullDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
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
  return text.trim().slice(0, 100) + (text.length > 100 ? "…" : "")
}

const AVATAR_PALETTES = [
  { bg: "#142230", text: "#6fa3d4" },
  { bg: "#1e1a30", text: "#9f70c4" },
  { bg: "#1a2a1a", text: "#5abf8a" },
  { bg: "#251a10", text: "#c4884a" },
  { bg: "#1a1a30", text: "#7070d4" },
  { bg: "#2a1a1a", text: "#d47070" },
  { bg: "#101e20", text: "#50b4c0" },
  { bg: "#201a10", text: "#c0a050" },
]

function avatarPalette(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

// ─── Tag colour map ───────────────────────────────────────────────────────────

const TAG_STYLES: Record<string, React.CSSProperties> = {
  work:      { borderColor: "#2a3a5a", color: "#6fa3d4", background: "#141c2a" },
  personal:  { borderColor: "#1e3a2a", color: "#5abf8a", background: "#101c14" },
  important: { borderColor: "#3a2a1a", color: "#c4884a", background: "#1e1408" },
  budget:    { borderColor: "#2a1a3a", color: "#9f70c4", background: "#180e20" },
  meeting:   { borderColor: "#2a2a1a", color: "#b4b458", background: "#1c1c08" },
  social:    { borderColor: "#3a1a2a", color: "#c460a0", background: "#20081a" },
  default:   { borderColor: "#333",    color: "#888",    background: "#1e1e1e" },
}

function tagStyle(tag: string): React.CSSProperties {
  return TAG_STYLES[tag.toLowerCase()] ?? TAG_STYLES.default
}

// ─── Sidebar nav config ───────────────────────────────────────────────────────

const FOLDER_NAV: { label: string; folder: FolderType; icon: React.ReactNode; badge?: number }[] = [
  { label: "Inbox",   folder: "inbox",   icon: <Inbox   size={14} /> },
  { label: "Drafts",  folder: "drafts",  icon: <File    size={14} /> },
  { label: "Sent",    folder: "sent",    icon: <Send    size={14} /> },
  { label: "Starred", folder: "starred", icon: <Star    size={14} /> },
  { label: "Archive", folder: "archive", icon: <Archive size={14} /> },
  { label: "Trash",   folder: "trash",   icon: <Trash2  size={14} /> },
]

const CATEGORY_NAV = [
  { label: "Social",     icon: <Users       size={14} />, count: 972  },
  { label: "Updates",    icon: <Clock       size={14} />, count: 342  },
  { label: "Forums",     icon: <MessageCircle size={14} />, count: 128 },
  { label: "Shopping",   icon: <ShoppingCart size={14} />, count: 8   },
  { label: "Promotions", icon: <Megaphone size={14} />, count: 21  },
]

// ─── Styles (inline, no Tailwind dependency for layout) ───────────────────────

const S = {
  root: {
    display: "flex",
    height: "100vh",
    background: "#111",
    color: "#e8e8e8",
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
    fontSize: "13px",
    overflow: "hidden",
  } as React.CSSProperties,

  sidebar: {
    width: "200px",
    flexShrink: 0,
    background: "#161616",
    borderRight: "0.5px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as React.CSSProperties,

  listPanel: {
    width: "310px",
    flexShrink: 0,
    borderRight: "0.5px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as React.CSSProperties,

  readingPane: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "#111",
  } as React.CSSProperties,
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MailClient() {
  const [session,       setSession]       = useState<UserSession | null>(null)
  const [mailbox,       setMailbox]       = useState<MailboxResponse | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeFolder,  setActiveFolder]  = useState<FolderType>("inbox")
  const [loading,       setLoading]       = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [searchQuery,   setSearchQuery]   = useState("")
  const [activeTab,     setActiveTab]     = useState<"all" | "unread">("all")
  const [muteThread,    setMuteThread]    = useState(false)

  // Compose / reply state
  const [replyTo,      setReplyTo]      = useState("")
  const [replySubject, setReplySubject] = useState("")
  const [replyBody,    setReplyBody]    = useState("")
  const [sending,      setSending]      = useState(false)
  const [sendError,    setSendError]    = useState<string | null>(null)
  const [sendSuccess,  setSendSuccess]  = useState(false)

  const replyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res  = await fetch("/api/auth/session", { credentials: "include" })
        const data = await res.json()
        setSession(data)
        if (data?.user) fetchEmails("inbox")
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [])

  // When a new email is selected, pre-fill the reply box
  useEffect(() => {
    if (!selectedEmail) return
    const contact = getEmailContact(selectedEmail, activeFolder)
    setReplyTo(extractEmail(contact))
    setReplySubject(`Re: ${selectedEmail.subject}`)
    setReplyBody("")
    setSendError(null)
    setSendSuccess(false)
    setMuteThread(false)
  }, [selectedEmail, activeFolder])

  async function fetchEmails(folder: FolderType) {
    setEmailsLoading(true)
    setSelectedEmail(null)
    try {
      const endpointMap: Record<FolderType, string> = {
        inbox:   "/api/mailbox/inbox",
        sent:    "/api/mailbox/send/get",
        drafts:  "/api/mailbox/drafts",
        starred: "/api/mailbox/starred",
        archive: "/api/mailbox/archive",
        trash:   "/api/mailbox/trash",
      }
      const res = await fetch(endpointMap[folder], { credentials: "include" })
      if (res.ok) setMailbox(await res.json())
      else setMailbox({ mailbox: "", count: 0, emails: [] })
    } catch (e) {
      console.error(e)
      setMailbox({ mailbox: "", count: 0, emails: [] })
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

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyTo.trim()) { setSendError("No recipient address"); return }
    if (!replyBody.trim()) { setSendError("Message body is empty"); return }
    setSending(true)
    setSendError(null)
    setSendSuccess(false)
    try {
      const res = await fetch("/api/mailbox/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:      replyTo.trim(),
          subject: replySubject.trim(),
          text:    replyBody,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to send")
      }
      setSendSuccess(true)
      setReplyBody("")
      if (activeFolder === "sent") fetchEmails("sent")
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  function openForwardCompose(email: Email) {
    const contact = getEmailContact(email, activeFolder)
    setReplyTo("")
    setReplySubject(`Fwd: ${email.subject}`)
    setReplyBody(`\n\n— Forwarded from ${extractName(contact)} on ${formatFullDate(email.date)} —\n${email.body.text}`)
    replyRef.current?.focus()
  }

  const emails = mailbox?.emails ?? []

  const filteredEmails = emails.filter((email) => {
    const contact = getEmailContact(email, activeFolder)
    const matchesSearch =
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.text.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || !email.flags?.seen
    return matchesSearch && matchesTab
  })

  const unreadCount = emails.filter((e) => !e.flags?.seen).length

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#111", flexDirection: "column", gap: "12px" }}>
        <Mail size={24} color="#555" />
        <p style={{ color: "#555", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading</p>
      </div>
    )
  }

  // ── Sign-in ──────────────────────────────────────────────────────────────────
  if (!session?.user) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#111", flexDirection: "column", gap: "24px" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, border: "0.5px solid #2a2a2a", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mail size={22} color="#888" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#e8e8e8" }}>Mail</h1>
          <p style={{ fontSize: "13px", color: "#555", marginTop: "6px" }}>Sign in to access your mailbox</p>
        </div>
        <button
          onClick={() => (window.location.href = "/api/auth/signin")}
          style={{ padding: "8px 24px", borderRadius: "8px", border: "0.5px solid #3a5a8a", background: "#1a2a40", color: "#6fa3d4", fontSize: "13px", cursor: "pointer" }}
        >
          Sign in
        </button>
      </div>
    )
  }

  const userName = session.user.name || extractName(session.user.email || "")
  const userInitials = getInitials(userName)
  const selectedContact = selectedEmail ? getEmailContact(selectedEmail, activeFolder) : ""
  const selectedName = selectedEmail ? extractName(selectedContact) : ""
  const selectedPalette = selectedEmail ? avatarPalette(selectedName) : AVATAR_PALETTES[0]

  // ── Main layout ──────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>

      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside style={S.sidebar}>
        {/* User header */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 14px 10px", borderBottom: "0.5px solid #2a2a2a" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500, color: "#aaa", flexShrink: 0 }}>
            {userInitials}
          </div>
          <span style={{ flex: 1, fontSize: "12px", fontWeight: 500, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName}
          </span>
          <ChevronDown size={13} color="#555" />
        </div>

        {/* Folder nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {FOLDER_NAV.map(({ label, folder, icon }) => {
            const isActive = activeFolder === folder
            return (
              <button
                key={folder}
                onClick={() => handleFolderChange(folder)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  width: "100%", padding: "6px 14px",
                  background: isActive ? "#222" : "transparent",
                  border: "none", cursor: "pointer",
                  color: isActive ? "#e8e8e8" : "#999",
                  fontSize: "12.5px", textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#1e1e1e" }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
              >
                {icon}
                <span style={{ flex: 1 }}>{label}</span>
                {folder === "inbox" && unreadCount > 0 && (
                  <span style={{ fontSize: "11px", color: "#666" }}>{unreadCount}</span>
                )}
              </button>
            )
          })}

          <div style={{ padding: "10px 14px 4px", fontSize: "10px", color: "#444", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Categories
          </div>

          {CATEGORY_NAV.map(({ label, icon, count }) => (
            <button
              key={label}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "6px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#999", fontSize: "12.5px", textAlign: "left" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1e1e1e" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              {icon}
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{ fontSize: "11px", color: "#666" }}>{count}</span>
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ borderTop: "0.5px solid #2a2a2a", padding: "10px 14px" }}>
          <button
            onClick={() => signOut()}
            style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", cursor: "pointer", color: "#666", fontSize: "12px", width: "100%" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ccc" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#666" }}
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ════════════════ EMAIL LIST ════════════════ */}
      <section style={S.listPanel}>
        {/* Header */}
        <div style={{ padding: "12px 14px 0", borderBottom: "0.5px solid #2a2a2a", flexShrink: 0 }}>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#e8e8e8", marginBottom: "10px", textTransform: "capitalize" }}>
            {activeFolder}
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            {(["all", "unread"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "3px 11px", borderRadius: "14px",
                  border: "0.5px solid #333",
                  background: activeTab === tab ? "#2a2a2a" : "transparent",
                  color: activeTab === tab ? "#e8e8e8" : "#777",
                  fontSize: "11px", cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.1s",
                }}
              >
                {tab === "all" ? "All mail" : "Unread"}
              </button>
            ))}
          </div>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: "7px", background: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "6px", padding: "5px 10px", marginBottom: "10px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "none", border: "none", outline: "none", color: "#ccc", fontSize: "12px", width: "100%", fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Email list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {emailsLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", color: "#444" }}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : filteredEmails.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px", color: "#444", gap: "8px" }}>
              <Inbox size={24} />
              <span style={{ fontSize: "12px" }}>{searchQuery ? "No results" : "No emails here"}</span>
            </div>
          ) : (
            filteredEmails.map((email) => {
              const isRead     = email.flags?.seen || activeFolder === "sent"
              const isSelected = selectedEmail?.uid === email.uid
              const contact    = getEmailContact(email, activeFolder)
              const name       = extractName(contact)
              const palette    = avatarPalette(name)

              // Naive tag extraction from subject keywords — replace with real tag data if available
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
                  style={{
                    display: "block", width: "100%", padding: "11px 14px",
                    background: isSelected ? "#1e2030" : "transparent",
                    borderLeft: isSelected ? "2px solid #4a6fa5" : "2px solid transparent",
                    borderRight: "none", borderTop: "none",
                    borderBottom: "0.5px solid #1e1e1e",
                    cursor: "pointer", textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#1a1a1a" }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  {/* Row 1: name + date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                      {!isRead && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4a7abf", flexShrink: 0, display: "inline-block" }} />}
                      <span style={{ fontSize: "12.5px", fontWeight: isRead ? 400 : 600, color: "#e0e0e0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>
                        {activeFolder === "sent" ? `To: ${name}` : name}
                      </span>
                    </div>
                    <span style={{ fontSize: "10.5px", color: "#555", flexShrink: 0, paddingLeft: "6px" }}>
                      {formatDate(email.date)}
                    </span>
                  </div>
                  {/* Row 2: subject */}
                  <div style={{ fontSize: "12px", fontWeight: 500, color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "3px" }}>
                    {email.subject || "(no subject)"}
                  </div>
                  {/* Row 3: snippet */}
                  <div style={{ fontSize: "11px", color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: tags.length ? "6px" : 0 }}>
                    {getEmailSnippet(email.body)}
                  </div>
                  {/* Tags */}
                  {tags.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {tags.slice(0, 3).map((tag) => (
                        <span key={tag} style={{ padding: "2px 7px", borderRadius: "10px", fontSize: "10px", border: "0.5px solid", ...tagStyle(tag) }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </section>

      {/* ════════════════ READING PANE ════════════════ */}
      <main style={S.readingPane}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 14px", borderBottom: "0.5px solid #2a2a2a", background: "#161616", flexShrink: 0 }}>
          {[
            { icon: <Archive size={14} />, title: "Archive" },
            { icon: <AlertTriangle size={14} />, title: "Junk" },
            { icon: <Trash2 size={14} />, title: "Delete" },
          ].map(({ icon, title }) => (
            <ToolbarBtn key={title} title={title}>{icon}</ToolbarBtn>
          ))}
          <div style={{ flex: 1 }} />
          <ToolbarBtn title="Snooze"><Clock size={14} /></ToolbarBtn>
          <div style={{ flex: 1 }} />
          {selectedEmail && (
            <>
              <ToolbarBtn title="Reply" onClick={() => replyRef.current?.focus()}><CornerUpLeft size={14} /></ToolbarBtn>
              <ToolbarBtn title="Reply all" onClick={() => replyRef.current?.focus()}><CornerUpLeft size={14} /></ToolbarBtn>
              <ToolbarBtn title="Forward" onClick={() => openForwardCompose(selectedEmail)}><CornerUpRight size={14} /></ToolbarBtn>
            </>
          )}
          <ToolbarBtn title="More"><MoreVertical size={14} /></ToolbarBtn>
        </div>

        {selectedEmail ? (
          <>
            {/* Email content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
              {/* Sender card */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "20px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: selectedPalette.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 500, color: selectedPalette.text, flexShrink: 0 }}>
                  {getInitials(selectedName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#e8e8e8" }}>{selectedName}</div>
                  <div style={{ fontSize: "12px", color: "#777", marginTop: "2px" }}>{selectedEmail.subject || "(no subject)"}</div>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
                    Reply-To: {extractEmail(selectedContact)}
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#555", flexShrink: 0 }}>
                  {formatFullDate(selectedEmail.date)}
                </div>
              </div>

              {/* Body */}
              <div style={{ borderTop: "0.5px solid #2a2a2a", paddingTop: "18px", fontSize: "13px", color: "#c0c0c0", lineHeight: 1.75 }}>
                {selectedEmail.body.html && typeof selectedEmail.body.html === "string" ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body.html }}
                    style={{ color: "#c0c0c0" }}
                  />
                ) : (
                  <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
                    {selectedEmail.body.text || "No content"}
                  </pre>
                )}
              </div>
            </div>

            {/* Inline reply box */}
            <div style={{ borderTop: "0.5px solid #2a2a2a", padding: "12px 16px", background: "#161616", flexShrink: 0 }}>
              <form onSubmit={handleSendReply}>
                <div style={{ background: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "8px", padding: "10px 12px" }}>
                  <textarea
                    ref={replyRef}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder={`Reply ${selectedName}…`}
                    disabled={sending}
                    rows={3}
                    style={{
                      width: "100%", background: "none", border: "none", outline: "none",
                      color: replyBody ? "#e0e0e0" : "#555",
                      fontSize: "12px", resize: "none", fontFamily: "inherit",
                      lineHeight: 1.6,
                    }}
                  />

                  {sendError && (
                    <div style={{ fontSize: "11px", color: "#c46060", marginTop: "4px", padding: "4px 8px", background: "#2a1414", borderRadius: "4px", border: "0.5px solid #5a2a2a" }}>
                      {sendError}
                    </div>
                  )}
                  {sendSuccess && (
                    <div style={{ fontSize: "11px", color: "#5abf8a", marginTop: "4px" }}>
                      Message sent.
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                    {/* Mute toggle */}
                    <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", color: "#555", fontSize: "11px", userSelect: "none" }}>
                      <div
                        onClick={() => setMuteThread(!muteThread)}
                        style={{
                          width: "28px", height: "15px", borderRadius: "8px",
                          background: muteThread ? "#3a5a8a" : "#2a2a2a",
                          border: "0.5px solid #333", position: "relative",
                          cursor: "pointer", transition: "background 0.2s",
                        }}
                      >
                        <div style={{
                          width: "11px", height: "11px", borderRadius: "50%",
                          background: muteThread ? "#6fa3d4" : "#555",
                          position: "absolute", top: "1.5px",
                          left: muteThread ? "14px" : "2px",
                          transition: "left 0.2s, background 0.2s",
                        }} />
                      </div>
                      Mute this thread
                    </label>

                    <button
                      type="submit"
                      disabled={sending || !replyBody.trim()}
                      style={{
                        padding: "5px 16px", borderRadius: "6px",
                        border: "0.5px solid #3a5a8a",
                        background: sending || !replyBody.trim() ? "#111" : "#1a2a40",
                        color: sending || !replyBody.trim() ? "#444" : "#6fa3d4",
                        fontSize: "12px", cursor: sending || !replyBody.trim() ? "not-allowed" : "pointer",
                        fontFamily: "inherit", display: "flex", alignItems: "center", gap: "5px",
                        transition: "all 0.1s",
                      }}
                    >
                      {sending ? <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Sending…</> : "Send"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#444", gap: "10px" }}>
            <Mail size={28} />
            <div style={{ fontSize: "13px" }}>Select an email to read</div>
          </div>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Small toolbar button ─────────────────────────────────────────────────────

function ToolbarBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "28px", height: "28px", borderRadius: "6px",
        border: "0.5px solid #2a2a2a",
        background: hovered ? "#2a2a2a" : "#1e1e1e",
        color: hovered ? "#ccc" : "#777",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.1s", flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}