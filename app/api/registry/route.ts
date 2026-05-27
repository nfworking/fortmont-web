import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET all registry entries
export async function GET(req: Request) {
  

  const registry = await prisma.registry.findMany({
  });

  return Response.json(registry);
}
