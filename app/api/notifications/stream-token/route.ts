import { NextResponse } from "next/server";
import { resolveTicketingActor } from "@/lib/ticketing-auth";
import { mintStreamToken } from "@/lib/stream-token";

export async function GET(req: Request) {
  const actor = await resolveTicketingActor(req);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await mintStreamToken(actor.userId, actor.userRole);

  return NextResponse.json({ token, expiresIn: 60 });
}