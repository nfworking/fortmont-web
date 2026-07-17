"use client";

import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

type LoginFormProps = React.ComponentProps<"form"> & {
  callbackUrl: string;
};

const loadingSteps = [
  { title: "Securing Session",  sub: "Verifying your credentials..."       },
  { title: "Loading Workspace", sub: "Connecting to Active Directory..."    },
  { title: "Syncing Policies",  sub: "Fetching Entra ID configuration..."  },
  { title: "Almost Ready",      sub: "Preparing your Fortmont dashboard..." },
];



const logoColors = ["#534AB7", "#1D9E75", "#378ADD", "#D85A30"];

export function LoginForm({ className, callbackUrl, ...props }: LoginFormProps) {
  const [isLoading, setIsLoading]     = useState(false);
  const [isLoading2, setIsLoading2]   = useState(false);
  const [isSplashing, setIsSplashing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "authenticator">("email");
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const router = useRouter();

  const cycleStep = (index: number) => {
    setLoadingStep(index);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (!twoFactorPending) {
        const twoFactorResponse = await fetch("/api/auth/2fa/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        });

        const twoFactorData = await twoFactorResponse.json();

        if (!twoFactorResponse.ok) {
          setError(twoFactorData.error ?? "Invalid username or password.");
          setIsLoading(false);
          return;
        }

        if (twoFactorData.requiresTwoFactor) {
          setTwoFactorPending(true);
          setTwoFactorMethod(twoFactorData.method === "authenticator" ? "authenticator" : "email");
          setMaskedEmail(twoFactorData.maskedEmail ?? null);
          setIsLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        username,
        password,
        otpCode: twoFactorPending ? otpCode : undefined,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(twoFactorPending ? "Invalid or expired verification code." : "Invalid username or password.");
        setIsLoading(false);
        return;
      }

      setIsSplashing(true);

      // Spread 3 transitions evenly across 12 seconds
      setTimeout(() => cycleStep(1), 3000);
      setTimeout(() => cycleStep(2), 6500);
      setTimeout(() => cycleStep(3), 9500);

      await new Promise((resolve) => setTimeout(resolve, 12000));
      router.push(result?.url ?? "/dashboard");
    } catch {
      setError("An unexpected error occurred.");
      setIsLoading(false);
      setIsSplashing(false);
    }
  };

  const resendTwoFactorCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/2fa/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Could not send a new code.");
        return;
      }

      setMaskedEmail(data.maskedEmail ?? maskedEmail);
      setOtpCode("");
    } catch {
      setError("Could not send a new code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntraLogin = async () => {
    setIsSplashing(true);
    setTimeout(() => cycleStep(1), 3000);
    setTimeout(() => cycleStep(2), 6500);
    setTimeout(() => cycleStep(3), 9500);

  await new Promise((resolve) => setTimeout(resolve, 12000));
    try {
      setIsLoading2(true);
      setError(null);
      await signIn("microsoft-entra-id", { callbackUrl });
    } finally {
      setIsLoading2(false);
    }
  };

  // --- SPLASH SCREEN ---
  if (isSplashing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 select-none">
        <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-xs w-full px-6">
          
          {/* Elegant Circular Spinner & Logo */}
          <div className="relative flex items-center justify-center w-16 h-16">
            {/* Minimalist Spinner Ring */}
            <svg className="animate-spin w-16 h-16 text-zinc-800" viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="21"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="opacity-20"
              />
              <path
                d="M 25 4 A 21 21 0 0 1 46 25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                className="text-zinc-400 opacity-80"
              />
            </svg>
            
            {/* Static Minimalist Brand Logo in Center */}
            <div className="absolute grid grid-cols-2 gap-1">
              {logoColors.map((c, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-[2px]"
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Branding Subtitle */}
          <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-600 font-medium -mt-2">
            Fortmont
          </span>

          {/* Cycling text with premium slide/fade/blur animations */}
          <div className="h-14 flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={loadingStep}
                initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-1"
              >
                <h2 className="text-sm font-medium text-zinc-200">
                  {loadingSteps[loadingStep].title}
                </h2>
                <p className="text-xs text-zinc-500">
                  {loadingSteps[loadingStep].sub}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Minimalist Thin Progress Bar */}
          <div className="w-full h-[2px] bg-zinc-900 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-zinc-300 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 12, ease: "easeInOut" }}
            />
          </div>
          
        </div>
      </div>
    );
  }

  // --- LOGIN FORM ---
  return (
    <form
      className={cn("flex flex-col gap-6 bg-white dark:bg-black", className)}
      onSubmit={handleLogin}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center dark:text-white">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your username below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="username">Username</FieldLabel>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder=""
            required
            className="bg-background"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={twoFactorPending}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a href="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="bg-background"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={twoFactorPending}
          />
        </Field>
        {twoFactorPending && (
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="otp-code">Verification code</FieldLabel>
              <button
                type="button"
                onClick={resendTwoFactorCode}
                disabled={isLoading || twoFactorMethod !== "email"}
                className="ml-auto text-sm underline-offset-4 hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
            <Input
              id="otp-code"
              name="otpCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              className="bg-background"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <FieldDescription>
              {twoFactorMethod === "authenticator"
                ? "Enter the 6-digit code from your authenticator app."
                : `Enter the 6-digit code sent to ${maskedEmail ?? "your email"}.`}
            </FieldDescription>
          </Field>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : twoFactorPending ? "Verify and login" : "Login"}
          </Button>
        </Field>
        <FieldSeparator>continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button" onClick={handleEntraLogin} disabled={isLoading2}>
            {isLoading2 ? "Signing in..." : "Login with Entra ID"}<ArrowUpRight />
          </Button>
          <Button variant="outline" type="button" onClick={() => (window.location.href = "/mail")}>
            Access Fortmont Webmail<ArrowUpRight />
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="underline underline-offset-4">Signup</a>
          </FieldDescription>
          <div className="text-center text-xs text-muted-foreground mt-2 space-x-2">
            <a href="/privacy-policy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</a>
            <span>&middot;</span>
            <a href="/terms-of-service" className="underline underline-offset-4 hover:text-foreground">Terms of Service</a>
          </div>
        </Field>
      </FieldGroup>
    </form>
  );
}
