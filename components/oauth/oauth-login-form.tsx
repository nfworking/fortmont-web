"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

type OAuthLoginFormProps = React.ComponentProps<"form"> & {
  callbackUrl: string;
  appName?: string | null;
};

/**
 * Lean login form for third-party OAuth "Sign in with Fortmont".
 * No dashboard splash delay — returns to the authorize/consent flow immediately.
 */
export function OAuthLoginForm({
  className,
  callbackUrl,
  appName,
  ...props
}: OAuthLoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEntra, setIsLoadingEntra] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "authenticator">("email");
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const destination = appName ? appName : "the application";

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      if (!twoFactorPending) {
        const twoFactorResponse = await fetch("/api/auth/2fa/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const twoFactorData = await twoFactorResponse.json();

        if (!twoFactorResponse.ok) {
          setError(twoFactorData.error ?? "Invalid username or password.");
          setIsLoading(false);
          return;
        }

        if (twoFactorData.requiresTwoFactor) {
          setTwoFactorPending(true);
          setTwoFactorMethod(
            twoFactorData.method === "authenticator" ? "authenticator" : "email",
          );
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
        setError(
          twoFactorPending
            ? "Invalid or expired verification code."
            : "Invalid username or password.",
        );
        setIsLoading(false);
        return;
      }

      // Immediate return to authorize → consent (no 12s splash)
      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const resendTwoFactorCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/2fa/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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
    try {
      setIsLoadingEntra(true);
      setError(null);
      await signIn("microsoft-entra-id", { callbackUrl });
    } catch {
      setError("Could not start Microsoft sign-in.");
      setIsLoadingEntra(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6 bg-white dark:bg-black", className)}
      onSubmit={handleLogin}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center dark:text-white">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <ShieldCheck className="size-5 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Sign in with Fortmont</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Continue to <span className="font-medium text-foreground">{destination}</span> using
            your Fortmont account. You are not opening the Fortmont dashboard.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="oauth-username">Username</FieldLabel>
          <Input
            id="oauth-username"
            name="username"
            type="text"
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
            <FieldLabel htmlFor="oauth-password">Password</FieldLabel>
            <a
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="oauth-password"
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
              <FieldLabel htmlFor="oauth-otp">Verification code</FieldLabel>
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
              id="oauth-otp"
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
          <Button type="submit" disabled={isLoading || isLoadingEntra}>
            {isLoading
              ? "Signing in..."
              : twoFactorPending
                ? "Verify and continue"
                : "Continue"}
          </Button>
        </Field>

        <FieldSeparator>or</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            onClick={handleEntraLogin}
            disabled={isLoading || isLoadingEntra}
          >
            {isLoadingEntra ? "Redirecting..." : "Continue with Entra ID"}
            <ArrowUpRight />
          </Button>
          <FieldDescription className="text-center">
            Looking for Fortmont itself?{" "}
            <a href="/login" className="underline underline-offset-4">
              Open Fortmont login
            </a>
          </FieldDescription>
          <div className="text-center text-xs text-muted-foreground mt-2 space-x-2">
            <a
              href="/privacy-policy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </a>
            <span>&middot;</span>
            <a
              href="/terms-of-service"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Terms of Service
            </a>
          </div>
        </Field>
      </FieldGroup>
    </form>
  );
}
