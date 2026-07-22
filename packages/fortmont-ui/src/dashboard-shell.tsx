"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  AlertTriangle,
  ChevronDown,
  CloudIcon,
  CommandIcon,
  Database,
  EthernetPort,
  GitFork,
  GlobeLock,
  LayoutDashboardIcon,
  LogOut,
  MailIcon,
  Menu,
  NetworkIcon,
  ServerIcon,
  User,
  UsersIcon,
  X,
} from "lucide-react"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export type DashboardUser = {
  name?: string | null
  email?: string | null
  avatar?: string | null
  isGithubLinked?: boolean | null
}

export type DashboardNavItem = {
  title: string
  href: string
  icon?: React.ReactNode
  requiresGithub?: boolean
}

export type DashboardSection = {
  path: string
  title: string
}

export type DashboardNavbarProps = {
  title: string
  user?: DashboardUser | null
  centerContent?: React.ReactNode
  actions?: React.ReactNode
  accountHref?: string
  onMenuClick?: () => void
  className?: string
}

export type DashboardSidebarProps = {
  navigation?: DashboardNavItem[]
  activePath?: string
  brandName?: string
  brandDescription?: string
  user?: DashboardUser | null
  isGithubLinked?: boolean
  githubSettingsHref?: string
  onItemClick?: () => void
  onRestrictedItemClick?: () => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  className?: string
}

export type DashboardShellProps = {
  children: React.ReactNode
  user?: DashboardUser | null
  navigation?: DashboardNavItem[]
  sections?: DashboardSection[]
  brandName?: string
  brandDescription?: string
  centerContent?: React.ReactNode
  actions?: React.ReactNode
  accountHref?: string
  githubSettingsHref?: string
  className?: string
}

export const DEFAULT_DASHBOARD_SECTIONS: DashboardSection[] = [
  { path: "/dashboard/server-settings", title: "Server settings" },
  { path: "/dashboard/server-registry", title: "Server Registry" },
  { path: "/dashboard/lxc-registry", title: "LXC Registry" },
  { path: "/dashboard/certs", title: "SSL Certificates" },
  { path: "/dashboard/dns", title: "DNS Records" },
  { path: "/dashboard/users", title: "Site Users" },
  { path: "/dashboard/proxy", title: "Proxy" },
  { path: "/dashboard", title: "Dashboard" },
]

export const DEFAULT_DASHBOARD_NAVIGATION: DashboardNavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: <LayoutDashboardIcon className="size-4" /> },
  { title: "Server Settings", href: "/dashboard/server-settings", icon: <ServerIcon className="size-4" /> },
  { title: "Site Users", href: "/dashboard/users", icon: <UsersIcon className="size-4" /> },
  { title: "DNS Records", href: "/dashboard/dns", icon: <GlobeLock className="size-4" /> },
  { title: "Proxy", href: "/dashboard/proxy", icon: <NetworkIcon className="size-4" /> },
  { title: "SSL Certificates", href: "/dashboard/certs", icon: <GlobeLock className="size-4" /> },
  { title: "Azure", href: "/dashboard/entra", icon: <CloudIcon className="size-4" /> },
  { title: "My Github", href: "/dashboard/mygithub", icon: <GitFork className="size-4" />, requiresGithub: true },
  { title: "My Storage", href: "/my-storage", icon: <Database className="size-4" /> },
  { title: "Unifi", href: "/dashboard/unifi", icon: <EthernetPort className="size-4" /> },
  { title: "Tickets", href: "/admin_ticketing/dashboard", icon: <CommandIcon className="size-4" /> },
  { title: "Webmail", href: "/mail", icon: <MailIcon className="size-4" /> },
  { title: "Apps", href: "/apps", icon: <CommandIcon className="size-4" /> },
]

export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(clsx(inputs))
}

export function getDashboardTitle(pathname: string, sections = DEFAULT_DASHBOARD_SECTIONS) {
  const match = sections.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`))
  return match?.title ?? "Dashboard"
}

function Avatar({ user }: { user?: DashboardUser | null }) {
  const initials = (user?.name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
      {user?.avatar ? (
        <img src={user.avatar} alt={user.name ?? "User avatar"} className="size-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-white">{initials || "U"}</span>
      )}
    </div>
  )
}

export function DashboardProfileBar({
  user,
  accountHref = "/platform/account",
  onSignOut = () => signOut(),
  className,
}: {
  user?: DashboardUser | null
  accountHref?: string
  onSignOut?: () => void
  className?: string
}) {
  const name = user?.name?.trim() || "Unknown user"
  const email = user?.email?.trim() || ""

  return (
    <details className={cn("group relative", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-left outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30">
        <Avatar user={user} />
        <div className="hidden min-w-0 flex-col sm:flex">
          <span className="truncate text-sm font-medium text-white">{name}</span>
          <span className="truncate text-xs text-white/60">{email}</span>
        </div>
        <ChevronDown className="size-4 text-white/60 transition group-open:rotate-180" />
      </summary>

      <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3 rounded-xl px-3 py-3">
          <Avatar user={user} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{name}</div>
            <div className="truncate text-xs text-white/60">{email}</div>
          </div>
        </div>

        <div className="my-2 h-px bg-white/10" />

        <Link
          href={accountHref}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <User className="size-4" />
          Account
        </Link>

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
        >
          <LogOut className="size-4" />
          Log out
        </button>
      </div>
    </details>
  )
}

export function DashboardNavbar({
  title,
  user,
  centerContent,
  actions,
  accountHref,
  onMenuClick,
  className,
}: DashboardNavbarProps) {
  return (
    <header className={cn("sticky top-0 z-30 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl", className)}>
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-white">{title}</div>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">{centerContent}</div>

        <div className="flex items-center gap-2">
          {actions}
          <DashboardProfileBar user={user} accountHref={accountHref} />
        </div>
      </div>
    </header>
  )
}

function DashboardNavList({
  items,
  activePath,
  onItemClick,
  onRestrictedItemClick,
  isGithubLinked,
}: {
  items: DashboardNavItem[]
  activePath: string
  onItemClick?: () => void
  onRestrictedItemClick?: () => void
  isGithubLinked?: boolean
}) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = activePath === item.href || activePath.startsWith(`${item.href}/`)
        const blocked = Boolean(item.requiresGithub && !isGithubLinked)

        return (
          <Link
            key={item.title}
            href={item.href}
            onClick={(event) => {
              if (blocked) {
                event.preventDefault()
                onRestrictedItemClick?.()
                return
              }

              onItemClick?.()
            }}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
              active
                ? "bg-white text-slate-950 shadow-lg shadow-black/20"
                : "text-white/72 hover:bg-white/8 hover:text-white",
              blocked && "opacity-80"
            )}
          >
            <span className={cn("flex size-8 items-center justify-center rounded-xl", active ? "bg-slate-950/10" : "bg-white/8")}>{item.icon}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
            {blocked ? <AlertTriangle className="size-4 text-amber-300" /> : null}
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardSidebar({
  navigation = DEFAULT_DASHBOARD_NAVIGATION,
  activePath = "/dashboard",
  brandName = "Fortmont API",
  brandDescription = "Admin dashboard",
  user,
  isGithubLinked = Boolean(user?.isGithubLinked),
  githubSettingsHref = "/dashboard/settings/accounts",
  onItemClick,
  onRestrictedItemClick,
  mobileOpen = false,
  onMobileOpenChange,
  className,
}: DashboardSidebarProps) {
  const [desktopGated, setDesktopGated] = React.useState(false)
  const showRestrictedModal = onRestrictedItemClick ?? (() => setDesktopGated(true))

  const sidebarBody = (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl transition hover:bg-white/5">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-slate-950">
            <CommandIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{brandName}</div>
            <div className="truncate text-xs text-white/55">{brandDescription}</div>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <DashboardNavList
          items={navigation}
          activePath={activePath}
          onItemClick={onItemClick}
          onRestrictedItemClick={showRestrictedModal}
          isGithubLinked={isGithubLinked}
        />
      </div>
    </div>
  )

  return (
    <>
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 lg:block", className)}>
        {sidebarBody}
      </aside>

      <div className={cn("fixed inset-0 z-40 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => onMobileOpenChange?.(false)}
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[18rem] border-r border-white/10 bg-slate-950 shadow-2xl shadow-black/50 transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-950">
                <CommandIcon className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{brandName}</div>
                <div className="text-xs text-white/55">{brandDescription}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onMobileOpenChange?.(false)}
              className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-3 py-4">
            <DashboardNavList
              items={navigation}
              activePath={activePath}
              onItemClick={() => {
                onItemClick?.()
                onMobileOpenChange?.(false)
              }}
              onRestrictedItemClick={showRestrictedModal}
              isGithubLinked={isGithubLinked}
            />
          </div>
        </aside>
      </div>

      {desktopGated ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <div className="text-lg font-semibold">GitHub account required</div>
                <div className="text-sm text-white/65">Link GitHub before opening that area.</div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDesktopGated(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <Link
                href={githubSettingsHref}
                onClick={() => setDesktopGated(false)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-white/90"
              >
                Link account
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function DashboardShell({
  children,
  user,
  navigation = DEFAULT_DASHBOARD_NAVIGATION,
  sections = DEFAULT_DASHBOARD_SECTIONS,
  brandName,
  brandDescription,
  centerContent,
  actions,
  accountHref,
  githubSettingsHref,
  className,
}: DashboardShellProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const title = getDashboardTitle(pathname, sections)

  return (
    <div className={cn("min-h-svh bg-slate-950 text-white", className)}>
      <DashboardSidebar
        navigation={navigation}
        activePath={pathname}
        brandName={brandName}
        brandDescription={brandDescription}
        user={user}
        isGithubLinked={Boolean(user?.isGithubLinked)}
        githubSettingsHref={githubSettingsHref}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <div className="lg:pl-72">
        <DashboardNavbar
          title={title}
          user={user}
          centerContent={centerContent}
          actions={actions}
          accountHref={accountHref}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="min-h-[calc(100svh-4rem)] px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  )
}

export const ApplicationShell1 = DashboardShell
export const AppSidebar = DashboardSidebar
export const SiteHeader = DashboardNavbar
export const NavUser = DashboardProfileBar