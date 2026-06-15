"use client";

import * as React from "react";
import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";
import { SearchCommand } from "./search-command";
import { UserDropdown } from "./user-dropdown";
import { Button } from "@/components/ui/button";
import { Menu, X, Book, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocsShellProps {
  children: React.ReactNode;

  user: {
    username?: string ;
    email?: string ;
    avatarUrl?: string ;
  };

  articles: {
    title: string;
    slug: string;
  }[];
}

export function DocsShell({ children, user, articles }: DocsShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 border-r bg-background transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            <span className="font-semibold">Fortmont KBA</span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar nav */}
        <SidebarNav articles={articles} />

        {/* Extra link */}
        <div className="px-2 mt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 backdrop-blur">
          <div className="flex flex-1 items-center gap-4 px-4 ">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <SearchCommand  articles={articles} />
          </div>

          <div className="flex items-center gap-2 px-4">
            <UserDropdown user={user} />
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}