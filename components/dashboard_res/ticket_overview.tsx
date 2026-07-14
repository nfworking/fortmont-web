// components/dashboard_res/ticket-overview.tsx
"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
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
  Ticket,
  TicketStatus,
} from "@/components/ticketing/admin/ticket";
import {
  Ticket as TicketIcon,
  RefreshCw,
  Circle,
  Clock,
  UserRound,
  AlertTriangle,
} from "lucide-react";

interface TicketOverviewCardProps {
  title?: string;
  className?: string;
  /** Where clicking through should send the user */
  href?: string;
}

function normalizeStatus(status: Ticket["status"]): string {
  return (status ?? "open").toLowerCase();
}

export function TicketOverviewCard({
  title = "Ticket Queue",
  className,
  href = "/admin_ticketing/dashboard",
}: TicketOverviewCardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ticketing/get/ticket", {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        setError(`Request failed (${res.status})`);
        setTickets([]);
        return;
      }

      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError("Could not reach ticketing API");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = tickets.filter((t) => normalizeStatus(t.status) === "open").length;
  const inProgress = tickets.filter((t) => normalizeStatus(t.status) === "in_progress").length;
  const unassigned = tickets.filter((t) => !t.assignedToId).length;
  const urgent = tickets.filter((t) => t.priority === "URGENT").length;
  const total = tickets.length;

  const rows = [
    { id: "open", label: "Open", value: open, icon: Circle, accent: undefined },
    { id: "in_progress", label: "In Progress", value: inProgress, icon: Clock, accent: undefined },
    {
      id: "unassigned",
      label: "Unassigned",
      value: unassigned,
      icon: UserRound,
      accent: unassigned > 0 ? "text-amber-500" : undefined,
    },
    {
      id: "urgent",
      label: "Urgent",
      value: urgent,
      icon: AlertTriangle,
      accent: urgent > 0 ? "text-red-500" : undefined,
    },
  ];

  return (
    <Card className={cn("w-full max-w-sm border-border/60 bg-card/90 shadow-sm backdrop-blur-sm", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TicketIcon className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {loading
            ? "Loading tickets…"
            : error
              ? error
              : total === 0
                ? "No active tickets"
                : `${total} active ticket${total === 1 ? "" : "s"} in queue`}
        </CardDescription>
        <CardAction className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5",
              urgent > 0 &&
                "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            {urgent > 0 ? `${urgent} urgent` : "Stable"}
          </Badge>
          <button
            onClick={load}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh tickets"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          </button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <a href={href} className="block">
          <div className="divide-y divide-border/50 rounded-lg border border-border/50 bg-background/40 transition-colors hover:bg-background/60">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <row.icon className={cn("size-3.5 shrink-0 text-muted-foreground", row.accent)} />
                  <span className="truncate text-foreground/90">{row.label}</span>
                </div>
                <span className={cn("shrink-0 font-mono text-[12px] text-foreground", row.accent)}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </a>
      </CardContent>
    </Card>
  );
}

export default TicketOverviewCard;