import { ApplicationShell1 } from "@/components/application-shell1";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardBackground } from "@/components/dashboard_res/background";
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
      {/* Fixed background layer */}
      <div className="fixed inset-0 -z-10">
     <Image
       src="/dashboard2.jpg"
       alt="Dashboard Background"
       width={1000}
       height={1080}
       unoptimized
       loading="eager"
       className="object-cover w-full h-full opacity-20"
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
    </div>
  );
}