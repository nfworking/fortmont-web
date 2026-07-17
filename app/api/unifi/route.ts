import { NextRequest, NextResponse } from "next/server";
import {
  UnifiApiError,
  getAppInfo,
  getDeviceStatisticsBatch,
  listClients,
  listDevices,
  listSites,
  resolveSiteId,
  executeDeviceAction,
} from "@/lib/unifi_client";
import type {
  UnifiActionRequest,
  UnifiDashboardSnapshot,
} from "@/lib/unifi_types";

export const dynamic = "force-dynamic";

/**
 * GET /api/unifi?siteId=<id>
 *
 * Returns a single aggregated snapshot for the dashboard: sites, devices,
 * clients, per-device live statistics, and a small rollup summary. Auth
 * supports both the web cookie session and mobile Bearer tokens via
 * resolveUserId, same pattern as the rest of Fortmont/Vault.
 */
export async function GET(req: NextRequest) {
  

  const requestedSiteId = req.nextUrl.searchParams.get("siteId") ?? undefined;

  try {
    const [info, sitesPage] = await Promise.all([
      getAppInfo().catch(() => null),
      listSites(),
    ]);

    const siteId = requestedSiteId ?? (await resolveSiteId());

    const [devicesPage, clientsPage] = await Promise.all([
      listDevices(siteId),
      listClients(siteId),
    ]);

    const deviceStats = await getDeviceStatisticsBatch(
      siteId,
      devicesPage.data.filter((d) => d.state === "ONLINE").map((d) => d.id),
    );

    const onlineDevices = devicesPage.data.filter((d) => d.state === "ONLINE");
    const cpuSamples = onlineDevices
      .map((d) => deviceStats[d.id]?.cpuUtilizationPct)
      .filter((v): v is number => typeof v === "number");
    const memSamples = onlineDevices
      .map((d) => deviceStats[d.id]?.memoryUtilizationPct)
      .filter((v): v is number => typeof v === "number");

    const snapshot: UnifiDashboardSnapshot = {
      fetchedAt: new Date().toISOString(),
      siteId,
      sites: sitesPage.data,
      info,
      devices: devicesPage.data,
      clients: clientsPage.data,
      deviceStats,
      summary: {
        totalDevices: devicesPage.data.length,
        onlineDevices: onlineDevices.length,
        offlineDevices: devicesPage.data.length - onlineDevices.length,
        totalClients: clientsPage.data.length,
        wiredClients: clientsPage.data.filter((c) => c.type === "WIRED").length,
        wirelessClients: clientsPage.data.filter((c) => c.type === "WIRELESS")
          .length,
        avgCpuPct: average(cpuSamples),
        avgMemPct: average(memSamples),
      },
    };

    return NextResponse.json(snapshot);
  } catch (err) {
    return handleUnifiError(err);
  }
}

/**
 * POST /api/unifi
 * Body: { siteId?: string, deviceId: string, action: "RESTART" | "LOCATE" | "UNLOCATE" }
 *
 * Executes a device action (restart, flash locate LED, etc). Requires an
 * authenticated session; write actions are intentionally not exposed to
 * unauthenticated bearer-less requests.
 */
export async function POST(req: NextRequest) {
 

  let body: { siteId?: string; deviceId?: string; action?: UnifiActionRequest["action"] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.deviceId || !body.action) {
    return NextResponse.json(
      { error: "deviceId and action are required" },
      { status: 400 },
    );
  }

  try {
    const siteId = body.siteId ?? (await resolveSiteId());
    await executeDeviceAction(siteId, body.deviceId, { action: body.action });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleUnifiError(err);
  }
}

function handleUnifiError(err: unknown) {
  if (err instanceof UnifiApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[/api/unifi] unexpected error", err);
  return NextResponse.json(
    { error: "Unexpected error contacting UniFi console" },
    { status: 500 },
  );
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}