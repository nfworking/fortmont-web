"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
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
  ChevronDown,
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
  UnifiLegacyDevice,
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
  const [viewMode, setViewMode] = useState<"devices" | "ports">("devices");
  const [metricMode, setMetricMode] = useState<"rate" | "total">("rate");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
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
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="flex items-center gap-3 py-5">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive dark:text-red-200">Couldn't load UniFi data</p>
            <p className="text-xs text-muted-foreground">{error}</p>
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

      {snapshot.legacyDevices && snapshot.legacyDevices.length > 0 ? (
        <ThroughputComparisonChart
          legacyDevices={snapshot.legacyDevices}
          viewMode={viewMode}
          setViewMode={setViewMode}
          metricMode={metricMode}
          setMetricMode={setMetricMode}
          selectedDeviceId={selectedDeviceId}
          setSelectedDeviceId={setSelectedDeviceId}
        />
      ) : (
        <Card className="border bg-card/50 backdrop-blur-xl">
          <CardContent className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Bandwidth graph unavailable — couldn't reach the local stats endpoint
            (check <code className="text-foreground/80 dark:text-white/60">UNIFI_LEGACY_SITE_NAME</code>).
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
            <p className="text-sm text-muted-foreground">No adopted devices on this site.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Connected clients
        </h2>
        <Card className="border bg-card/50 backdrop-blur-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
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
                      className="border-b last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-3 py-2 text-foreground/90 font-medium">
                        {client.name ?? client.macAddress ?? "Unknown client"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          {client.type === "WIRED" ? (
                            <Cable className="h-3 w-3" />
                          ) : (
                            <Wifi className="h-3 w-3" />
                          )}
                          {client.type ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                        {client.ipAddress ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {client.connectedAt
                          ? new Date(client.connectedAt).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {snapshot.clients.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-5 text-center text-muted-foreground">
                        No clients currently connected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Formats a byte count dynamically (B/KB/MB/GB/TB). */
function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes >= 1_000_000_000_000) return `${(bytes / 1_000_000_000_000).toFixed(2)} TB`;
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

/** Formats a byte rate per second to dynamic bit rate (bps/Kbps/Mbps/Gbps). */
function formatRate(bytesPerSec: number): string {
  if (!bytesPerSec) return "0 bps";
  const bps = bytesPerSec * 8;
  if (bps >= 1_000_000_000) return `${(bps / 1_000_000_000).toFixed(2)} Gbps`;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(2)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(1)} Kbps`;
  return `${bps.toFixed(0)} bps`;
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
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          UniFi Network
        </h1>
        <p className="text-xs text-muted-foreground">
          {version ? `Network ${version} · ` : ""}
          Updated {new Date(fetchedAt).toLocaleTimeString()}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        className="h-8 text-xs"
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
    <Card className="border bg-card/50 backdrop-blur-xl">
      <CardContent className="flex items-start justify-between p-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            tone === "good" && "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
            tone === "warn" && "bg-amber-500/10 text-amber-500 dark:text-amber-400",
            tone === "neutral" && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ThroughputComparisonChart({
  legacyDevices,
  viewMode,
  setViewMode,
  metricMode,
  setMetricMode,
  selectedDeviceId,
  setSelectedDeviceId,
}: {
  legacyDevices: UnifiLegacyDevice[];
  viewMode: "devices" | "ports";
  setViewMode: (val: "devices" | "ports") => void;
  metricMode: "rate" | "total";
  setMetricMode: (val: "rate" | "total") => void;
  selectedDeviceId: string;
  setSelectedDeviceId: (val: string) => void;
}) {
  const devicesWithPorts = legacyDevices.filter(
    (d) => d.port_table && d.port_table.length > 0,
  );

  const activeDevice =
    devicesWithPorts.find((d) => d.mac === selectedDeviceId) ||
    devicesWithPorts[0];

  const isRate = metricMode === "rate";

  // Build chart data
  let chartData: any[] = [];
  if (viewMode === "devices") {
    chartData = legacyDevices.map((device) => {
      const downRate =
        device.uplink?.["rx_bytes-r"] ??
        device.port_table?.reduce((acc, p) => acc + (p["rx_bytes-r"] ?? 0), 0) ??
        0;
      const upRate =
        device.uplink?.["tx_bytes-r"] ??
        device.port_table?.reduce((acc, p) => acc + (p["tx_bytes-r"] ?? 0), 0) ??
        0;
      const downBytes = device.uplink?.rx_bytes ?? device.rx_bytes ?? 0;
      const upBytes = device.uplink?.tx_bytes ?? device.tx_bytes ?? 0;

      const downVal = isRate ? (downRate * 8) / 1_000_000 : downBytes / 1_000_000_000;
      const upVal = isRate ? (upRate * 8) / 1_000_000 : upBytes / 1_000_000_000;

      return {
        name: device.name || device.model || device.mac,
        Download: parseFloat(downVal.toFixed(2)),
        Upload: parseFloat(upVal.toFixed(2)),
        rawDown: isRate ? downRate : downBytes,
        rawUp: isRate ? upRate : upBytes,
      };
    });
  } else {
    const ports = activeDevice?.port_table ?? [];
    chartData = ports.map((port) => {
      const downRate = port["rx_bytes-r"] ?? 0;
      const upRate = port["tx_bytes-r"] ?? 0;
      const downBytes = port.rx_bytes ?? 0;
      const upBytes = port.tx_bytes ?? 0;

      const downVal = isRate ? (downRate * 8) / 1_000_000 : downBytes / 1_000_000_000;
      const upVal = isRate ? (upRate * 8) / 1_000_000 : upBytes / 1_000_000_000;

      return {
        name: port.name || `Port ${port.port_idx}`,
        up: port.up,
        Download: parseFloat(downVal.toFixed(2)),
        Upload: parseFloat(upVal.toFixed(2)),
        rawDown: isRate ? downRate : downBytes,
        rawUp: isRate ? upRate : upBytes,
      };
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const downVal = isRate ? formatRate(data.rawDown) : formatBytes(data.rawDown);
      const upVal = isRate ? formatRate(data.rawUp) : formatBytes(data.rawUp);

      return (
        <div className="border border-border bg-card/95 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
          {data.hasOwnProperty("up") && (
            <div className="mb-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  data.up ? "bg-emerald-500" : "bg-muted-foreground/30",
                )}
              />
              <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                {data.up ? "Connected" : "Disconnected"}
              </span>
            </div>
          )}
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-sky-500 dark:text-sky-400">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                Download
              </span>
              <span className="font-mono font-medium text-foreground/90">{downVal}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-violet-500 dark:text-violet-400">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-400" />
                Upload
              </span>
              <span className="font-mono font-medium text-foreground/90">{upVal}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const hasNoData = chartData.length === 0;

  return (
    <Card className="border bg-card/50 backdrop-blur-xl">
      <CardHeader className="flex flex-col gap-3 space-y-0 pb-1.5 pt-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div>
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {viewMode === "devices" ? "Device Throughput" : "Port Throughput"}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground/80">
              {isRate
                ? "Real-time active bandwidth rates"
                : "Total data transferred since device boot"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 border border-border rounded-lg bg-muted/50 p-0.5">
            <button
              onClick={() => setViewMode("devices")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 cursor-pointer",
                viewMode === "devices"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Devices
            </button>
            <button
              onClick={() => setViewMode("ports")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 cursor-pointer",
                viewMode === "ports"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Ports
            </button>
          </div>

          {/* Metric mode toggle */}
          <div className="flex items-center gap-0.5 border border-border rounded-lg bg-muted/50 p-0.5">
            <button
              onClick={() => setMetricMode("rate")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 cursor-pointer",
                metricMode === "rate"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Active Rate
            </button>
            <button
              onClick={() => setMetricMode("total")}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all duration-200 cursor-pointer",
                metricMode === "total"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Total Data
            </button>
          </div>

          {/* Device selector dropdown for port view */}
          {viewMode === "ports" && devicesWithPorts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[10px] font-medium"
                >
                  {activeDevice?.name || activeDevice?.model || "Select Switch"}
                  <ChevronDown className="ml-1 h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-56 w-48 overflow-y-auto">
                {devicesWithPorts.map((d) => (
                  <DropdownMenuItem
                    key={d.mac}
                    onClick={() => setSelectedDeviceId(d.mac)}
                    className={cn(
                      "text-xs flex items-center justify-between",
                      d.mac === activeDevice?.mac && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span>{d.name || d.model}</span>
                    <span className="font-mono text-[9px] opacity-40">{d.mac}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3 pl-0 pr-3 pt-1.5">
        {hasNoData ? (
          <div className="flex h-52 items-center justify-center text-xs text-muted-foreground">
            No statistics available for this view.
          </div>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="barDown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="barUp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted-foreground)", opacity: 0.8, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", opacity: 0.8, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v) => (isRate ? `${v}M` : `${v}G`)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                <Bar dataKey="Download" fill="url(#barDown)" radius={[3, 3, 0, 0]} maxBarSize={30} />
                <Bar dataKey="Upload" fill="url(#barUp)" radius={[3, 3, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
    <Card className="group relative overflow-hidden border bg-card/50 backdrop-blur-xl transition-colors hover:bg-card/85">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-3 pb-1.5 pt-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-7 w-7 items-center justify-center rounded-md bg-muted">
            <Router className="h-3.5 w-3.5 text-muted-foreground" />
            <span
              className={cn(
                "absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-background",
                online ? "bg-emerald-400" : "bg-muted-foreground/30",
              )}
            >
              {online && (
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60" />
              )}
            </span>
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-[13px] font-medium leading-tight text-foreground">
              {device.name}
            </CardTitle>
            <p className="truncate text-[11px] text-muted-foreground">{device.model}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground">
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
              className="text-red-500 focus:text-red-500 dark:text-red-400 dark:focus:text-red-400"
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
                ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {online ? (
              <Wifi className="mr-1 h-2.5 w-2.5" />
            ) : (
              <WifiOff className="mr-1 h-2.5 w-2.5" />
            )}
            {device.state}
          </Badge>
          <span className="font-mono text-muted-foreground">{device.ipAddress}</span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Firmware</span>
          <span className="font-mono text-foreground/80">
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
  const tone = pct > 85 ? "bg-red-500 dark:bg-red-400" : pct > 65 ? "bg-amber-500 dark:bg-amber-400" : "bg-emerald-500 dark:bg-emerald-400";
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
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
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-lg" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}