/**
 * Types for the UniFi Network Integration API (local, v1)
 * Docs: https://developer.ui.com/network/v10.3.58/llms.txt
 *
 * All list endpoints return: { count, data: T[], limit, offset, totalCount }
 * All detail endpoints return the resource directly.
 * Local base URL: https://<console-host>/proxy/network/integration/v1
 * Auth header:    X-API-KEY: <key>
 */

export interface UnifiPage<T> {
  count: number;
  data: T[];
  limit: number;
  offset: number;
  totalCount: number;
}

export interface UnifiAppInfo {
  applicationVersion: string;
}

export interface UnifiSite {
  id: string;
  name: string;
  internalReference?: string;
}

export type UnifiDeviceState =
  | "ONLINE"
  | "OFFLINE"
  | "PENDING_ADOPTION"
  | "UPDATING"
  | "PROVISIONING"
  | "UNKNOWN"
  | (string & {});

export interface UnifiDeviceInterfaceOverview {
  type?: string;
  name?: string;
}

export interface UnifiDeviceOverview {
  id: string;
  name: string;
  model: string;
  supported: boolean;
  macAddress: string;
  ipAddress: string;
  state: UnifiDeviceState;
  firmwareVersion?: string;
  firmwareUpdatable: boolean;
  adoptedAt?: string;
  provisionedAt?: string;
  configurationId: string;
  uplink?: UnifiDeviceInterfaceOverview;
  features?: string[];
  interfaces?: string[];
}

export interface UnifiDeviceStatistics {
  uptimeSec: number;
  lastHeartbeatAt: string;
  nextHeartbeatAt: string;
  loadAverage1Min: number;
  loadAverage5Min: number;
  loadAverage15Min: number;
  cpuUtilizationPct: number;
  memoryUtilizationPct: number;
  uplink?: {
    txRateBps?: number;
    rxRateBps?: number;
  };
  interfaces?: Record<string, unknown>;
}

export interface UnifiClientOverview {
  id: string;
  name?: string;
  connectedAt?: string;
  ipAddress?: string;
  type?: string; // WIRED | WIRELESS | VPN
  access?: unknown;
  macAddress?: string;
  uplinkDeviceId?: string;
}

export interface UnifiActionRequest {
  action: "RESTART" | "LOCATE" | "UNLOCATE" | (string & {});
}

/**
 * Legacy/local controller API (`/proxy/network/api/s/{siteName}/stat/device`).
 * Not part of the documented Integration API — undocumented and can change
 * between firmware versions — but it's the only place cumulative byte
 * counters live. Only the fields we actually use are typed; the real
 * response has far more.
 */
export interface UnifiLegacyUplink {
  rx_bytes?: number;
  tx_bytes?: number;
  "rx_bytes-r"?: number;
  "tx_bytes-r"?: number;
}

export interface UnifiLegacyPort {
  port_idx: number;
  name: string;
  up: boolean;
  enable: boolean;
  speed: number;
  is_uplink?: boolean;
  tx_bytes?: number;
  rx_bytes?: number;
  "tx_bytes-r"?: number;
  "rx_bytes-r"?: number;
  "bytes-r"?: number;
}

export interface UnifiLegacyDevice {
  _id: string;
  mac: string;
  name?: string;
  model?: string;
  type?: string; // e.g. "usw" (switch), "uap" (AP), "ugw"/"udm" (gateway)
  state?: number;
  uptime?: number;
  tx_bytes?: number; // cumulative since last reboot, in bytes
  rx_bytes?: number;
  uplink?: UnifiLegacyUplink;
  "system-stats"?: { cpu?: string; mem?: string };
  port_table?: UnifiLegacyPort[];
}

export interface UnifiLegacyDeviceResponse {
  meta: { rc: string };
  data: UnifiLegacyDevice[];
}

/** Site-wide bandwidth block, sourced from the legacy stat/device endpoint. */
export interface UnifiBandwidthSummary {
  /** Available whenever the legacy endpoint responded successfully. */
  available: boolean;
  downRateMbps: number;
  upRateMbps: number;
  /** Cumulative totals across all devices' uplink ports since their last reboot. */
  totalDownBytes: number;
  totalUpBytes: number;
}

/** Shape returned by our own /api/unifi aggregate endpoint */
export interface UnifiDashboardSnapshot {
  fetchedAt: string;
  siteId: string;
  sites: UnifiSite[];
  info: UnifiAppInfo | null;
  devices: UnifiDeviceOverview[];
  clients: UnifiClientOverview[];
  deviceStats: Record<string, UnifiDeviceStatistics | null>;
  bandwidth: UnifiBandwidthSummary;
  legacyDevices: UnifiLegacyDevice[];
  summary: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    totalClients: number;
    wiredClients: number;
    wirelessClients: number;
    avgCpuPct: number | null;
    avgMemPct: number | null;
  };
}