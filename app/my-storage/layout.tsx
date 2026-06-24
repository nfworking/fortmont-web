// app/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/storage/app-shell";
import { FileBrowser } from "@/components/storage/file-browser";

export const metadata: Metadata = {
  title: "Files — Vault",
  description: "Browse, search, upload, and download your stored files in one clean black & white workspace.",
  openGraph: {
    title: "Files — Vault",
    description: "Your modern cloud storage workspace.",
  },
};

export default async function FilesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  let files: {
    id: string;
    name: string;
    size: number;
    bucket: string;
    objectKey: string;
    owner: { id: string; username: string };
  }[] = [];
  let error: Error | null = null;

  try {
    const user = await prisma.appUsers.findUnique({
      where: { id: session.user.id },
      select: {
        files: {
          select: {
            id: true,
            name: true,
            size: true,
            bucket: true,
            objectKey: true,
            owner: { select: { id: true, username: true } },
          },
        },
      },
    });

    files = (user?.files ?? []).map((f) => ({
      ...f,
      size: Number(f.size),
    }));
  } catch (e) {
    error = e instanceof Error ? e : new Error("Failed to fetch files");
  }

  return (
    <AppShell title="Files">
      <FileBrowser
        files={files}
        isLoading={false}
        error={error}
      />
    </AppShell>
  );
}