import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AccountHeaderProps {
  user: {
    avatarUrl?: string | null;
    displayName?: string | null;
    username?: string | null;
    email?: string | null;
    isActive?: boolean;
    role?: string | null;
    isEntraUser?: boolean | null;
    createdAt?: Date;
    updatedAt?: Date;
  };
  sessionUser: {
    name?: string;
    email?: string;
  };
  initials: string;
}

const formatDate = (date: Date | undefined) => {
  return date ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date) : "";
};

export default function AccountHeader({ user, sessionUser, initials }: AccountHeaderProps) {
  const displayName = user?.displayName ?? user?.username ?? sessionUser.name ?? "Account";
  const email = user?.email ?? sessionUser.email ?? "No email on file";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm backdrop-blur">
      <Avatar className="h-20 w-20 rounded-2xl">
        <AvatarImage src={user?.avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="rounded-2xl text-xl">{initials || "U"}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">{displayName}</p>
        <p className="text-sm text-muted-foreground">{email}</p>
        {user && (
          <p className="text-xs text-muted-foreground">Last updated {formatDate(user.updatedAt)}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        <Badge variant={user?.isActive ? "default" : "secondary"}>
          {user?.isActive ? "Active" : "Pending"}
        </Badge>
        <Badge variant="outline">
          {user?.isEntraUser ? "Microsoft Entra" : "Local account"}
        </Badge>
        {user?.role && <Badge variant="secondary">{user.role}</Badge>}
      </div>
    </div>
  );
}
