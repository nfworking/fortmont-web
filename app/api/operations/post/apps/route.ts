import { prisma } from "@/lib/prisma";




export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();

  const apps = await prisma.apps.create({
    data: {
    label: body.label,
    description: body.description,
    url: body.url
    },
  });

  return Response.json(apps);
}

