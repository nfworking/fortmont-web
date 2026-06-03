"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

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

function formatMbps(bytesPerSec: number) {
  if (bytesPerSec >= 1048576) return (bytesPerSec / 1048576).toFixed(1) + " MB/s"
  if (bytesPerSec >= 1024) return Math.round(bytesPerSec / 1024) + " KB/s"
  return Math.round(bytesPerSec) + " B/s"
}

interface NodeStats {
  totalRam: number
  maxRam: number
  totalCpu: number
  maxCpu: number
  runningVms: number
  totalVms: number
}

export function ChartAreaInteractive() {
  const [cpuHistory, setCpuHistory] = React.useState<TimePoint[]>([])
  const [netHistory, setNetHistory] = React.useState<TimePoint[]>([])
  const [vmNames, setVmNames] = React.useState<string[]>([])
  const [nodeStats, setNodeStats] = React.useState<NodeStats | null>(null)
  const [topMemVm, setTopMemVm] = React.useState<{ name: string; pct: number } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const prevNetRef = React.useRef<Record<string, { netin: number; netout: number }>>({})
  const prevTimeRef = React.useRef<number>(0)

  const fetchAndAppend = React.useCallback(async () => {
    try {
      const res = await fetch("/api/proxmox/resources")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const all: ProxmoxResource[] = json.data ?? json

      const vms = all.filter(
        (d) => (d.type === "lxc" || d.type === "qemu") && d.status === "running"
      )
      const nodes = all.filter((d) => d.type === "node")

      // node stat cards
      const totalRam = nodes.reduce((s, n) => s + (n.mem ?? 0), 0)
      const maxRam = nodes.reduce((s, n) => s + (n.maxmem ?? 0), 0)
      const totalCpu = nodes.reduce((s, n) => s + (n.cpu ?? 0) * (n.maxcpu ?? 1), 0)
      const maxCpu = nodes.reduce((s, n) => s + (n.maxcpu ?? 0), 0)
      const runningVms = vms.length
      const totalVms = all.filter((d) => d.type === "lxc" || d.type === "qemu").length

      setNodeStats({ totalRam, maxRam, totalCpu, maxCpu, runningVms, totalVms })

      // top mem consumer
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

      // cpu point
      const cpuPoint: TimePoint = { time: timeLabel }
      for (const vm of vms) {
        cpuPoint[shortName(vm.name, vm.vmid)] = parseFloat(
          (vm.cpu * 100).toFixed(1)
        )
      }

      // net throughput point (diff from last poll)
      const netPoint: TimePoint = { time: timeLabel }
      for (const vm of vms) {
        const key = String(vm.vmid)
        const prev = prevNetRef.current[key]
        if (prev && elapsed) {
          const inRate = Math.max(0, (vm.netin - prev.netin) / elapsed)
          const outRate = Math.max(0, (vm.netout - prev.netout) / elapsed)
          netPoint[shortName(vm.name, vm.vmid) + "_in"] = parseFloat(
            (inRate / 1024).toFixed(1)
          )
          netPoint[shortName(vm.name, vm.vmid) + "_out"] = parseFloat(
            (outRate / 1024).toFixed(1)
          )
        }
        prevNetRef.current[key] = { netin: vm.netin, netout: vm.netout }
      }

      setCpuHistory((prev) => {
        const next = [...prev, cpuPoint]
        return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next
      })

      if (elapsed) {
        setNetHistory((prev) => {
          const next = [...prev, netPoint]
          return next.length > MAX_POINTS ? next.slice(-MAX_POINTS) : next
        })
      }

      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    }
  }, [])

  React.useEffect(() => {
    fetchAndAppend()
    const id = setInterval(fetchAndAppend, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchAndAppend])

  const cpuConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    vmNames.forEach((name, i) => {
      config[name] = { label: name, color: COLORS[i % COLORS.length] }
    })
    return config
  }, [vmNames])

  const netConfig = React.useMemo(() => {
    const config: ChartConfig = {}
    vmNames.forEach((name, i) => {
      config[name + "_in"] = { label: `${name} ↓`, color: COLORS[i % COLORS.length] }
      config[name + "_out"] = { label: `${name} ↑`, color: COLORS[i % COLORS.length] }
    })
    return config
  }, [vmNames])

  const ramPct = nodeStats
    ? Math.round((nodeStats.totalRam / nodeStats.maxRam) * 100)
    : 0
  const cpuPct = nodeStats
    ? Math.round((nodeStats.totalCpu / nodeStats.maxCpu) * 100)
    : 0

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-destructive">Error: {error}</p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 @xl/card:grid-cols-4">
        {[
          {
            label: "Cluster RAM",
            value: nodeStats ? `${ramPct}%` : "—",
            sub: nodeStats
              ? `${formatBytes(nodeStats.totalRam)} / ${formatBytes(nodeStats.maxRam)}`
              : "loading",
          },
          {
            label: "Cluster CPU",
            value: nodeStats ? `${cpuPct}%` : "—",
            sub: nodeStats ? `across ${nodeStats.maxCpu} cores` : "loading",
          },
          {
            label: "VMs running",
            value: nodeStats ? `${nodeStats.runningVms}` : "—",
            sub: nodeStats ? `of ${nodeStats.totalVms} total` : "loading",
          },
          {
            label: "Top mem user",
            value: topMemVm ? `${topMemVm.pct}%` : "—",
            sub: topMemVm?.name ?? "loading",
          },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-lg bg-muted/50 p-4"
          >
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-medium">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* CPU chart */}
      
      {/* Network throughput chart */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Network throughput</CardTitle>
          <CardDescription>KB/s in/out per VM · dashed = upload</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {netHistory.length < 2 ? (
            <p className="text-sm text-muted-foreground py-4">Collecting data…</p>
          ) : (
            <>
              <ChartContainer config={netConfig} className="aspect-auto h-[220px] w-full">
                <LineChart data={netHistory}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} minTickGap={48} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `${v} KB/s`} width={72} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent labelFormatter={(v) => v} formatter={(v) => `${v} KB/s`} indicator="dot" />}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Legend({ names, dashed }: { names: string[]; dashed?: boolean }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
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
          {name}{dashed ? " ↓/↑" : ""}
        </span>
      ))}
    </div>
  )
}