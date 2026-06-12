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
        id?: string | null;
        name?: string | null;
        email?: string | null;
        image?: string | null;
      }
    | undefined;

  const userId = sessionUser?.id?.trim() ?? undefined;
  const email = session?.user?.email?.trim().toLowerCase();
  const username = session?.user?.name?.trim().toLowerCase();

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
<DocsShell
  user={{
    username: session?.user?.name,
    email: session?.user?.email,
    avatarUrl: session?.user?.image,
  }}
>
  {children}
</DocsShell>
     
    </div>
  );
}