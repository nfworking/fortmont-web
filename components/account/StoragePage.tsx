// app/dashboard/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Files, HardDrive, Layers, FileUp } from "lucide-react";
import { AppShell } from "@/components/storage/app-shell";
import { Progress } from "@/components/ui/progress";
import { FileTypeIcon } from "@/components/storage/file-icon";
import { DashboardCharts } from "@/components/storage/dashboard-charts";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBytes, getFileCategory, type FileCategory } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Dashboard — Vault",
  description: "Storage usage overview: totals, breakdown by type, and your largest files.",
  openGraph: {
    title: "Dashboard — Vault",
    description: "Storage usage overview for your cloud workspace.",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface StorageFile {
  id: string;
  name: string;
  size: number;
  bucket: string;
  objectKey: string;
  owner: { id: string; username: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildBreakdown(files: StorageFile[]) {
  const map = new Map<FileCategory, number>();
  for (const f of files) {
    const cat = getFileCategory(f.name);
    map.set(cat, (map.get(cat) ?? 0) + f.size);
  }
  return [...map.entries()]
    .map(([category, size]) => ({ category, size }))
    .sort((a, b) => b.size - a.size);
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Files;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.appUsers.findUnique({
    where: { id: session.user.id },
    select: {
      storage: {
        select: {
          quotaBytes: true,
          usedBytes: true,
        },
      },
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

  const files: StorageFile[] = (user?.files ?? []).map((f) => ({
    ...f,
    size: Number(f.size),
  }));

  const quotaBytes = user?.storage?.quotaBytes
    ? Number(user.storage.quotaBytes)
    : null;

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const breakdown = buildBreakdown(files);
  const largest = [...files].sort((a, b) => b.size - a.size).slice(0, 5);
  const usedPct = quotaBytes ? Math.min(100, (totalSize / quotaBytes) * 100) : null;

  return (
    
      <div className="space-y-4 pt-10 mr-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Storage used"
            value={formatBytes(totalSize)}
            hint={quotaBytes ? `of ${formatBytes(quotaBytes)}` : "across all files"}
            icon={HardDrive}
          />
          <StatCard
            label="Total files"
            value={String(files.length)}
            icon={Files}
          />
          <StatCard
            label="File types"
            value={String(breakdown.length)}
            icon={Layers}
          />
          <StatCard
            label="Largest file"
            value={largest[0] ? formatBytes(largest[0].size) : "—"}
            hint={largest[0]?.name}
            icon={FileUp}
          />
        </div>

        {usedPct !== null && (
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Quota</span>
              <span className="font-mono text-muted-foreground">
                {usedPct.toFixed(1)}%
              </span>
            </div>
            <Progress value={usedPct} />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-lg border bg-card p-4 lg:col-span-3">
            <h2 className="mb-4 font-display text-sm font-semibold">
              Usage by type
            </h2>
            <DashboardCharts breakdown={breakdown} />
          </div>

          <div className="rounded-lg border bg-card p-4 lg:col-span-2">
            <h2 className="mb-4 font-display text-sm font-semibold">
              Largest files
            </h2>
            {largest.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No files yet
              </p>
            ) : (
              <div className="space-y-1">
                {largest.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 py-1.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <FileTypeIcon name={file.name} className="h-4 w-4" />
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm">
                      {file.name}
                    </p>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    
  );
}