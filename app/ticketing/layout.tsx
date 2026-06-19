import { DocsShell } from "@/components/ticketing/docs-shell";
import { TicketShell } from "@/components/ticketing/ticketShell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import Image from "next/image";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const sessionUser = session?.user as
    | {
        id?: string ;
        name?: string ;
        email?: string ;
        image?: string ;
      }
    | undefined;

  const userId = sessionUser?.id?.trim() ?? undefined;
  const email = session?.user?.email?.trim().toLowerCase();
  const username = session?.user?.name?.trim().toLowerCase();

  const articles = await prisma.kbArticle.findMany({
  orderBy: {
    createdAt: "desc",
  },
  select: {
    title: true,
    slug: true,
  },
});

  const user =
    userId || email || username
      ? await prisma.appUsers.findFirst({
          where: {
            OR: [
              ...(userId ? [{ id: userId }] : []),
              ...(email ? [{ email }] : []),
              ...(username ? [{ username }] : []),
            ],
          },
          select: {
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        })
      : null;

  return (
    <div className="relative min-h-screen w-full">
      <div className="fixed inset-0 -z-10">
             <Image
               src="https://images.unsplash.com/photo-1778003586700-6300af8182f8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
             alt="Dashboard Background"
             width={1000}
             height={1080}
             unoptimized
             loading="eager"
             className="object-cover w-full h-full "
           />
      </div>
<DocsShell
  user={{
    username: session?.user?.name ?? undefined,
    email: session?.user?.email ?? undefined,
    avatarUrl: session?.user?.image ?? undefined,
  }}
  articles={articles}
>
  {children}
</DocsShell>
     
    </div>
  );
}