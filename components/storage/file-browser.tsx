"use client";
import { useMemo, useState } from "react";
import {
  Search,
  Download,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  Copy,
  ArrowUpDown,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileTypeIcon } from "@/components/storage/file-icon";
import { UploadDialog } from "@/components/storage/upload-dialog";
import { cn } from "@/lib/utils";
import {
  downloadFile,
  formatBytes,
  getFileExtension,
  type StorageFile,
} from "@/lib/storage";

type SortKey = "name" | "size";

async function handleDownload(file: StorageFile) {
  try {
    await downloadFile(file);
  } catch (error) {
    toast.error("Download failed", {
      description: error instanceof Error ? error.message : "Unexpected error",
    });
  }
}

function FileActions({ file }: { file: StorageFile }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleDownload(file)}>
          <Download className="h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(file.id);
            toast.success("File ID copied");
          }}
        >
          <Copy className="h-4 w-4" />
          Copy file ID
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FileCard({ file }: { file: StorageFile }) {
  const ext = getFileExtension(file.name);
  return (
    <div className="group relative flex flex-col rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30">
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
        <FileActions file={file} />
      </div>
      <div className="mb-4 flex aspect-square w-full items-center justify-center rounded-md bg-secondary">
        <FileTypeIcon name={file.name} className="h-9 w-9 text-foreground/80" />
      </div>
      <p className="truncate text-sm font-medium" title={file.name}>
        {file.name}
      </p>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono uppercase">{ext || "file"}</span>
        <span className="font-mono">{formatBytes(file.size)}</span>
      </div>
    </div>
  );
}

function FileRow({ file }: { file: StorageFile }) {
  return (
    <div className="group flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0 hover:bg-accent/50">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
        <FileTypeIcon name={file.name} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {file.objectKey}
        </p>
      </div>
      <span className="hidden w-24 shrink-0 text-right font-mono text-xs text-muted-foreground sm:block">
        {formatBytes(file.size)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => handleDownload(file)}
      >
        <Download className="h-4 w-4" />
        <span className="sr-only">Download</span>
      </Button>
      <FileActions file={file} />
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Inbox className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium">
        {query ? "No files match your search" : "No files yet"}
      </p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {query
          ? "Try a different keyword or clear the search."
          : "Upload your first file to get started."}
      </p>
      {!query && (
        <div className="mt-4">
          <UploadDialog />
        </div>
      )}
    </div>
  );
}

export function FileBrowser({
  files,
  isLoading,
  error,
}: {
  files: StorageFile[];
  isLoading: boolean;
  error?: Error | null;
}) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("name");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? files.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.objectKey.toLowerCase().includes(q),
        )
      : files;
    return [...filtered].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : b.size - a.size,
    );
  }, [files, query, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files by name or path…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[130px]">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => v && setView(v as "grid" | "list")}
            variant="outline"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <ListIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-medium">Couldn't load your files</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        </div>
      ) : isLoading ? (
        <div
          className={cn(
            view === "grid"
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              : "rounded-lg border",
          )}
        >
          {Array.from({ length: view === "grid" ? 10 : 6 }).map((_, i) =>
            view === "grid" ? (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ) : (
              <Skeleton key={i} className="m-2 h-12 rounded-md" />
            ),
          )}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState query={query} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((file) => (
            <FileCard key={file.id} file={file} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          {visible.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
