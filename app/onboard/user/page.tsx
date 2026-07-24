import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingFlow from "@/components/onboard/onboard";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.appUsers.findUnique({
    where: { id: session.user.id },
    select: {
      onboarded: true,
      displayName: true,
      username: true,
      email: true,
      role: true,
      avatarUrl: true,
      phone: true,
    },
  });

  if (user?.onboarded === true) {
    redirect(params?.callbackUrl || "/dashboard");
  }

  const email = user?.email ?? session.user.email ?? "";

  return (
    <OnboardingFlow
      callbackUrl={params?.callbackUrl}
      initialData={{
        displayName: user?.displayName ?? session.user.name ?? user?.username ?? "",
        avatarUrl: user?.avatarUrl ?? session.user.image ?? null,
        role: user?.role ?? "",
        mailboxAlias: email.includes("@") ? email.split("@")[0] : user?.username ?? "",
        mailboxDomain: email.includes("@") ? email.split("@")[1] : undefined,
      }}
    />
  );
}