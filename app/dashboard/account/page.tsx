// app/dashboard/account/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import MotionWrapper from "@/components/ui/MotionWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AccountHeader from "@/components/account/AccountHeader";
import ProfileTab from "@/components/account/ProfileTab";
import SettingsTab from "@/components/account/SettingsTab";
import DevicesTab from "@/components/account/DevicesTab";
import MailboxesTab from "@/components/account/MailboxesTab";

export const metadata: Metadata = {
  title: "Accounts Center",
  description: "Manage your account details, devices, and settings.",
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
    where: { userId },
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
      mailboxes: { select: { id: true, email: true, isPrimary: true, provider: true } },
    },
  });

  const initials = getInitials(user?.displayName ?? user?.username ?? user?.email ?? sessionUser.name);
  const hasMailbox = (user?.mailboxes?.length ?? 0) > 0;

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <MotionWrapper variants={pageVariants} transition={{ duration: 0.35, ease: "easeOut" }}>
        <AccountHeader user={user} sessionUser={sessionUser} initials={initials} />
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="mailboxes">Mailboxes</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="mt-4">
            <ProfileTab user={user} formatDate={formatDate} />
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <SettingsTab user={user} />
          </TabsContent>
          <TabsContent value="devices" className="mt-4">
            <DevicesTab device={device} />
          </TabsContent>
          <TabsContent value="mailboxes" className="mt-4">
            <MailboxesTab mailboxes={user?.mailboxes ?? []} />
          </TabsContent>
        </Tabs>
      </MotionWrapper>
  );
}