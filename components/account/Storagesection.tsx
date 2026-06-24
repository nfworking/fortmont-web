import { Card, CardContent } from "@/components/ui/card";
import { SettingsSection, DetailRow } from "@/components/account/Settingssection";
import { cn } from "@/lib/utils";
import type { AccountStorage } from "./types";

interface StorageSectionProps {
  storage: AccountStorage | null | undefined;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function StorageSection({ storage }: StorageSectionProps) {
  const used = Number(storage?.usedBytes ?? 0);
  const quota = Number(storage?.quotaBytes ?? 0);
  const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  const barColor =
    pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-foreground";

  return (
    <SettingsSection
      tag="Usage"
      title="Storage"
      description="Storage quota assigned to your Fortmont account for uploads, attachments, and mailbox data."
    >
      <Card className="bg-background/35 backdrop-blur-md border-border/60">
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Used</span>
              <span className="text-2xl font-semibold tabular-nums">
                {formatBytes(used)}
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  of {formatBytes(quota)}
                </span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {pct}% used · {formatBytes(quota - used)} free
            </p>
          </div>

          <div className="divide-y divide-border/40 rounded-xl border border-border/40 bg-background/20 px-4">
            <DetailRow label="Attachments" value="—" />
            <DetailRow label="Mailbox data" value="—" />
            <DetailRow label="Uploads" value="—" />
          </div>
        </CardContent>
      </Card>
    </SettingsSection>
  );
}