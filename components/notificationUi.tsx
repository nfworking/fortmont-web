"use client"

import * as React from "react"
import {
  ArrowUpAZ,
  Bell,
  Check,
  CheckCheck,
  CircleAlert,
  KeyRound,
  Loader2,
  Mail,
  MonitorSmartphone,
  ServerCog,
  ShieldAlert,
  WifiOff,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

// ---------- Types ----------

// Matches the shape returned by GET /api/notifications/get
interface ApiNotification {
  id: string
  type: string
  title: string
  description: string
  createdAt: string
  read: boolean
  userId: string
}

// userId is dropped — it's always the logged-in user, nothing to render with it
type Notification = Omit<ApiNotification, "userId">

const NOTIFICATIONS_ENDPOINT = "/api/notifications/get"
const POLL_INTERVAL_MS = 2000

function getPatchEndpoint(notificationId: string) {
  return `/api/notifications/patch/${notificationId}`
}

// ---------- Helpers ----------

// `type` is a free-text field from the backend, not a fixed enum, so this is
// a best-effort lookup with a sane fallback for anything unrecognized.
const typeConfig: Record<
  string,
  { icon: React.ElementType; className: string }
> = {
  Infrastructure: {
    icon: ServerCog,
    className: "bg-blue-500/10 text-blue-400",
  },
  Security: {
    icon: ShieldAlert,
    className: "bg-red-500/10 text-red-400",
  },
  Mail: {
    icon: Mail,
    className: "bg-amber-500/10 text-amber-400",
  },
  Device: {
    icon: MonitorSmartphone,
    className: "bg-emerald-500/10 text-emerald-400",
  },
  Services: {
    icon: ServerCog,
    className: "bg-purple-500/10 text-purple-400",
  }
}

const defaultTypeConfig = {
  icon: CircleAlert,
  className: "bg-zinc-500/10 text-zinc-400",
}

function getTypeConfig(type: string) {
  return typeConfig[type] ?? defaultTypeConfig
}

// Renders a relative time string ("2m ago") from an ISO timestamp. Computed
// client-side since the API only sends createdAt, not a pre-formatted label.
function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""

  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)

  if (diffSec < 5) return "Just now"
  if (diffSec < 60) return `${diffSec}s ago`

  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return `${diffHour}h ago`

  const diffDay = Math.round(diffHour / 24)
  if (diffDay === 1) return "Yesterday"
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

// ---------- Single notification item ----------

function NotificationItem({
  notification,
  onMarkRead,
  onDismiss,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onDismiss: (id: string) => void
}) {
  const { icon: Icon, className } = getTypeConfig(notification.type)

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/60",
        !notification.read && "bg-zinc-800/30"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          className
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-none text-zinc-100">
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="text-sm leading-snug text-zinc-400">
          {notification.description}
        </p>
        <p className="text-xs text-zinc-500">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
            onClick={() => onMarkRead(notification.id)}
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-zinc-400 hover:text-zinc-100"
          onClick={() => onDismiss(notification.id)}
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ---------- Main component ----------

export function NotificationPanel() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  // Tracks ids dismissed locally so a poll landing right after a dismiss
  // doesn't bring the item back before the backend catches up.
  const dismissedIdsRef = React.useRef<Set<string>>(new Set())

 const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch(NOTIFICATIONS_ENDPOINT, {
        credentials: "include",
      });

      if (res.status === 401) {
        // Wipes Chrome application cookies instantly and handles the visual redirect
        await signOut({ redirectTo: "/login" });
        return;
      }

      // Explicitly type the incoming API response data here
      const data: ApiNotification[] = await res.json();

      setNotifications(
        data
          .filter((n) => !dismissedIdsRef.current.has(n.id))
          .map(({ userId, ...rest }) => rest)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      )
      setHasError(false)
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Optimistic: flip the UI immediately, then confirm with the backend.
  // If the PATCH fails, the change is rolled back so the UI doesn't lie
  // about what's actually marked read server-side.
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )

    try {
      const res = await fetch(getPatchEndpoint(id), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      )
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    unreadIds.forEach((id) => markAsRead(id))
  }

  // Optimistic local removal; swap the body for a real DELETE call once
  // that endpoint exists, e.g. DELETE /api/notifications/:id
  const dismiss = (id: string) => {
    dismissedIdsRef.current.add(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative border-zinc-800 bg-transparent backdrop-blur text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 border-zinc-800 bg-background/50 backdrop-blur p-0 text-zinc-100 sm:w-96"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
            
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-100"
          onClick={() => window.location.href = "/admin_ticketing"} 
        >
          <ArrowUpAZ className="h-3.5 w-3.5" />
          View all notifications
        </Button>

        <Separator className="bg-zinc-800" />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            <p className="text-xs text-zinc-500">Loading notifications…</p>
          </div>
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
              <WifiOff className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-300">
              Couldn&apos;t load notifications
            </p>
            <p className="text-xs text-zinc-500">
              We&apos;ll keep retrying automatically.
            </p>
          </div>
        ) : notifications.length > 0 ? (
          <ScrollArea className="h-96">
            <div className="divide-y divide-zinc-800">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDismiss={dismiss}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
              <KeyRound className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-300">All caught up</p>
            <p className="text-xs text-zinc-500">
              You have no new notifications.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default NotificationPanel