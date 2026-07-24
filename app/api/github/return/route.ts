import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export async function GET(request: Request) {
    const actor = await resolveTicketingActor(request);

    if (!actor?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const link = await prisma.gitHubLink.findUnique({
        where: { userId: actor.userId }
    });

    if (!link) {
        return NextResponse.json({ linked: false });
    }
    return NextResponse.json({ link });
}