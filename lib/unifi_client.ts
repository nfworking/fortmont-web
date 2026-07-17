import "server-only";
import { Agent } from "undici";
import type {
  UnifiActionRequest,
  UnifiAppInfo,
  UnifiClientOverview,
  UnifiDeviceOverview,
  UnifiDeviceStatistics,
  UnifiPage,
  UnifiSite,
} from "./unifi_types";

/**
 * Env vars (add to .env):
 *   UNIFI_BASE_URL   e.g. https://192.168.1.1  (console host/IP, no trailing slash)
 *   UNIFI_API_KEY    generated at UniFi Network > Settings > Control Plane > Integrations
 *   UNIFI_SITE_ID    optional default site id, falls back to first site returned by the API
 *   UNIFI_ALLOW_SELF_SIGNED  "true" to skip TLS verification for on-prem consoles with
 *                            self-signed certs (typical for local UDM/UCG consoles)
 */
const BASE_URL = process.env.UNIFI_BASE_URL?.replace(/\/$/, "");
const API_KEY = process.env.UNIFI_API_KEY;
const DEFAULT_SITE_ID = process.env.UNIFI_SITE_ID;
const ALLOW_SELF_SIGNED = process.env.UNIFI_ALLOW_SELF_SIGNED === "true";

const INTEGRATION_PATH = "/proxy/network/integration/v1";

// Local UniFi OS consoles typically present a self-signed cert. Reuse a single
// dispatcher so we're not re-negotiating TLS on every request.
const insecureAgent = ALLOW_SELF_SIGNED
  ? new Agent({ connect: { rejectUnauthorized: false } })
  : undefined;

export class UnifiApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "UnifiApiError";
    this.status = status;
  }
}

function assertConfigured(): void {
  if (!BASE_URL || !API_KEY) {
    throw new UnifiApiError(
      "UniFi integration is not configured. Set UNIFI_BASE_URL and UNIFI_API_KEY.",
      503,
    );
  }
}

async function unifiFetch<T>(
  path: string,
  init: RequestInit & { dispatcher?: unknown } = {},
): Promise<T> {
  assertConfigured();

  const res = await fetch(`${BASE_URL}${INTEGRATION_PATH}${path}`, {
    ...init,
    headers: {
      "X-API-KEY": API_KEY as string,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    // @ts-expect-error - undici-specific option, valid on Node's global fetch
    dispatcher: insecureAgent,
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new UnifiApiError(
      `UniFi API ${res.status} on ${path}: ${body || res.statusText}`,
      res.status,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function getAppInfo(): Promise<UnifiAppInfo> {
  return unifiFetch<UnifiAppInfo>("/info");
}

export function listSites(): Promise<UnifiPage<UnifiSite>> {
  return unifiFetch<UnifiPage<UnifiSite>>("/sites");
}

export async function resolveSiteId(): Promise<string> {
  if (DEFAULT_SITE_ID) return DEFAULT_SITE_ID;
  const sites = await listSites();
  const first = sites.data[0];
  if (!first) throw new UnifiApiError("No UniFi sites available for this API key.", 404);
  return first.id;
}

export function listDevices(
  siteId: string,
  params: { offset?: number; limit?: number } = {},
): Promise<UnifiPage<UnifiDeviceOverview>> {
  const qs = new URLSearchParams({
    offset: String(params.offset ?? 0),
    limit: String(params.limit ?? 200),
  });
  return unifiFetch<UnifiPage<UnifiDeviceOverview>>(
    `/sites/${siteId}/devices?${qs.toString()}`,
  );
}

export function listClients(
  siteId: string,
  params: { offset?: number; limit?: number } = {},
): Promise<UnifiPage<UnifiClientOverview>> {
  const qs = new URLSearchParams({
    offset: String(params.offset ?? 0),
    limit: String(params.limit ?? 200),
  });
  return unifiFetch<UnifiPage<UnifiClientOverview>>(
    `/sites/${siteId}/clients?${qs.toString()}`,
  );
}

export function getDeviceStatistics(
  siteId: string,
  deviceId: string,
): Promise<UnifiDeviceStatistics> {
  return unifiFetch<UnifiDeviceStatistics>(
    `/sites/${siteId}/devices/${deviceId}/statistics/latest`,
  );
}

export function executeDeviceAction(
  siteId: string,
  deviceId: string,
  action: UnifiActionRequest,
): Promise<void> {
  return unifiFetch<void>(`/sites/${siteId}/devices/${deviceId}/actions`, {
    method: "POST",
    body: JSON.stringify(action),
  });
}

/**
 * Fetch latest statistics for a batch of devices, tolerating individual
 * failures (offline devices commonly 404/409 on the statistics endpoint).
 */
export async function getDeviceStatisticsBatch(
  siteId: string,
  deviceIds: string[],
): Promise<Record<string, UnifiDeviceStatistics | null>> {
  const entries = await Promise.all(
    deviceIds.map(async (id) => {
      try {
        const stats = await getDeviceStatistics(siteId, id);
        return [id, stats] as const;
      } catch {
        return [id, null] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}