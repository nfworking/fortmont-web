"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardHero, DashboardPage, DashboardSection } from "@/components/dashboard/page-shell";

type ApiUserEntry = {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  role?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  isEntraUser: boolean;
  phone: string | null;
  isOnboarded?: boolean;
  mailboxes: {
    id: string;
    email: string;
  }[];

};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function UsersTable() {
  const [users, setUsers] = useState<ApiUserEntry[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users", {
        credentials: "include",
        headers: { "all": "true" },
      });

      if (!res.ok) {
        setUsers([]);
        return;
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    }

    load();
  }, []);

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="Fortmont API"
        title="Users overview"
        description="All the users in your system."
        badge={
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {users.length} users
          </span>
        }
      />

      <DashboardSection title="Users">

        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="min-w-full table-auto">
            <thead className="backdrop-blur bg-background/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Phone Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Active
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Entra User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  User Provisioned
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mailbox ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Mailbox Email
                </th>


              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={8}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage
                            src={user.avatarUrl ?? undefined}
                            alt={user.displayName ?? user.username}
                          />
                          <AvatarFallback>{getInitials(user.displayName ?? user.username)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {user.displayName ?? user.username}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.email ?? "No email"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.username}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.email ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.phone ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.role ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.isActive ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.isEntraUser ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.isOnboarded ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.mailboxes?.[0]?.id ?? "No mailbox Provisioned"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.mailboxes?.[0]?.email ?? "No mailbox Provisioned"}</td>
                 
                    
                     
          
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </DashboardPage>
  );
}