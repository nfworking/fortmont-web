"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  Server, Container, ShieldCheck, Globe, Users,
  Activity, Cpu, HardDrive, Wifi, AlertCircle,
  CheckCircle2, XCircle, RefreshCw,
  ArrowUpRight, AppWindow
} from "lucide-react";
import type { ClusterSummary, PveNode } from "@/lib/proxmox";

const POLL_INTERVAL = 5_000; // ms

// Type definitions for the Compose API response matching backend payload
interface ComposeApp {
  label: string;
  description: string;
  url?: string;
  icon?: string;
  status?: "online" | "offline"; // Live response field from backend check
}

// ── Formatters ─────────────────────────────────────────────────────────────
function fmtBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
function fmtPct(value: number): string { return `${value.toFixed(1)}%`; }
function fmtUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ── Glass card ─────────────────────────────────────────────────────────────
function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md backdrop-saturate-150 ${className}`}>
      {children}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent = "text-white" }: {
  icon: ReactNode; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{label}</span>
        <span className="text-white/40">{icon}</span>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </GlassCard>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────
function UsageBar({ pct, colour }: { pct: number; colour: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${colour} transition-all duration-500`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

// ── Node row ───────────────────────────────────────────────────────────────
function NodeRow({ node }: { node: PveNode }) {
  const cpuPct  = node.cpu * 100;
  const memPct  = node.maxmem  > 0 ? (node.mem  / node.maxmem)  * 100 : 0;
  const diskPct = node.maxdisk > 0 ? (node.disk / node.maxdisk) * 100 : 0;
  const online  = node.status === "online";
  return (
    <div className="space-y-2 rounded-xl px-1 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {online
            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            : <XCircle      className="h-3.5 w-3.5 text-red-400" />}
          <span className="font-semibold text-white">{node.node}</span>
        </div>
        <span className="text-xs text-white/40">up {fmtUptime(node.uptime)}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-xs text-white/50">
        {([
          { label: "CPU",  pct: cpuPct,  colour: cpuPct  > 80 ? "bg-red-400" : cpuPct  > 60 ? "bg-amber-400" : "bg-emerald-400" },
          { label: "MEM",  pct: memPct,  colour: memPct  > 80 ? "bg-red-400" : memPct  > 60 ? "bg-amber-400" : "bg-sky-400"     },
          { label: "DISK", pct: diskPct, colour: "bg-violet-400" },
        ] as const).map(({ label, pct, colour }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between">
              <span>{label}</span>
              <span className="text-white/70">{fmtPct(pct)}</span>
            </div>
            <UsageBar pct={pct} colour={colour} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick link ─────────────────────────────────────────────────────────────
function QuickLink({ 
  icon, 
  label, 
  description, 
  url, 
  status 
}: { 
  icon: ReactNode; 
  label: string; 
  description: string; 
  url?: string; 
  status?: "online" | "offline";
}) {
  return (
    <GlassCard className="group relative flex cursor-pointer items-start gap-4 p-5 transition-all duration-200 hover:bg-white/20 hover:shadow-xl">
      
      {/* Live Pulsing Dot Status Indicator */}
      <div className="absolute right-4 top-4 flex h-2.5 w-2.5">
        {status === "online" && (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </>
        )}
        {status === "offline" && (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75 duration-1000"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
          </>
        )}
        {!status && (
          <span className="relative inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-white/20"></span>
        )}
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white">
        {icon}
      </div>
      <div className="pr-4">
        <p className="font-semibold text-white">{label}</p>
        <p className="mt-0.5 text-xs text-white/50">{description}</p>
        {url && (
          <a href={url} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky-400 opacity-0 transition-opacity group-hover:opacity-100">
            View
            <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </GlassCard>
  );
}

// ── Proxmox Polling hook ───────────────────────────────────────────────────
function useClusterSummary() {
  const [data,      setData]      = useState<ClusterSummary | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [spinning,  setSpinning]  = useState(false);

  const fetch_ = useCallback(async () => {
    setSpinning(true);
    try {
      const res = await fetch("/api/proxmox/summary");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setData(json.data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLastFetch(new Date());
      setSpinning(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetch_]);

  return { data, error, lastFetch, spinning, refresh: fetch_ };
}

// ── Compose Apps Polling Hook ──────────────────────────────────────────────
function useComposeApps() {
  const [apps, setApps] = useState<ComposeApp[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch("/api/operations/get/apps");
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch apps data");
      setApps(json.data ?? json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown API app payload error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
    const id = setInterval(fetchApps, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchApps]);

  return { apps, error, loading, refreshApps: fetchApps };
}

// Helper to gracefully assign UI icons depending on incoming API names
function getAppIcon(label: string) {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("registry") || lowerLabel.includes("host") || lowerLabel.includes("server")) {
    return <Server className="h-5 w-5" />;
  }
  if (lowerLabel.includes("lxc") || lowerLabel.includes("container") || lowerLabel.includes("docker")) {
    return <Container className="h-5 w-5" />;
  }
  if (lowerLabel.includes("ssl") || lowerLabel.includes("cert") || lowerLabel.includes("shield")) {
    return <ShieldCheck className="h-5 w-5" />;
  }
  if (lowerLabel.includes("dns") || lowerLabel.includes("zone") || lowerLabel.includes("globe")) {
    return <Globe className="h-5 w-5" />;
  }
  if (lowerLabel.includes("user") || lowerLabel.includes("member") || lowerLabel.includes("role")) {
    return <Users className="h-5 w-5" />;
  }
  if (lowerLabel.includes("proxy") || lowerLabel.includes("route") || lowerLabel.includes("activity")) {
    return <Activity className="h-5 w-5" />;
  }
  return <AppWindow className="h-5 w-5" />; // Generic default fallback
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data, error: clusterError, lastFetch, spinning, refresh: refreshCluster } = useClusterSummary();
  const { apps, error: appsError, loading: appsLoading, refreshApps } = useComposeApps();

  const memPct  = data ? (data.memUsedBytes  / data.memTotalBytes)  * 100 : 0;
  const diskPct = data ? (data.diskUsedBytes / data.diskTotalBytes) * 100 : 0;

  const handleManualRefresh = () => {
    refreshCluster();
    refreshApps();
  };

  return (
    <div className="min-h-screen bg-transparent px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-white/40">Fortmont infrastructure overview</p>
          </div>
          <div className="flex items-center gap-3">
            {lastFetch && (
              <span className="text-xs text-white/30">
                Updated {lastFetch.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleManualRefresh}
              disabled={spinning || appsLoading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/50 backdrop-blur-md transition hover:bg-white/20 hover:text-white disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${spinning || appsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* API errors */}
        {(clusterError || appsError) && (
          <div className="space-y-2">
            {clusterError && (
              <GlassCard className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <p className="font-semibold text-white">Could not reach Proxmox API</p>
                  <p className="mt-0.5 text-xs text-white/50">{clusterError}</p>
                </div>
              </GlassCard>
            )}
            {appsError && (
              <GlassCard className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <p className="font-semibold text-white">Could not fetch Compose Apps infrastructure</p>
                  <p className="mt-0.5 text-xs text-white/50">{appsError}</p>
                </div>
              </GlassCard>
            )}
          </div>
        )}

        {/* Stat grid — skeleton while loading */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {data ? (
            <>
              <StatCard icon={<Server className="h-4 w-4" />}   label="VMs Online"      value={`${data.runningVMs} / ${data.totalVMs}`}     sub={`${data.totalVMs  - data.runningVMs}  stopped`} />
              <StatCard icon={<Container className="h-4 w-4" />} label="LXC Containers"  value={String(data.runningLXC)}                      sub={`${data.totalLXC  - data.runningLXC}  stopped`} accent="text-emerald-300" />
              <StatCard icon={<Cpu className="h-4 w-4" />}       label="CPU Usage"       value={fmtPct(data.cpuUsage)}                        sub="Avg across nodes"  accent={data.cpuUsage > 80 ? "text-red-300" : data.cpuUsage > 60 ? "text-amber-300" : "text-white"} />
              <StatCard icon={<HardDrive className="h-4 w-4" />} label="Storage Used"    value={fmtBytes(data.diskUsedBytes)}                 sub={`of ${fmtBytes(data.diskTotalBytes)} · ${fmtPct(diskPct)}`} accent="text-sky-300" />
              <StatCard icon={<Wifi className="h-4 w-4" />}      label="Net In"          value={fmtBytes(data.netInBytes)}                    sub="Total across guests" />
              <StatCard icon={<Activity className="h-4 w-4" />}  label="Memory"          value={fmtPct(memPct)}                               sub={`${fmtBytes(data.memUsedBytes)} of ${fmtBytes(data.memTotalBytes)}`} accent={memPct > 80 ? "text-red-300" : memPct > 60 ? "text-amber-300" : "text-emerald-300"} />
            </>
          ) : (
            // Skeleton cards
            Array.from({ length: 6 }).map((_, i) => (
              <GlassCard key={i} className="flex flex-col gap-3 p-5">
                <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                <div className="h-8 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-2 w-16 animate-pulse rounded bg-white/10" />
              </GlassCard>
            ))
          )}
        </div>

        {/* Lower layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Node health */}
          {data && data.nodes.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Node health</p>
              <GlassCard className="divide-y divide-white/10 px-4">
                {data.nodes.map((n) => <NodeRow key={n.node} node={n} />)}
              </GlassCard>
            </div>
          )}

          {/* Quick links — dynamic from app compose API */}
          <div className={`space-y-3 ${data?.nodes.length ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Quick access</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {apps ? (
                apps.map((app) => (
                  <QuickLink 
                    key={app.label} 
                    label={app.label} 
                    description={app.description} 
                    url={app.url} 
                    icon={getAppIcon(app.label)} 
                    status={app.status}
                  />
                ))
              ) : (
                // Dynamic Apps Skeleton UI Loader
                Array.from({ length: 6 }).map((_, i) => (
                  <GlassCard key={i} className="flex items-start gap-4 p-5">
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-white/10" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}