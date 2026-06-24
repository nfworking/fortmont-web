// @/components/storage/upload-dialog.tsx
"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation"; // Replaces useQueryClient
import { Upload, X, File as FileIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  uploadFile,
  formatBytes,
  type UploadProgress,
} from "@/lib/storage";

const STAGE_LABEL: Record<UploadProgress["stage"], string> = {
  requesting: "Requesting upload URL…",
  uploading: "Uploading to storage…",
  finalizing: "Finalizing…",
};

const STAGE_VALUE: Record<UploadProgress["stage"], number> = {
  requesting: 20,
  uploading: 65,
  finalizing: 92,
};

export function UploadDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<UploadProgress["stage"] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Natively handle cache clearing and layout refreshing
  const router = useRouter(); 

  const reset = useCallback(() => {
    setFile(null);
    setStage(null);
    setUploading(false);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const { fileId } = await uploadFile(file, setStage);
      toast.success("Upload complete", {
        description: `${file.name} · ${fileId.slice(0, 8)}…`,
      });
      
      // Replaces queryClient.invalidateQueries(["account"])
      // Tells Next.js to silently reload Server Components on the current page 
      router.refresh(); 
      
      setOpen(false);
      reset();
    } catch (error) {
      toast.error("Upload failed", {
        description:
          error instanceof Error ? error.message : "Unexpected upload error",
      });
      setStage(null);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (uploading) return;
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload a file</DialogTitle>
          <DialogDescription>
            Files are uploaded directly to your storage backend.
          </DialogDescription>
        </DialogHeader>

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center transition-colors",
              dragging
                ? "border-foreground bg-accent"
                : "border-border hover:border-foreground/40 hover:bg-accent/50",
            )}
          >
            <Upload className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drop a file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Any file type is supported
              </p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
              <FileIcon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </p>
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        {stage && (
          <div className="space-y-2">
            <Progress value={STAGE_VALUE[stage]} />
            <p className="text-xs text-muted-foreground">{STAGE_LABEL[stage]}</p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? "Uploading" : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}