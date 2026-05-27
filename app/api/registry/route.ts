import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET all registry entries
export async function GET(req: Request) {
  

  const registry = await prisma.registry.findMany({
  });

  return Response.json(registry);
}

// POST a new registry entry
export async function POST(req: Request) {
  const body = await req.json();

  const registryEntry = await prisma.registry.create({
    data: {
      name: body.name,
      version: body.version,
      hosted_on: body.hosted_on,
      server_url: body.server_url,
    },
  });

  return Response.json(registryEntry);
}

// PATCH an existing registry entry
export async function PATCH(req: Request) {
  const body = await req.json();

  const { searchParams } = new URL(req.url);
  const registry_id = searchParams.get("registry_id") ?? undefined;

  if (!registry_id) {
    return Response.json({ error: "Missing registry_id" }, { status: 400 });
  }

  const registryEntry = await prisma.registry.update({
    where: {
      id: registry_id,
    },
    data: {
      name: body.name,
      version: body.version,
      hosted_on: body.hosted_on,
      server_url: body.server_url,
    },
  });

  return Response.json(registryEntry);
}