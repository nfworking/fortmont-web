"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  User,
  Settings,
  ShieldCheck,
  Mail,
  Smartphone,
  Computer,
  Database,
  MonitorSmartphone,
  KeyRound,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Profile",
    items: [
      { key: "profile", label: "Public profile", icon: User },
      { key: "account", label: "Account", icon: Settings },
      { key: "security", label: "Security", icon: ShieldCheck },
    ],
  },
  {
    label: "Integrations",
    items: [
      { key: "mailboxes", label: "Mailboxes", icon: Mail },
      { key: "devices", label: "Devices", icon: Smartphone },
      { key: "github", label: "GitHub", icon: Computer },
    ],
  },
  {
    label: "Usage",
    items: [
      { key: "storage", label: "Storage", icon: Database },
      { key: "storage-acc", label: "Storage Account", icon: Database },
      { key: "platform-api", label: "Platform API", icon: KeyRound },
      { key: "sessions", label: "Sessions", icon: MonitorSmartphone },
    ],
  },
] as const;

interface Props {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  initials: string;
}

export function AccountSettingsSidebar({
  displayName,
  username,
  email,
  avatarUrl,
  initials,
}: Props) {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") ?? "profile";

  return (
    <aside className="sticky top-0 flex h-fit w-56 shrink-0 flex-col self-start">
      {/* User identity block */}
      <div className="flex items-center gap-3 px-3 pb-4">
        <Avatar className="h-9 w-9 rounded-xl">
          <AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? "Account"} />
          <AvatarFallback className="rounded-xl text-xs">{initials || "U"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {displayName ?? username ?? "Account"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {username ? `@${username}` : (email ?? "")}
          </p>
        </div>
      </div>

      <div className="mb-3 h-px bg-border/50" />

      {/* Nav groups */}
      <nav className="flex flex-col gap-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map(({ key, label, icon: Icon }) => {
                const isActive = activeSection === key;
                return (
                  <li key={key}>
                    <Link
                      href={`?section=${key}`}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-background/60 font-medium text-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-foreground" : "text-muted-foreground",
                        )}
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}