// app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  Server, Container, ShieldCheck, Globe, Users,
  Activity, Cpu, HardDrive, Wifi, AlertCircle,
  CheckCircle2, XCircle, RefreshCw,
} from "lucide-react";
import type { ClusterSummary, PveNode } from "@/lib/proxmox";

const POLL_INTERVAL = 5_000; // ms

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
function QuickLink({ icon, label, description }: { icon: ReactNode; label: string; description: string }) {
  return (
    <GlassCard className="group flex cursor-pointer items-start gap-4 p-5 transition-all duration-200 hover:bg-white/20 hover:shadow-xl">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="mt-0.5 text-xs text-white/50">{description}</p>
      </div>
    </GlassCard>
  );
}

// ── Polling hook ───────────────────────────────────────────────────────────
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

// ── Page ───────────────────────────────────────────────────────────────────
const LINKS = [
  { icon: <Server className="h-5 w-5" />,      label: "Server Registry",  description: "Browse and manage physical hosts" },
  { icon: <Container className="h-5 w-5" />,   label: "LXC Registry",     description: "Inspect running containers" },
  { icon: <ShieldCheck className="h-5 w-5" />, label: "SSL Certificates", description: "View expiry and renewal status" },
  { icon: <Globe className="h-5 w-5" />,        label: "DNS Records",      description: "Manage zones and records" },
  { icon: <Users className="h-5 w-5" />,        label: "Site Users",       description: "Access control and roles" },
  { icon: <Activity className="h-5 w-5" />,     label: "Proxy",            description: "Reverse proxy routes" },
];

export default function DashboardPage() {
  const { data, error, lastFetch, spinning, refresh } = useClusterSummary();

  const memPct  = data ? (data.memUsedBytes  / data.memTotalBytes)  * 100 : 0;
  const diskPct = data ? (data.diskUsedBytes / data.diskTotalBytes) * 100 : 0;

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
              onClick={refresh}
              disabled={spinning}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/50 backdrop-blur-md transition hover:bg-white/20 hover:text-white disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* API error */}
        {error && (
          <GlassCard className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-white">Could not reach Proxmox API</p>
              <p className="mt-0.5 text-xs text-white/50">{error}</p>
            </div>
          </GlassCard>
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

          {/* Quick links */}
          <div className={`space-y-3 ${data?.nodes.length ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Quick access</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {LINKS.map((l) => <QuickLink key={l.label} {...l} />)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}