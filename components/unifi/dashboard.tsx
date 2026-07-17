"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Router,
  Server,
  Cpu,
  MonitorSmartphone,
  Cable,
  MoreVertical,
  Power,
  Radar,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  UnifiDashboardSnapshot,
  UnifiDeviceOverview,
} from "@/lib/unifi_types";

const POLL_INTERVAL_MS = 30_000;
const HISTORY_LENGTH = 20;

interface BandwidthSample {
  time: string;
  downMbps: number;
  upMbps: number;
}

export function UnifiDashboard() {
  const [snapshot, setSnapshot] = useState<UnifiDashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [history, setHistory] = useState<BandwidthSample[]>([]);
  const siteIdRef = useRef<string | undefined>(undefined);

  const load = useCallback(async (siteId?: string) => {
    try {
      const qs = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
      const res = await fetch(`/api/unifi${qs}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data: UnifiDashboardSnapshot = await res.json();
      setSnapshot(data);
      setError(null);
      siteIdRef.current = data.siteId;

      const { downMbps, upMbps } = aggregateThroughput(data);
      setHistory((prev) =>
        [
          ...prev,
          {
            time: new Date(data.fetchedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            downMbps,
            upMbps,
          },
        ].slice(-HISTORY_LENGTH),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load UniFi data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(siteIdRef.current), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const refresh = () => startTransition(() => load(siteIdRef.current));

  const runAction = async (deviceId: string, action: "RESTART" | "LOCATE") => {
    const label = action === "RESTART" ? "Restarting" : "Locating";
    toast.promise(
      fetch("/api/unifi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: siteIdRef.current, deviceId, action }),
      }).then((res) => {
        if (!res.ok) throw new Error("Action failed");
      }),
      {
        loading: `${label} device…`,
        success: action === "RESTART" ? "Restart sent" : "Locate LED flashing",
        error: "Couldn't reach the device",
      },
    );
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="flex items-center gap-3 py-5">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-200">Couldn't load UniFi data</p>
            <p className="text-xs text-red-300/70">{error}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" onClick={refresh}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!snapshot) return null;

  const { summary } = snapshot;
  const latest = history[history.length - 1];

  return (
    <div className="space-y-5">
      <DashboardHeader
        version={snapshot.info?.applicationVersion}
        fetchedAt={snapshot.fetchedAt}
        onRefresh={refresh}
        refreshing={isPending}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Devices online"
          value={`${summary.onlineDevices}/${summary.totalDevices}`}
          icon={Router}
          tone={summary.offlineDevices > 0 ? "warn" : "good"}
        />
        <StatCard
          label="Clients"
          value={summary.totalClients}
          icon={MonitorSmartphone}
          sub={`${summary.wiredClients} wired · ${summary.wirelessClients} wireless`}
        />
        <StatCard
          label="Avg CPU"
          value={summary.avgCpuPct != null ? `${summary.avgCpuPct}%` : "—"}
          icon={Cpu}
        />
        <StatCard
          label="Avg memory"
          value={summary.avgMemPct != null ? `${summary.avgMemPct}%` : "—"}
          icon={Server}
        />
      </div>

      {history.length > 1 && (
        <BandwidthChart history={history} latest={latest} />
      )}

      <div>
        <h2 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-white/40">
          Devices
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              stats={snapshot.deviceStats[device.id] ?? null}
              onAction={runAction}
            />
          ))}
          {snapshot.devices.length === 0 && (
            <p className="text-sm text-white/40">No adopted devices on this site.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-white/40">
          Connected clients
        </h2>
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <CardContent className="p-0">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-white/40">
                  <th className="px-3 py-2 font-medium">Client</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">IP address</th>
                  <th className="px-3 py-2 font-medium">Connected since</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-2 text-white/90">
                      {client.name ?? client.macAddress ?? "Unknown client"}
                    </td>
                    <td className="px-3 py-2 text-white/60">
                      <span className="inline-flex items-center gap-1.5">
                        {client.type === "WIRED" ? (
                          <Cable className="h-3 w-3" />
                        ) : (
                          <Wifi className="h-3 w-3" />
                        )}
                        {client.type ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-white/60">
                      {client.ipAddress ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-white/60">
                      {client.connectedAt
                        ? new Date(client.connectedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
                {snapshot.clients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-5 text-center text-white/40">
                      No clients currently connected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Sums the latest uplink rx/tx across all devices reporting stats, as Mbps. */
function aggregateThroughput(snapshot: UnifiDashboardSnapshot) {
  let rxBps = 0;
  let txBps = 0;
  for (const stats of Object.values(snapshot.deviceStats)) {
    rxBps += stats?.uplink?.rxRateBps ?? 0;
    txBps += stats?.uplink?.txRateBps ?? 0;
  }
  return {
    downMbps: Math.round((rxBps / 1_000_000) * 10) / 10,
    upMbps: Math.round((txBps / 1_000_000) * 10) / 10,
  };
}

function DashboardHeader({
  version,
  fetchedAt,
  onRefresh,
  refreshing,
}: {
  version?: string;
  fetchedAt: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          UniFi Network
        </h1>
        <p className="text-xs text-white/40">
          {version ? `Network ${version} · ` : ""}
          Updated {new Date(fetchedAt).toLocaleTimeString()}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        className="h-8 border-white/10 bg-white/5 text-xs hover:bg-white/10"
      >
        <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", refreshing && "animate-spin")} />
        Refresh
      </Button>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof Router;
  tone?: "neutral" | "good" | "warn";
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <CardContent className="flex items-start justify-between p-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-white/40">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-white">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-white/40">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            tone === "good" && "bg-emerald-500/10 text-emerald-400",
            tone === "warn" && "bg-amber-500/10 text-amber-400",
            tone === "neutral" && "bg-white/5 text-white/50",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </CardContent>
    </Card>
  );
}

function BandwidthChart({
  history,
  latest,
}: {
  history: BandwidthSample[];
  latest?: BandwidthSample;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-white/50">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-white/40">
            Network throughput
          </CardTitle>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-sky-300">
            <ArrowDown className="h-3 w-3" />
            {latest ? `${latest.downMbps} Mbps` : "—"}
          </span>
          <span className="flex items-center gap-1.5 text-violet-300">
            <ArrowUp className="h-3 w-3" />
            {latest ? `${latest.upMbps} Mbps` : "—"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pl-0 pr-3 pt-1">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="unifiDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="unifiUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                minTickGap={32}
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: "#111114",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                formatter={(value: number, name: string) => [
                  `${value} Mbps`,
                  name === "downMbps" ? "Download" : "Upload",
                ]}
              />
              <Area
                type="monotone"
                dataKey="downMbps"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#unifiDown)"
              />
              <Area
                type="monotone"
                dataKey="upMbps"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#unifiUp)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function DeviceCard({
  device,
  stats,
  onAction,
}: {
  device: UnifiDeviceOverview;
  stats: { cpuUtilizationPct: number; memoryUtilizationPct: number } | null;
  onAction: (deviceId: string, action: "RESTART" | "LOCATE") => void;
}) {
  const online = device.state === "ONLINE";

  return (
    <Card className="group relative overflow-hidden border-white/10 bg-white/[0.03] backdrop-blur-xl transition-colors hover:bg-white/[0.05]">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-3 pb-1.5 pt-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-white/5">
            <Router className="h-3.5 w-3.5 text-white/60" />
            <span
              className={cn(
                "absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-[#0b0b0f]",
                online ? "bg-emerald-400" : "bg-white/20",
              )}
            >
              {online && (
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
              )}
            </span>
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-[13px] font-medium leading-tight text-white">
              {device.name}
            </CardTitle>
            <p className="truncate text-[11px] text-white/40">{device.model}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-white/40">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction(device.id, "LOCATE")}>
              <Radar className="mr-2 h-3.5 w-3.5" />
              Flash LED
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction(device.id, "RESTART")}
              className="text-red-400 focus:text-red-400"
            >
              <Power className="mr-2 h-3.5 w-3.5" />
              Restart
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3 pt-0">
        <div className="flex items-center justify-between text-[11px]">
          <Badge
            variant="outline"
            className={cn(
              "border-0 px-1.5 py-0 font-normal",
              online
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-white/5 text-white/40",
            )}
          >
            {online ? (
              <Wifi className="mr-1 h-2.5 w-2.5" />
            ) : (
              <WifiOff className="mr-1 h-2.5 w-2.5" />
            )}
            {device.state}
          </Badge>
          <span className="font-mono text-white/40">{device.ipAddress}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/40">
          <span>Firmware</span>
          <span className="font-mono text-white/60">
            {device.firmwareVersion ?? "—"}
          </span>
        </div>

        {stats && (
          <div className="space-y-1.5 pt-0.5">
            <UsageBar label="CPU" pct={stats.cpuUtilizationPct} />
            <UsageBar label="Memory" pct={stats.memoryUtilizationPct} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UsageBar({ label, pct }: { label: string; pct: number }) {
  const tone = pct > 85 ? "bg-red-400" : pct > 65 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-white/40">
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/5">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40 bg-white/5" />
        <Skeleton className="h-8 w-20 bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg bg-white/5" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-lg bg-white/5" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}