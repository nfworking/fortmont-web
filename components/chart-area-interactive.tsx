"use client"

import * as React from "react"
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Activity,
  Cpu,
  MemoryStick,
  Server,
  TrendingUp,
  RefreshCw,
} from "lucide-react"

interface ProxmoxResource {
  type: string
  vmid: number
  name: string
  mem: number
  maxmem: number
  cpu: number
  maxcpu: number
  netin: number
  netout: number
  diskread: number
  diskwrite: number
  disk: number
  maxdisk: number
  status: string
  node: string
}

type TimePoint = {
  time: string
  [key: string]: number | string
}

const POLL_INTERVAL = 10_000
const MAX_POINTS = 40

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#f97316",
  "#84cc16",
]

function shortName(name: string, vmid: number) {
  return (name ?? `vmid-${vmid}`).replace(/\..*/, "")
}

function formatBytes(bytes: number) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB"
  if (bytes >= 1048576) return Math.round(bytes / 1048576) + " MB"
  return Math.round(bytes / 1024) + " KB"
}

interface NodeStats {
  totalRam: number
  maxRam: number
  totalCpu: number
  maxCpu: number
  runningVms: number
  totalVms: number
}

// ── Small stat card, matching SectionCards/SystemStatusPanel language ──────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  accent?: string
}) {
  return (
    <Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur-sm">
      <CardHeader className="gap-1">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted-foreground" />
          <CardDescription className="text-xs">{label}</CardDescription>
        </div>
        <CardTitle className={cn("text-2xl tabular-nums", accent)}>{value}</CardTitle>
        <CardDescription className="text-[11px] text-muted-foreground/80">{sub}</CardDescription>
      </CardHeader>
    </Card>
  )
}

export function ChartAreaInteractive() {
  const [netHistory, setNetHistory] = React.useState<TimePoint[]>([])
  const [vmNames, setVmNames] = React.useState<string[]>([])
  const [nodeStats, setNodeStats] = React.useState<NodeStats | null>(null)
  const [topMemVm, setTopMemVm] = React.useState<{ name: string; pct: number } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)
  const prevNetRef = React.useRef<Record<string, { netin: number; netout: number }>>({})
  const prevTimeRef = React.useRef<number>(0)

  const fetchAndAppend = React.useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch("/api/proxmox/resources")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const all: ProxmoxResource[] = json.data ?? json

      const vms = all.filter(
        (d) => (d.type === "lxc" || d.type === "qemu") && d.status === "running"
      )
      const nodes = all.filter((d) => d.type === "node")

      const totalRam = nodes.reduce((s, n) => s + (n.mem ?? 0), 0)
      const maxRam = nodes.reduce((s, n) => s + (n.maxmem ?? 0), 0)
      const totalCpu = nodes.reduce((s, n) => s + (n.cpu ?? 0) * (n.maxcpu ?? 1), 0)
      const maxCpu = nodes.reduce((s, n) => s + (n.maxcpu ?? 0), 0)
      const runningVms = vms.length
      const totalVms = all.filter((d) => d.type === "lxc" || d.type === "qemu").length

      setNodeStats({ totalRam, maxRam, totalCpu, maxCpu, runningVms, totalVms })

      const sorted = [...vms].sort((a, b) => b.mem / b.maxmem - a.mem / a.maxmem)
      if (sorted.length > 0) {
        setTopMemVm({
          name: shortName(sorted[0].name, sorted[0].vmid),
          pct: Math.round((sorted[0].mem / sorted[0].maxmem) * 100),
        })
      }

      const names = vms.map((d) => shortName(d.name, d.vmid))
      setVmNames(names)

      const now = Date.now()
      const elapsed = prevTimeRef.current ? (now - prevTimeRef.current) / 1000 : null
      prevTimeRef.current = now

      const timeLabel = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })

      const netPoint: TimePoint = { time: timeLabel }
      for (const vm of vms) {
        const key = String(vm.vmid)
        const prev = prevNetRef.current[key]
        if (prev && elapsed) {
          const inRate = Math.max(0, (vm.netin - prev.netin) / elapsed)
          const outRate = Math.max(0, (vm.netout - prev.netout) / elapsed)
          netPoint[shortName(vm.name, vm.vmid) + "_in"] = parseFloat((inRate / 1024).toFixed(1))
          netPoint[shortName(vm.name, vm.vmid) + "_out"] = parseFloat((outRate / 1024).toFixed(1))
        }
        prevNetRef.current[key] = { netin: vm.netin, netout: vm.netout }
      }

      if (elapsed) {
        setNetHistory((prev) => {
          const next = [...prev, netPoint]
          return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next
        })
      }

      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      if (manual) setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAndAppend()
    const id = setInterval(fetchAndAppend, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchAndAppend])

  const netConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    vmNames.forEach((name, i) => {
      config[name + "_in"] = { label: `${name} ↓`, color: COLORS[i % COLORS.length] }
      config[name + "_out"] = { label: `${name} ↑`, color: COLORS[i % COLORS.length] }
    })
    return config
  }, [vmNames])

  const ramPct = nodeStats ? Math.round((nodeStats.totalRam / nodeStats.maxRam) * 100) : 0
  const cpuPct = nodeStats ? Math.round((nodeStats.totalCpu / nodeStats.maxCpu) * 100) : 0
  const hasData = netHistory.length >= 2

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 @xl/card:grid-cols-4">
        <StatCard
          icon={MemoryStick}
          label="Cluster RAM"
          value={nodeStats ? `${ramPct}%` : "—"}
          sub={nodeStats ? `${formatBytes(nodeStats.totalRam)} / ${formatBytes(nodeStats.maxRam)}` : "Loading…"}
          accent={ramPct > 80 ? "text-red-500" : ramPct > 60 ? "text-amber-500" : undefined}
        />
        <StatCard
          icon={Cpu}
          label="Cluster CPU"
          value={nodeStats ? `${cpuPct}%` : "—"}
          sub={nodeStats ? `Across ${nodeStats.maxCpu} cores` : "Loading…"}
          accent={cpuPct > 80 ? "text-red-500" : cpuPct > 60 ? "text-amber-500" : undefined}
        />
        <StatCard
          icon={Server}
          label="VMs Running"
          value={nodeStats ? `${nodeStats.runningVms}` : "—"}
          sub={nodeStats ? `of ${nodeStats.totalVms} total` : "Loading…"}
        />
        <StatCard
          icon={TrendingUp}
          label="Top Mem User"
          value={topMemVm ? `${topMemVm.pct}%` : "—"}
          sub={topMemVm?.name ?? "Loading…"}
          accent={topMemVm && topMemVm.pct > 85 ? "text-red-500" : undefined}
        />
      </div>

      {/* Network throughput chart */}
      <Card className="@container/card border-border/60 bg-card/90 shadow-sm backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Network Throughput</CardTitle>
          </div>
          <CardDescription className="text-xs">
            KB/s in / out per VM · dashed line = upload
          </CardDescription>
          <CardAction className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              {hasData ? "Live" : "Collecting"}
            </Badge>
            <button
              onClick={() => fetchAndAppend(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Refresh chart"
            >
              <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            </button>
          </CardAction>
        </CardHeader>

        <CardContent className="px-2 pt-2 sm:px-6">
          {!hasData ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-border/50 bg-background/40">
              <p className="text-sm text-muted-foreground">Collecting data…</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 bg-background/40 p-3">
              <ChartContainer config={netConfig} className="aspect-auto h-55 w-full">
                <LineChart data={netHistory}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} minTickGap={48} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v) => `${v} KB/s`}
                    width={72}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => v}
                        formatter={(v) => `${v} KB/s`}
                        indicator="dot"
                      />
                    }
                  />
                  {vmNames.map((name, i) => (
                    <React.Fragment key={name}>
                      <Line
                        dataKey={name + "_in"}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        dataKey={name + "_out"}
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </React.Fragment>
                  ))}
                </LineChart>
              </ChartContainer>
              <Legend names={vmNames} dashed />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Legend({ names, dashed }: { names: string[]; dashed?: boolean }) {
  if (names.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/40 pt-3">
      {names.map((name, i) => (
        <span key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block h-0.5 w-4 rounded"
            style={
              dashed
                ? { borderTop: `2px dashed ${COLORS[i % COLORS.length]}` }
                : { background: COLORS[i % COLORS.length] }
            }
          />
          {name}
          {dashed ? " ↓/↑" : ""}
        </span>
      ))}
    </div>
  )
}