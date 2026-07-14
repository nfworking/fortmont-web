// components/dashboard_res/status.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Activity, RefreshCw } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

export type SystemStatusLevel = "operational" | "degraded" | "down" | "unknown";

export interface SystemStatusItem {
  id: string;
  name: string;
  status: SystemStatusLevel;
  message?: string;
  lastChecked?: string;
}

interface SystemStatusPanelProps {
  title?: string;
  systems?: SystemStatusItem[];
  className?: string;
  onRefresh?: () => void;
}

interface StatusMeta {
  label: string;
  dot: string;
  ring: string;
  badge: string;
  defaultMessage: string;
}

// ── Sample data (swap for API data later — same shape) ─────────────────────

const SAMPLE_SYSTEMS: SystemStatusItem[] = [
  { id: "proxmox", name: "Proxmox Cluster", status: "operational", lastChecked: new Date().toISOString() },
  { id: "dns", name: "DNS", status: "operational", lastChecked: new Date().toISOString() },
  { id: "mail", name: "Mail (IMAP/SMTP)", status: "degraded", lastChecked: new Date().toISOString() },
  { id: "storage", name: "Object Storage", status: "operational", lastChecked: new Date().toISOString() },
  { id: "ticketing", name: "Ticketing API", status: "down", lastChecked: new Date().toISOString() },
  { id: "redis", name: "Redis", status: "unknown" },
];

// ── Status metadata ─────────────────────────────────────────────────────────

const STATUS_META: Record<SystemStatusLevel, StatusMeta> = {
  operational: {
    label: "Operational",
    dot: "bg-emerald-500",
    ring: "bg-emerald-500/40",
    badge:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900/40",
    defaultMessage: "This system is healthy and responding normally.",
  },
  degraded: {
    label: "Degraded",
    dot: "bg-amber-500",
    ring: "bg-amber-500/40",
    badge:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-900/40",
    defaultMessage: "This system is experiencing elevated latency or partial errors.",
  },
  down: {
    label: "Down",
    dot: "bg-red-500",
    ring: "bg-red-500/40",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
    defaultMessage: "This system is currently unavailable or failing health checks.",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-zinc-400",
    ring: "bg-zinc-400/30",
    badge: "bg-muted text-muted-foreground border-border/60",
    defaultMessage: "No recent status has been reported for this system.",
  },
};

const STATUS_PRIORITY: SystemStatusLevel[] = ["down", "degraded", "unknown", "operational"];

// ── Helpers ─────────────────────────────────────────────────────────────────

function overallStatus(systems: SystemStatusItem[]): SystemStatusLevel {
  for (const level of STATUS_PRIORITY) {
    if (systems.some((s) => s.status === level)) return level;
  }
  return "operational";
}

function relativeTime(iso?: string) {
  if (!iso) return "Never checked";

  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;

  return new Date(iso).toLocaleDateString();
}

// ── Status dot (with tooltip) ────────────────────────────────────────────

function StatusDot({ item }: { item: SystemStatusItem }) {
  const meta = STATUS_META[item.status];
  const isLive = item.status === "operational" || item.status === "degraded";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="relative flex h-2.5 w-2.5 shrink-0 cursor-default">
          {isLive && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                meta.ring
              )}
            />
          )}
          <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", meta.dot)} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 text-center">
        <p className="font-medium">{meta.label}</p>
        <p className="text-[11px] opacity-80">{item.message ?? meta.defaultMessage}</p>
        {item.lastChecked !== undefined && (
          <p className="mt-1 text-[10px] opacity-60">Checked {relativeTime(item.lastChecked)}</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────

export function SystemStatusPanel({
  title = "System Status",
  systems = SAMPLE_SYSTEMS,
  className,
  onRefresh,
}: SystemStatusPanelProps) {
  const overall = overallStatus(systems);
  const overallMeta = STATUS_META[overall];
  const attentionCount = systems.filter((s) => s.status !== "operational").length;

  return (
    <Card className={cn("w-full max-w-sm border-border/60 bg-card/90 shadow-sm backdrop-blur-sm", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {overall === "operational"
            ? "All systems operational"
            : `${attentionCount} system(s) need attention`}
        </CardDescription>
        <CardAction className="flex items-center gap-1.5">
          <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", overallMeta.badge)}>
            {overallMeta.label}
          </Badge>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Refresh status"
            >
              <RefreshCw className="size-3.5" />
            </button>
          )}
        </CardAction>
      </CardHeader>

      <CardContent>
        <div className="divide-y divide-border/50 rounded-lg border border-border/50 bg-background/40">
          {systems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="flex min-w-0 items-center gap-2.5">
                <StatusDot item={item} />
                <span className="truncate text-foreground/90">{item.name}</span>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {STATUS_META[item.status].label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SystemStatusPanel;