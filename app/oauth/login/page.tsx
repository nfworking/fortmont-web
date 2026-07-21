import { OAuthLoginForm } from "@/components/oauth-login-form";
import { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Sign in with Fortmont",
};

export default async function OAuthLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; client_id?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl ?? "/api/oauth/authorize";
  let appName: string | null = null;

  const clientId =
    params?.client_id ||
    (() => {
      try {
        const url = new URL(callbackUrl, "http://localhost");
        return url.searchParams.get("client_id");
      } catch {
        return null;
      }
    })();

  if (clientId) {
    const client = await prisma.oAuthClient.findUnique({
      where: { clientId },
      select: { name: true },
    });
    appName = client?.name ?? null;
  }

  return (
    <div className="relative min-h-svh">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <div className="flex items-center gap-2 font-medium text-zinc-100">
              <div className="flex size-8 items-center justify-center rounded-md">
                <Image
                  src="/favicon.ico"
                  alt="Fortmont"
                  width={32}
                  height={32}
                />
              </div>
              Fortmont
            </div>
          </div>
          <div className="rounded-xl border bg-white dark:bg-black p-6 shadow-xl">
            <OAuthLoginForm callbackUrl={callbackUrl} appName={appName} />
          </div>
          <p className="text-center text-xs text-zinc-500">
            This page is only used when another app asks you to sign in with Fortmont.
          </p>
        </div>
      </div>
    </div>
  );
}
