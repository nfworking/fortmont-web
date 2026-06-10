// app/api/proxmox/summary/route.ts
import { NextResponse } from "next/server";
import { getClusterSummary } from "@/lib/proxmox";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getClusterSummary();
    return NextResponse.json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}