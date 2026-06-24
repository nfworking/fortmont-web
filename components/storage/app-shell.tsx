import { type ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/storage/app-sidebar";
import { UploadDialog } from "@/components/storage/upload-dialog";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const session = await auth();

  const account = session?.user?.id
    ? await prisma.appUsers.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          avatarUrl: true,
        },
      })
    : null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar account={account} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <h1 className="font-display text-sm font-semibold tracking-tight">
              {title}
            </h1>
            <div className="ml-auto">
              <UploadDialog />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </SidebarProvider>
  );
}