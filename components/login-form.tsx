"use client";

import { cn } from "@/lib/utils"
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

const floatingBlocks = [
  { size: 52, color: "#534AB7", top: "18%", left: "8%",  anim: "blockFloat  3.2s ease-in-out infinite 0s"   },
  { size: 36, color: "#1D9E75", top: "12%", left: "78%", anim: "blockFloat2 2.8s ease-in-out infinite 0.4s" },
  { size: 28, color: "#D85A30", top: "55%", left: "88%", anim: "blockFloat3 3.6s ease-in-out infinite 0.8s" },
  { size: 44, color: "#378ADD", top: "70%", left: "5%",  anim: "blockFloat2 3s   ease-in-out infinite 1.2s" },
  { size: 20, color: "#D4537E", top: "30%", left: "90%", anim: "blockFloat  2.6s ease-in-out infinite 0.6s" },
  { size: 32, color: "#BA7517", top: "80%", left: "72%", anim: "blockFloat3 3.4s ease-in-out infinite 1.6s" },
  { size: 18, color: "#0F6E56", top: "8%",  left: "40%", anim: "blockFloat  4s   ease-in-out infinite 2s"   },
];

const logoColors = ["#534AB7", "#1D9E75", "#378ADD", "#D85A30"];

export function LoginForm({ className, callbackUrl, ...props }: LoginFormProps) {
  const [isLoading, setIsLoading]     = useState(false);
  const [isLoading2, setIsLoading2]   = useState(false);
  const [isSplashing, setIsSplashing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [stepVisible, setStepVisible] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const router = useRouter();

  const cycleStep = (index: number) => {
    setStepVisible(false);
    setTimeout(() => {
      setLoadingStep(index);
      setStepVisible(true);
    }, 250);
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid username or password.");
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

  const handleEntraLogin = async () => {
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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        style={{ background: "#000", animation: "fadeIn 0.3s ease forwards" }}
      >
        {floatingBlocks.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: b.size,
              height: b.size,
              background: b.color,
              top: b.top,
              left: b.left,
              borderRadius: 10,
              animation: b.anim,
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col items-center gap-5 text-center max-w-xs px-6">
          {/* Logo mark */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 2 }}>
            {logoColors.map((c, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
            ))}
          </div>
          <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "#555", textTransform: "uppercase", margin: 0 }}>
            Fortmont
          </p>

          {/* Cycling text */}
          <div style={{ transition: "opacity 0.25s ease", opacity: stepVisible ? 1 : 0 }}>
            <h2 className="text-xl font-medium text-white mb-1">
              {loadingSteps[loadingStep].title}
            </h2>
            <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
              {loadingSteps[loadingStep].sub}
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", height: 2, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                background: "#534AB7",
                borderRadius: 99,
                animation: "loadingProgress 12s ease-out forwards",
              }}
            />
          </div>

          {/* Dot pulse */}
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#534AB7",
                  animation: `dotPulse 1.4s ease-in-out infinite ${i * 0.2}s`,
                }}
              />
            ))}
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
          />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Login"}
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
        </Field>
      </FieldGroup>
    </form>
  );
}