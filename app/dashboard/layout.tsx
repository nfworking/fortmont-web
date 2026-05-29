import { ApplicationShell1 } from "@/components/application-shell1";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return <ApplicationShell1 user={session?.user ?? null}>{children}</ApplicationShell1>;
}