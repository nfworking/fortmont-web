import { prisma } from "@/lib/prisma";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";



export const runtime = "nodejs";

// GET all LXC
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lxc_ip = searchParams.get("lxc_ip") ?? undefined;
  const lxc_role = searchParams.get("lxc_role") ?? undefined;
  const lxc_status = searchParams.get("lxc_status") ?? undefined;
  const lxc_compose_status = searchParams.get("lxc_compose_status") ?? undefined;

  const lxcs = await prisma.lxc.findMany({
    where: {
      lxc_ip,
      lxc_role,
      lxc_status,
      lxc_compose_status,
    },
  });

  return Response.json(lxcs);
}



export async function POST(req: Request) {
  const body = await req.json();

  const lxc = await prisma.lxc.create({
    data: {
    lxc_ip: body.lxc_ip,
    lxc_role: body.lxc_role,
    lxc_status: body.lxc_status,
    lxc_compose_status: body.lxc_compose_status
    },
  });

  return Response.json(lxc);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const lxc_unique_id = searchParams.get("lxc_unique_id") ?? undefined;

  if (!lxc_unique_id) {
    return Response.json({ error: "Missing lxc_unique_id" }, { status: 400 });
  }

  const lxc = await prisma.lxc.delete({
    where: {
      lxc_unique_id,
    },
  });

  return Response.json(lxc);
}

export async function PATCH(req: Request) {
  const body = await req.json();

  const { searchParams } = new URL(req.url);
  const lxc_unique_id = searchParams.get("lxc_unique_id") ?? undefined;

  if (!lxc_unique_id) {
    return Response.json({ error: "Missing lxc_unique_id" }, { status: 400 });
  }

  const lxc = await prisma.lxc.update({
    where: {
      lxc_unique_id,
    },
    data: {
      lxc_ip: body.lxc_ip,
      lxc_role: body.lxc_role,
      lxc_status: body.lxc_status,
      lxc_compose_status: body.lxc_compose_status
    },
  });

  return Response.json(lxc);
}