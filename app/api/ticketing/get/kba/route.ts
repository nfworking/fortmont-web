import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? undefined;
  const title = searchParams.get("title") ?? undefined;
  const slug = searchParams.get("slug") ?? undefined;
  const content = searchParams.get("content") ?? undefined;
  const published = searchParams.get("published") ?? undefined;
  const createdAt = searchParams.get("createdAt") ?? undefined;
  const updatedAt = searchParams.get("updatedAt") ?? undefined;

  const kba = await prisma.kbArticle.findMany({
    where: {
        id,
        title,
        slug,
        content,
        published: published === "true" ? true : published === "false" ? false : undefined,
        createdAt: createdAt ? new Date(createdAt) : undefined,
        updatedAt: updatedAt ? new Date(updatedAt) : undefined,       
   
    },
  });

  return Response.json(kba);
}