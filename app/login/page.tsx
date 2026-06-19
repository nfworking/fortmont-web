import { LoginForm } from "@/components/login-form";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Fortmont Web Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const params = await searchParams;

  return (
    <div className="relative min-h-svh">
      {/* Background Image */}
      <video
  autoPlay
  muted
  loop
  playsInline
  className="absolute inset-0 h-full w-full object-cover"
>
  <source src="/login2.mp4" type="video/mp4" />
</video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 backdrop-blur" />

      {/* Content */}
      <div className="relative z-10 flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <a href="#" className="flex items-center gap-2 font-medium ">
              <div className="flex size-8 items-center justify-center rounded-md ">
                <Image src="/favicon.ico" alt="Fortmont Web Logo" width={32} height={32} />
              </div>
              ortmont Web
            </a>
          </div>
         <div className="rounded-xl border bg-background/30 backdrop-blur-md p-6 shadow-xl">
          <LoginForm callbackUrl={params?.callbackUrl ?? "/dashboard"} />
          </div>
        </div>
      </div>
    </div>
  );
}