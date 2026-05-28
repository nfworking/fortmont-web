"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ApiUserEntry = {
  id: string;
  fName: string;
  lName: string;
  publicPhoto?: string | null;
  department?: string | null;
  role?: string | null;
  personalEmail: string;
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function UsersTable() {
  const [users, setUsers] = useState<ApiUserEntry[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/apiUsers", {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY!,
        },
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
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="rounded-2xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              FortmontAPI
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Users overview
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Live user records pulled from the Prisma-backed apiUsers model.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {users.length} users
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">Users</h2>
          <p className="text-sm text-muted-foreground">
            Name, email, department, role, and profile photo from the apiUsers table.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="min-w-full table-auto">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  ID
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-border/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={user.publicPhoto ?? undefined} alt={`${user.fName} ${user.lName}`} />
                          <AvatarFallback>{getInitials(user.fName, user.lName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {user.fName} {user.lName}
                          </div>
                          <div className="text-xs text-muted-foreground">{user.personalEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.personalEmail}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.department ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.role ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.id}</td>
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