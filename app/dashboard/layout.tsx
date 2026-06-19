import { ApplicationShell1 } from "@/components/application-shell1";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardBackground } from "@/components/dashboard_res/background";
import Image from "next/image";
import {SessionProvider} from "next-auth/react"

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
            <SessionProvider session={session}>
     
        {/* Fixed background layer */}
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

      {/* App shell sits on top */}
      <ApplicationShell1 
        user={
          user
            ? {
                name: user.displayName ?? session?.user?.name ?? null,
                email: user.email ?? session?.user?.email ?? null,
                avatar: user.avatarUrl ?? sessionUser?.image ?? null,
              }
            : session?.user ?? null
        }
      >
        {children}
      </ApplicationShell1>
      </SessionProvider>
    </div>
    
  );
}