import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  const body = await req.json();

  const { searchParams } = new URL(req.url);
  const id = body.id ?? searchParams.get("id") ?? undefined;

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const lxc = await prisma.apps.update({
    where: {
      id,
    },
    data: {
      label: body.label,
      description: body.description,
      url: body.url
    },
  });

  return Response.json(lxc);
}