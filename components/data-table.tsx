"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  GripVerticalIcon,
  Columns3Icon,
  ChevronDownIcon,
  ChevronsLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsRightIcon,
  RefreshCwIcon,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

interface ProxmoxResource {
  id: string
  type: string
  vmid?: number
  name?: string
  node: string
  status: string
  cpu?: number
  maxcpu?: number
  mem?: number
  maxmem?: number
  disk?: number
  maxdisk?: number
  netin?: number
  netout?: number
  diskread?: number
  diskwrite?: number
  uptime?: number
  tags?: string
  storage?: string
  plugintype?: string
  content?: string
  shared?: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes >= 1099511627776) return (bytes / 1099511627776).toFixed(1) + " TB"
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB"
  if (bytes >= 1048576) return Math.round(bytes / 1048576) + " MB"
  return Math.round(bytes / 1024) + " KB"
}

function formatUptime(seconds: number) {
  if (!seconds) return "—"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function pct(used?: number, max?: number) {
  if (!used || !max) return 0
  return Math.round((used / max) * 100)
}

function displayName(r: ProxmoxResource) {
  if (r.name) return r.name.replace(/\..*/, "")
  if (r.storage) return r.storage
  return r.id
}

function typeLabel(type: string) {
  return { lxc: "LXC", qemu: "VM", node: "Node", storage: "Storage", network: "Network" }[type] ?? type
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "running" || status === "online" || status === "available" || status === "ok") return "default"
  if (status === "stopped") return "secondary"
  return "destructive"
}

function MiniBar({ value, max, color }: { value?: number; max?: number; color: string }) {
  const p = pct(value, max)
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${p}%`, background: color }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{p}%</span>
    </div>
  )
}

const POLL_INTERVAL = 15_000

// ── Drag handle ────────────────────────────────────────────────────────────

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button {...attributes} {...listeners} variant="ghost" size="icon" className="size-7 text-muted-foreground hover:bg-transparent">
      <GripVerticalIcon className="size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// ── Columns ────────────────────────────────────────────────────────────────

const columns: ColumnDef<ProxmoxResource>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableHiding: false,
    filterFn: (row, _, value) =>
      displayName(row.original).toLowerCase().includes(value.toLowerCase()),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground font-mono text-xs">
        {typeLabel(row.original.type)}
      </Badge>
    ),
  },
  {
    accessorKey: "node",
    header: "Node",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{row.original.node}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status)} className="px-1.5 text-xs capitalize">
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "cpu",
    header: "CPU",
    cell: ({ row }) => {
      const r = row.original
      if (r.type === "storage" || r.type === "network") return <span className="text-xs text-muted-foreground">—</span>
      return <MiniBar value={r.cpu ? r.cpu * 100 : 0} max={100} color="#3b82f6" />
    },
  },
  {
    accessorKey: "mem",
    header: "Memory",
    cell: ({ row }) => {
      const r = row.original
      if (!r.maxmem) return <span className="text-xs text-muted-foreground">—</span>
      return <MiniBar value={r.mem} max={r.maxmem} color="#10b981" />
    },
  },
  {
    accessorKey: "disk",
    header: "Disk",
    cell: ({ row }) => {
      const r = row.original
      if (!r.maxdisk) return <span className="text-xs text-muted-foreground">—</span>
      return <MiniBar value={r.disk} max={r.maxdisk} color="#f59e0b" />
    },
  },
  {
    accessorKey: "uptime",
    header: "Uptime",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.uptime ? formatUptime(row.original.uptime) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "maxmem",
    header: "RAM",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.maxmem ? formatBytes(row.original.maxmem) : "—"}
      </span>
    ),
  },
]

// ── Draggable row ──────────────────────────────────────────────────────────

function DraggableRow({ row }: { row: Row<ProxmoxResource> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

// ── Main DataTable ─────────────────────────────────────────────────────────

export function DataTable() {
  const [data, setData] = React.useState<ProxmoxResource[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 15 })
  const sortableId = React.useId()

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/proxmox/resources")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json.data ?? json)
      setLastUpdated(new Date())
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  const filteredData = React.useMemo(() => {
    if (typeFilter === "all") return data
    if (typeFilter === "vm") return data.filter((d) => d.type === "lxc" || d.type === "qemu")
    return data.filter((d) => d.type === typeFilter)
  }, [data, typeFilter])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData.map((d) => d.id),
    [filteredData]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnVisibility, columnFilters, pagination },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((prev) => {
        const oldIndex = prev.findIndex((d) => d.id === active.id)
        const newIndex = prev.findIndex((d) => d.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter by name…"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
            className="h-8 w-48"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-36" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="vm">VMs &amp; LXC</SelectItem>
                <SelectItem value="node">Nodes</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="network">Network</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="hidden text-xs text-muted-foreground lg:block">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCwIcon className="size-3.5" />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3Icon className="size-3.5" />
                Columns
                <ChevronDownIcon className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && <p className="px-4 text-sm text-destructive lg:px-6">Error: {error}</p>}
      {loading && <p className="px-4 text-sm text-muted-foreground lg:px-6">Loading…</p>}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border mx-4 lg:mx-6">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {loading ? "Loading…" : "No resources found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="text-sm text-muted-foreground">
          {filteredData.length} resource{filteredData.length !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 15, 20, 50].map((s) => (
                    <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <ChevronsLeftIcon className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRightIcon className="size-4" />
            </Button>
            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <ChevronsRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Drawer detail view ─────────────────────────────────────────────────────

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"]

function TableCellViewer({ item }: { item: ProxmoxResource }) {
  const isMobile = useIsMobile()
  const [history, setHistory] = React.useState<{ time: string; cpu: number; mem: number; disk: number }[]>([])

  React.useEffect(() => {
    if (!item.maxmem) return
    const point = {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      cpu: parseFloat(((item.cpu ?? 0) * 100).toFixed(1)),
      mem: pct(item.mem, item.maxmem),
      disk: pct(item.disk, item.maxdisk),
    }
    setHistory((prev) => {
      const next = [...prev, point]
      return next.length > 20 ? next.slice(-20) : next
    })
  }, [item])

  const chartConfig: ChartConfig = {
    cpu: { label: "CPU %", color: COLORS[0] },
    mem: { label: "RAM %", color: COLORS[1] },
    disk: { label: "Disk %", color: COLORS[2] },
  }

  const stats: { label: string; value: string }[] = [
    { label: "Node", value: item.node },
    { label: "Type", value: typeLabel(item.type) },
    { label: "Status", value: item.status },
    ...(item.vmid ? [{ label: "VMID", value: String(item.vmid) }] : []),
    ...(item.maxcpu ? [{ label: "vCPUs", value: String(item.maxcpu) }] : []),
    ...(item.maxmem ? [{ label: "RAM", value: formatBytes(item.maxmem) }] : []),
    ...(item.maxdisk ? [{ label: "Disk", value: formatBytes(item.maxdisk) }] : []),
    ...(item.uptime ? [{ label: "Uptime", value: formatUptime(item.uptime) }] : []),
    ...(item.netin ? [{ label: "Net in", value: formatBytes(item.netin) }] : []),
    ...(item.netout ? [{ label: "Net out", value: formatBytes(item.netout) }] : []),
    ...(item.diskread ? [{ label: "Disk read", value: formatBytes(item.diskread) }] : []),
    ...(item.diskwrite ? [{ label: "Disk write", value: formatBytes(item.diskwrite) }] : []),
    ...(item.tags ? [{ label: "Tags", value: item.tags.replace(/;/g, ", ") }] : []),
    ...(item.plugintype ? [{ label: "Plugin", value: item.plugintype }] : []),
    ...(item.content ? [{ label: "Content", value: item.content }] : []),
  ]

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="w-fit px-0 text-left text-foreground">
          {displayName(item)}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{displayName(item)}</DrawerTitle>
          <DrawerDescription>{item.id}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && history.length >= 2 && (item.type === "lxc" || item.type === "qemu" || item.type === "node") && (
            <>
              <ChartContainer config={chartConfig} className="h-[160px] w-full">
                <AreaChart data={history} margin={{ left: 0, right: 8 }}>
                  <defs>
                    {(["cpu", "mem", "disk"] as const).map((key, i) => (
                      <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} hide />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={36} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" formatter={(v) => `${v}%`} />} />
                  {(["cpu", "mem", "disk"] as const).map((key, i) => (
                    <Area key={key} dataKey={key} type="monotone" fill={`url(#fill-${key})`} stroke={COLORS[i]} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  ))}
                </AreaChart>
              </ChartContainer>
              <Separator />
            </>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {stats.map(({ label, value }) => (
              <div key={label} className="flex flex-col">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-sm font-medium truncate" title={value}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}