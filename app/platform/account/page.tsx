
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Metadata } from "next";
import React from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link"

import { AccountSettingsSidebar } from "@/components/account/Accountsettingssidebar";
import { ProfileSection } from "@/components/account/Profilesection";
import { SecuritySection } from "@/components/account/Securitysection";
import { AccountSection } from "@/components/account/Accountsection";
import { MailboxesSection } from "@/components/account/Mailboxessection";
import { DevicesSection } from "@/components/account/Devicessection";
import { GitHubSection } from "@/components/account/Githubsection";
import { StorageSection } from "@/components/account/Storagesection";
import { SessionsSection } from "@/components/account/Sessionsection";
import DashboardPage from "@/components/account/StoragePage"
import {ThemeToggle} from "@/components/theme-toggle";
import {Layout, ArrowUpRightFromSquare} from "lucide-react"
import { Button } from "@/components/ui/button";
import { UploadPartRequest$ } from "@aws-sdk/client-s3";

export const metadata: Metadata = {
  title: "Fortmont · Account",
  description: "Manage your Fortmont account settings.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-AU", {
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

// ─── Section router ──────────────────────────────────────────────────────────

type SectionKey =
  | "profile"
  | "account"
  | "security"
  | "mailboxes"
  | "devices"
  | "github"
  | "storage"
  | "storage-acc"
  | "sessions";

const VALID_SECTIONS = new Set<SectionKey>([
  "profile",
  "account",
  "security",
  "mailboxes",
  "devices",
  "github",
  "storage",
  "storage-acc",
  "sessions",
]);

function resolveSection(raw: string | string[] | undefined): SectionKey {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return VALID_SECTIONS.has(s as SectionKey) ? (s as SectionKey) : "profile";
}

// ─── Page ───────────────────────────────────────────────────────────────────

// Next.js 15 type definitions expect searchParams to be a Promise
interface PageProps {
  searchParams: Promise<{ section?: string | string[] }>;
}

export default async function AccountPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  // 1. Await searchParams before reading from it
  const resolvedSearchParams = await searchParams;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const sessionUser = session.user as {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
    sub?: string | null;
    sessionId?: string | null;
  };

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
        select: { id: true, email: true, isPrimary: true, provider: true },
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
        select: { name: true, description: true },
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
      storage: {
        select: { quotaBytes: true, usedBytes: true },
      },
    },
  });

  // 2. Pass the un-wrapped object to your resolve helper
  const activeSection = resolveSection(resolvedSearchParams.section);
  const initials = getInitials(
    user?.displayName ?? user?.username ?? user?.email ?? sessionUser.name,
  );

  // ── Section content ────────────────────────────────────────────────────────

  function renderSection() {
    switch (activeSection) {
      case "profile":
        return (
          <ProfileSection
            user={user}
            initials={initials}
            sessionName={sessionUser.name}
            sessionEmail={sessionUser.email}
            formatDate={formatDate}
          />
        );

      case "account":
        return <AccountSection />;

      case "security":
        return <SecuritySection />;

      case "mailboxes":
        return <MailboxesSection mailboxes={user?.mailboxes ?? []} />;

      case "devices":
        return <DevicesSection deviceTokens={user?.deviceTokens ?? []} />;

      case "github":
        return (
          <GitHubSection
            githubLink={user?.githubLink}
            formatDate={formatDate}
          />
        );

      case "storage":
        return <StorageSection storage={user?.storage} />;
      case "storage-acc":
        return <DashboardPage />;
      case "sessions":
        return <SessionsSection currentSessionId={sessionUser.sessionId} />;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-1 flex-col gap-0 p-4 md:p-6">
        
      {/* Page header */}
      <div className="mb-10 space-y-1">
        <div className="flex justify-end">
        <ThemeToggle />
        <Button variant="outline" size="sm" className="gap-1.5 ml-2" asChild>
      <Link href="/dashboard">
        <Layout className="h-3.5 w-3.5" />
        Return to dashboard
        <ArrowUpRightFromSquare className="h-3.5 w-3.5" />
      </Link>
    </Button>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Settings
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      </div>

      {/* Two-column layout: sticky sidebar + scrollable content */}
      <div className="flex gap-8 items-start">
        {/* Sidebar nav — needs useSearchParams so it lives in a Client Component.
            Wrapping in Suspense satisfies Next.js's static generation requirement. */}
        <Suspense fallback={null}>
          <AccountSettingsSidebar
            displayName={user?.displayName ?? sessionUser.name}
            username={user?.username}
            email={user?.email ?? sessionUser.email}
            avatarUrl={user?.avatarUrl}
            initials={initials}
          />
        </Suspense>

        {/* Main content — fills remaining width */}
        <div className="min-w-0 flex-1">{renderSection()}</div>
      </div>
    </main>
  );
}