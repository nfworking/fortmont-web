import {
  FileIcon as FileGeneric,
  FileText,
  FileArchive,
  FileCode,
  Image as ImageIcon,
  Film,
  Music,
  Package,
} from "lucide-react";
import { type FileCategory, getFileCategory } from "@/lib/storage";
import { cn } from "@/lib/utils";

const ICONS: Record<FileCategory, typeof FileGeneric> = {
  image: ImageIcon,
  video: Film,
  audio: Music,
  document: FileText,
  archive: FileArchive,
  code: FileCode,
  app: Package,
  other: FileGeneric,
};

export function FileTypeIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[getFileCategory(name)];
  return <Icon className={cn("h-5 w-5", className)} strokeWidth={1.5} />;
}
