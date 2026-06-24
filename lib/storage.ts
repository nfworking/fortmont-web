// Storage API client. All requests are same-origin and rely on the
// cookie session issued by the backend, so every call uses
// `credentials: "include"`.
//
// Endpoint contract (implemented on the backend):
//   GET  /api/users                     -> account + files (session required)
//   POST /api/storage/upload-url        -> { uploadUrl, uploadId }
//   PUT  <uploadUrl>                    -> raw file body to SeaweedFS
//   POST /api/storage/complete-upload   -> { fileId }
//   GET  /api/storage/download-url      -> { downloadUrl } (presigned S3 GET)

export interface FileOwner {
  id: string;
  username: string;
}

export interface StorageFile {
  id: string;
  owner: FileOwner;
  bucket: string;
  objectKey: string;
  name: string;
  size: number;
  createdAt?: string;
  contentType?: string;
}

export interface SessionUser {
  id: string;
  username: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface AccountResponse extends SessionUser {
  files: StorageFile[];
  storageLimit?: number | null;
}

const jsonHeaders = { "Content-Type": "application/json" } as const;

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}
export async function fetchAccount(): Promise<AccountResponse> {
  const res = await fetch("/api/users", {
    method: "GET",
    credentials: "include",
  });

  const data = await parseJson<AccountResponse>(res);

  return {
    ...data,
    files: Array.isArray(data.files) ? data.files : [],
  };
}

export interface UploadProgress {
  stage: "requesting" | "uploading" | "finalizing";
}

export async function uploadFile(
  file: File,
  onStage?: (stage: UploadProgress["stage"]) => void,
): Promise<{ fileId: string }> {
  // Step 1 — request a presigned upload URL.
  onStage?.("requesting");
  const uploadUrlRes = await fetch("/api/storage/upload-url", {
    method: "POST",
    headers: jsonHeaders,
    credentials: "include",
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      ticketId: null,
    }),
  });
  const uploadData = await parseJson<{ uploadUrl: string; uploadId: string }>(
    uploadUrlRes,
  );

  // Step 2 — upload the raw bytes directly to SeaweedFS.
  onStage?.("uploading");
  const seaweedRes = await fetch(uploadData.uploadUrl, {
    method: "PUT",
    body: file,
  });
  if (!seaweedRes.ok) {
    const text = await seaweedRes.text().catch(() => "");
    console.error("SeaweedFS response:", text);
    throw new Error(`SeaweedFS upload failed: ${seaweedRes.status}`);
  }

  // Step 3 — finalize the upload.
  onStage?.("finalizing");
  const completeRes = await fetch("/api/storage/complete-upload", {
    method: "POST",
    headers: jsonHeaders,
    credentials: "include",
    body: JSON.stringify({ uploadId: uploadData.uploadId }),
  });
  const completeData = await parseJson<{ fileId: string }>(completeRes);
  return { fileId: completeData.fileId };
}

export async function getDownloadUrl(fileId: string): Promise<string> {
  const res = await fetch(
    `/api/storage/download-url?fileId=${encodeURIComponent(fileId)}`,
    { credentials: "include" },
  );
  const data = await parseJson<{ downloadUrl?: string; url?: string }>(res);
  const url = data.downloadUrl ?? data.url;
  if (!url) throw new Error("No download URL returned");
  return url;
}

export async function downloadFile(file: StorageFile): Promise<void> {
  const url = await getDownloadUrl(file.id);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

// ---------- formatting helpers ----------

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${sizes[i]}`;
}

export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "code"
  | "app"
  | "other";

const EXT_MAP: Record<string, FileCategory> = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
  svg: "image", bmp: "image", heic: "image", avif: "image",
  mp4: "video", mov: "video", mkv: "video", webm: "video", avi: "video",
  mp3: "audio", wav: "audio", flac: "audio", m4a: "audio", ogg: "audio",
  pdf: "document", doc: "document", docx: "document", txt: "document",
  md: "document", rtf: "document", xls: "document", xlsx: "document",
  ppt: "document", pptx: "document", csv: "document",
  zip: "archive", rar: "archive", "7z": "archive", tar: "archive", gz: "archive",
  js: "code", ts: "code", tsx: "code", jsx: "code", json: "code", html: "code",
  css: "code", py: "code", go: "code", rs: "code", java: "code", sh: "code",
  apk: "app", exe: "app", dmg: "app", deb: "app", ipa: "app", appimage: "app",
};

export function getFileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

export function getFileCategory(name: string): FileCategory {
  return EXT_MAP[getFileExtension(name)] ?? "other";
}
