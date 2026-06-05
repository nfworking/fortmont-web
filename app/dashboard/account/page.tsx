import { redirect } from "next/navigation";

import { AccountSettingsForm } from "@/components/account-settings-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const sessionUser = session.user as {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };

  const userId = sessionUser.id?.trim();
  const email = sessionUser.email?.trim().toLowerCase();
  const username = sessionUser.name?.trim().toLowerCase();

  const device = await prisma.deviceToken.findFirst({
    where: {
      userId: userId,
    },
    select: {
      platform: true,
      id: true,
      deviceVersion: true,
      deviceName: true,
      deviceModelName: true,
      deviceBrand: true,
     
    },
  });
  

  const user = await prisma.appUsers.findFirst({
    where: {
      OR: [
        ...(userId ? [{ id: userId }] : []),
        ...(email ? [{ email }] : []),
        ...(username ? [{ username }] : []),
      ],
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
      mailboxes: {
      select: {
      id: true,
      email: true,
      isPrimary: true,
      provider: true,
    },
  },
    },
  });

  const accountType = user?.isEntraUser ? "Microsoft Entra" : "Local account";
  const roleLabel = user?.role ?? "No role set";
  const initials = getInitials(user?.displayName ?? user?.username ?? user?.email ?? sessionUser.name);
  const hasMailbox = (user?.mailboxes?.length ?? 0) > 0;

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="rounded-2xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-6 shadow-sm">
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
                Review and update the profile data stored in the database for your signed-in account.
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

          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm backdrop-blur">
            <Avatar className="h-16 w-16 rounded-2xl">
              <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName ?? user?.username ?? "Account"} />
              <AvatarFallback className="rounded-2xl text-lg">{initials || "U"}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">{user?.displayName ?? user?.username ?? sessionUser.name ?? "Account"}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? sessionUser.email ?? "No email on file"}</p>
              <p className="text-xs text-muted-foreground">
                {user ? `Last updated ${formatDate(user.updatedAt)}` : "Linked account record not found"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
            <CardDescription>
              These are the profile fields that make sense to edit from your account page.
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
                  hasMailbox={(user?.mailboxes?.length ?? 0) > 0}

              />
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  We could not find a matching database account for the current session.
                </p>
                <p>
                  If this is an Entra login, make sure the account exists in AppUsers and that the session email or username matches the stored record.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
              <CardDescription>Read-only identity and lifecycle data from Prisma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
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
  <DetailRow
    label="Phone"
    value={user?.phone ?? "Not set"}
  />
  <Separator />
  <DetailRow 
    label="Mailbox ID"
    value={user?.mailboxes?.[0]?.id ?? "No mailbox provisioned"}
  />
<DetailRow
    label="Mailbox Email"
    value={user?.mailboxes?.[0]?.email ?? "No mailbox provisioned"}
  />
<Separator />
  <DetailRow
    label="Avatar URL"
    value={user?.avatarUrl ?? "Not set"}
  />
  <DetailRow
    label="Role"
    value={user?.role ?? "Not set"}
  />
  <DetailRow
    label="Entra user"
    value={user?.isEntraUser ? "Yes" : "No"}
  />
  <DetailRow
    label="Status"
    value={user?.isActive ? "Active" : "Pending"}
  />

  <Separator />

  {user ? (
    <>
      <DetailRow
        label="Created"
        value={formatDate(user.createdAt)}
      />
      <DetailRow
        label="Updated"
        value={formatDate(user.updatedAt)}
      />
    </>
  ) : null}
</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered Devices</CardTitle>
              <CardDescription>These are all the devices registered to your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
            <DetailRow
              label="Device Platform"
              value={device ? device.platform : "No database match yet"}
            />
            <DetailRow
              label="Device ID"
              value={device ? device.id : "No database match yet"}
            />
              <DetailRow
              label="Device Name"
              value={device ? device.deviceName ?? "Not set" : "No database match yet"}
            />
              <DetailRow
              label="Device Model"
              value={device ? device.deviceModelName ?? "Not set" : "No database match yet"}
            />
              <DetailRow
              label="Device Brand"
              value={device ? device.deviceBrand ?? "Not set" : "No database match yet"}
            />
            <DetailRow
              label="Device Version"
              value={device ? device.deviceVersion ?? "Not set" : "No database match yet"}
            />
  
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[65%] truncate text-right font-medium text-foreground">{value}</span>
    </div>
  );
}