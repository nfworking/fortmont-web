"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY ?? "",
        }
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
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-transparent backdrop-blur">
      <section className="rounded-2xl bg-transparent backdrop-blur p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              FortmontAPI
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Users overview
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              All the users in your system
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {users.length} users
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 backdrop-blur bg-background/40 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">Users</h2>
        </div>

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
      </section>
    </main>
  );
}