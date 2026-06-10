// lib/proxmox.ts
// All Proxmox API calls live here. Configure via .env:
//   PROXMOX_BASE_URL=https://192.168.1.10:8006
//   PROXMOX_API_KEY=PVEAPIToken=user@pam!tokenid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

const BASE_URL = process.env.PROXMOX_BASE_URL?.replace(/\/$/, "");
const API_KEY  = process.env.PROXMOX_API_KEY;

if (!BASE_URL || !API_KEY) {
  console.warn("[proxmox] PROXMOX_BASE_URL or PROXMOX_API_KEY is not set.");
}

// ── Raw fetch helper ───────────────────────────────────────────────────────
async function proxmoxFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/api2/json${path}`, {
    headers: { Authorization: API_KEY! },
    // Proxmox uses self-signed certs by default — set NODE_TLS_REJECT_UNAUTHORIZED=0
    // in .env.local if needed, or point at a trusted cert.
    next: { revalidate: 5 }, // cache 30 s — adjust to taste
  });

  if (!res.ok) {
    throw new Error(`Proxmox API error ${res.status} on ${path}: ${await res.text()}`);
  }

  const json = await res.json();
  return json.data as T;
}

// ── Types ──────────────────────────────────────────────────────────────────
export type PveNode = {
  node: string;
  status: "online" | "offline" | string;
  cpu: number;        // fraction 0–1
  maxcpu: number;
  mem: number;        // bytes used
  maxmem: number;
  disk: number;       // bytes used (root fs)
  maxdisk: number;
  uptime: number;     // seconds
};

export type PveGuest = {
  vmid: number;
  name: string;
  status: "running" | "stopped" | string;
  type: "qemu" | "lxc";
  node: string;
  cpu?: number;
  mem?: number;
  maxmem?: number;
  uptime?: number;
  netin?: number;
  netout?: number;
};

export type PveStorage = {
  storage: string;
  node: string;
  type: string;
  used: number;
  total: number;
  avail: number;
  active: number;
  enabled: number;
  shared: number;
};

export type ClusterSummary = {
  nodes: PveNode[];
  guests: PveGuest[];
  storage: PveStorage[];
  // Derived totals
  totalVMs: number;
  runningVMs: number;
  totalLXC: number;
  runningLXC: number;
  cpuUsage: number;       // avg across nodes (0–100)
  memUsedBytes: number;
  memTotalBytes: number;
  diskUsedBytes: number;
  diskTotalBytes: number;
  netInBytes: number;
  netOutBytes: number;
};

// ── API calls ──────────────────────────────────────────────────────────────
export async function getNodes(): Promise<PveNode[]> {
  return proxmoxFetch<PveNode[]>("/nodes");
}

export async function getGuestsForNode(node: string): Promise<PveGuest[]> {
  const [vms, lxcs] = await Promise.all([
    proxmoxFetch<PveGuest[]>(`/nodes/${node}/qemu`).then((list) =>
      list.map((g) => ({ ...g, type: "qemu" as const, node }))
    ),
    proxmoxFetch<PveGuest[]>(`/nodes/${node}/lxc`).then((list) =>
      list.map((g) => ({ ...g, type: "lxc" as const, node }))
    ),
  ]);
  return [...vms, ...lxcs];
}

export async function getStorageForNode(node: string): Promise<PveStorage[]> {
  return proxmoxFetch<PveStorage[]>(`/nodes/${node}/storage`).then((list) =>
    list.map((s) => ({ ...s, node }))
  );
}

// ── Aggregated summary (used by the dashboard page) ───────────────────────
export async function getClusterSummary(): Promise<ClusterSummary> {
  const nodes = await getNodes();

  const [allGuests, allStorage] = await Promise.all([
    Promise.all(nodes.map((n) => getGuestsForNode(n.node))).then((r) => r.flat()),
    Promise.all(nodes.map((n) => getStorageForNode(n.node))).then((r) => r.flat()),
  ]);

  const vms  = allGuests.filter((g) => g.type === "qemu");
  const lxcs = allGuests.filter((g) => g.type === "lxc");

  const onlineNodes = nodes.filter((n) => n.status === "online");
  const cpuUsage =
    onlineNodes.length > 0
      ? (onlineNodes.reduce((s, n) => s + n.cpu, 0) / onlineNodes.length) * 100
      : 0;

  const memUsedBytes  = nodes.reduce((s, n) => s + n.mem, 0);
  const memTotalBytes = nodes.reduce((s, n) => s + n.maxmem, 0);

  // Deduplicate shared storage by storage name to avoid double-counting
  const seenStorage = new Set<string>();
  const uniqueStorage = allStorage.filter((s) => {
    if (s.shared && seenStorage.has(s.storage)) return false;
    seenStorage.add(s.storage);
    return true;
  });
  const diskUsedBytes  = uniqueStorage.reduce((s, st) => s + st.used, 0);
  const diskTotalBytes = uniqueStorage.reduce((s, st) => s + st.total, 0);

  const netInBytes  = allGuests.reduce((s, g) => s + (g.netin  ?? 0), 0);
  const netOutBytes = allGuests.reduce((s, g) => s + (g.netout ?? 0), 0);

  return {
    nodes,
    guests: allGuests,
    storage: allStorage,
    totalVMs:    vms.length,
    runningVMs:  vms.filter((g) => g.status === "running").length,
    totalLXC:    lxcs.length,
    runningLXC:  lxcs.filter((g) => g.status === "running").length,
    cpuUsage,
    memUsedBytes,
    memTotalBytes,
    diskUsedBytes,
    diskTotalBytes,
    netInBytes,
    netOutBytes,
  };
}