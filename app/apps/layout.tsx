import  DashboardPage  from "@/components/application-shell2";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardBackground } from "@/components/dashboard_res/background";

export default async function AppsLayout({
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
        <DashboardBackground />
      </div>

      {/* App shell sits on top */}
      <DashboardPage/>
        

    </div>
  );
}