import { prisma } from "@/lib/prisma";

export default async function KbaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const kba = await prisma.kbArticle.findUnique({
    where: {
      slug,
    },
  });

  if (!kba) {
    return <div>KBA not found</div>;
  }

  return (
    <div className="p-8 items-center justify-center flex flex-col  ">
      <h1>{kba.title}</h1>
      <p>{kba.content}</p>
    </div>
  );
}