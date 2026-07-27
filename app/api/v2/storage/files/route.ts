import { resolveTicketingActor } from "@/lib/ticketing-auth";
import { prisma } from "@/lib/prisma";

function serializeBigInts<T>(value: T): T {
  if (typeof value === "bigint") {
    return value.toString() as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInts(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        serializeBigInts(entry),
      ])
    ) as T;
  }

  return value;
}

export async function GET(req: Request) {
  try {
    const actor = await resolveTicketingActor(req);

    if (!actor?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const files = await prisma.file.findMany({
      where: {
        ownerId: actor.userId,
      },
    });
    return Response.json(serializeBigInts(files));
  } catch (error) {
    console.error("Error fetching files:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}   