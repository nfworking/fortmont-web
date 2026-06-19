import { redirect } from "next/navigation";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fortmont Account",
  description: "Dashboard for managing your Fortmont account settings.",
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getInitials(value: string | null | undefined) {
  return (value ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Cast to include all fields your JWT/session callbacks write onto session.user
  const sessionUser = session.user as {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null; // set by your jwt callback if available
    sub?: string | null; // raw JWT subject — often the user id
  };

  // Build the lookup candidates — prefer id, fall back to email only.
  // Avoid matching on name/username since session.user.name is typically
  // displayName ("Server Administrator"), not the username ("svradmin").
  const userId = (sessionUser.id ?? sessionUser.sub)?.trim();
  const email = sessionUser.email?.trim().toLowerCase();

  const user = await prisma.appUsers.findFirst({
    where: {
      OR: [...(userId ? [{ id: userId }] : []), ...(email ? [{ email }] : [])],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      avatarUrl: true,
      phone: true,
      isEntraUser: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastLoggedIn: true,
      mailboxes: {
        select: {
          id: true,
          email: true,
          isPrimary: true,
          provider: true,
        },
      },
      deviceTokens: {
        select: {
          id: true,
          platform: true,
          deviceName: true,
          deviceModelName: true,
          deviceBrand: true,
        },
      },
      teams: {
        select: {
          name: true,
          description: true,
        },
      },
      githubLink: {
        select: {
          username: true,
          profileUrl: true,
          avatarUrl: true,
          scope: true,
          linkedAt: true,
        },
      },
    },
  });

  const accountType = user?.isEntraUser ? "Microsoft Entra" : "Local account";
  const roleLabel = user?.role ?? "No role set";
  const deviceBrand = (
    user?.deviceTokens?.[0]?.deviceBrand ?? "No device brand set"
  )
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const initials = getInitials(
    user?.displayName ?? user?.username ?? user?.email ?? sessionUser.name,
  );

  const primaryMailbox =
    user?.mailboxes?.find((m) => m.isPrimary) ?? user?.mailboxes?.[0];

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Page header */}
      <section className="rounded-2xl border border-border/60 transition-all duration-300 bg-transparent backdrop-blur p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Account settings
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Your profile
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Review and update the profile data stored in the database for
                your signed-in account.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={user?.isActive ? "default" : "secondary"}>
                {user?.isActive ? "Active" : "Pending"}
              </Badge>
              <Badge variant="outline">{accountType}</Badge>
              <Badge variant="secondary">{roleLabel}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border/60 transition-all duration-300 bg-transparent backdrop-blur p-4 shadow-sm ">
            <Avatar className="h-16 w-16 rounded-2xl">
              <AvatarImage
                src={user?.avatarUrl ?? undefined}
                alt={user?.displayName ?? user?.username ?? "Account"}
              />
              <AvatarFallback className="rounded-2xl text-lg">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {user?.displayName ??
                  user?.username ??
                  sessionUser.name ??
                  "Account"}
              </p>
              <p className="text-sm text-muted-foreground">
                {user?.email ?? sessionUser.email ?? "No email on file"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user
                  ? `Last updated ${formatDate(user.updatedAt)}`
                  : "Linked account record not found"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        {/* Edit form */}
        <Card className="  transition-all duration-300 bg-transparent backdrop-blur">
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>
              These are the profile fields that can be updated from your account
              page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user ? (
              <AccountSettingsForm
                user={{
                  id: user.id,
                  displayName: user.displayName,
                  email: user.email,
                  phone: user.phone,
                  avatarUrl: user.avatarUrl,
                }}
                hasMailbox={(user.mailboxes?.length ?? 0) > 0}
              />
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  We could not find a matching database account for the current
                  session.
                </p>
                <p>
                  Session identity used for lookup:{" "}
                  <span className="font-mono text-foreground">
                    {userId ?? "no id"} / {email ?? "no email"}
                  </span>
                </p>
                <p>
                  If this is an Entra login, make sure the account exists in
                  AppUsers and that the session email or id matches the stored
                  record.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6 background-transparent">
          <Card className="  transition-all duration-300 bg-transparent backdrop-blur">
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription>
                Read-only identity and lifecycle data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm background-transparent">
              {user ? (
                <>
                  <DetailRow label="User ID" value={user.id} />
                  <DetailRow label="Username" value={user.username} />
                </>
              ) : (
                <DetailRow label="Account link" value="No database match yet" />
              )}
              <Separator />
              <DetailRow
                label="Display name"
                value={user?.displayName ?? sessionUser.name ?? "Not set"}
              />
              <DetailRow
                label="Email"
                value={user?.email ?? sessionUser.email ?? "Not set"}
              />
              <DetailRow label="Phone" value={user?.phone ?? "Not set"} />
              <Separator />
              <DetailRow
                label="Primary mailbox"
                value={primaryMailbox?.email ?? "No mailbox provisioned"}
              />
              <DetailRow
                label="Mailboxes"
                value={
                  user?.mailboxes?.length
                    ? `${user.mailboxes.length} linked`
                    : "None"
                }
              />
              <Separator />
              <>
                <DetailRow
                  label="Github Accounts Linked"
                  value={
                    user?.githubLink ? "1 account linked" : "No accounts linked"
                  }
                />
                <DetailRow
                  label="Github Username"
                  value={user?.githubLink?.[0]?.username ?? "Not set"}
                />
                <DetailRow
                  label="Github Linked At"
                  value={
                    user?.githubLink?.[0]?.linkedAt
                      ? formatDate(user.githubLink[0].linkedAt)
                      : "Not set"
                  }
                />{" "}
              </>{" "}
              <Separator />
              <DetailRow label="Role" value={user?.role ?? "Not set"} />
              <DetailRow
                label="Account type"
                value={user?.isEntraUser ? "Microsoft Entra" : "Local account"}
              />
              <DetailRow
                label="Status"
                value={user?.isActive ? "Active" : "Pending"}
              />
              <Separator />
              {user && (
                <>
                  <DetailRow
                    label="Created"
                    value={formatDate(user.createdAt)}
                  />
                  <DetailRow
                    label="Last login"
                    value={
                      user.lastLoggedIn
                        ? formatDate(user.lastLoggedIn)
                        : "Never"
                    }
                  />
                </>
              )}
              <Separator />
              <DetailRow
                label="Devices"
                value={
                  user?.deviceTokens?.length
                    ? `${user.deviceTokens.length} linked`
                    : "None"
                }
              />
              {user?.deviceTokens?.[0] && (
                <>
                  <DetailRow label="Device Brand" value={deviceBrand} />
                  <DetailRow
                    label="Device Model"
                    value={
                      user?.deviceTokens?.[0]?.deviceModelName ??
                      "No device model set"
                    }
                  />
                </>
              )}
              <Separator />
              <DetailRow
                label="Teams"
                value={
                  user?.teams?.length ? `${user.teams.length} joined` : "None"
                }
              />
              {user?.teams?.length
                ? user.teams.length > 0
                : false && (
                    <DetailRow
                      label="Team names"
                      value={
                        user?.teams?.length
                          ? user?.teams
                              .map((t) => `${t.name}: ${t.description}`)
                              .join(", ")
                          : "No teams joined"
                      }
                    />
                  )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="max-w-[65%] truncate text-right font-medium text-foreground">
        {value ?? "—"}
      </span>
    </div>
  );
}
