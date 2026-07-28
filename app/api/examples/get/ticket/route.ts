import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 },
      select: {
        proxmoxApiToken: true,
        proxmoxBaseUrl: true,
      },
    });

    if (!config?.proxmoxApiToken || !config.proxmoxBaseUrl) {
      return Response.json(
        { error: "Missing Proxmox configuration" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${config.proxmoxBaseUrl}/api2/json/nodes`,
      {
        headers: {
          Authorization: config.proxmoxApiToken,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const details = await res.text();

      return Response.json(
        {
          error: "Proxmox request failed",
          details,
        },
        { status: res.status }
      );
    }

    const json = await res.json();

    return Response.json(json);

  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}