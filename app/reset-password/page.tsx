"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Stage = "form" | "submitting" | "success" | "error" | "invalid";

// ---------------------------------------------------------------------------
// Password requirements
// ---------------------------------------------------------------------------
const REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
] as const;

// ---------------------------------------------------------------------------
// Animated SVG: drawn circle + check
// ---------------------------------------------------------------------------
function AnimatedCheck() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-16"
      aria-hidden
    >
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-foreground [stroke-dasharray:176] [stroke-dashoffset:176] animate-draw-circle"
      />
      <polyline
        points="20,34 28,42 44,24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground [stroke-dasharray:36] [stroke-dashoffset:36] animate-draw-path"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Animated SVG: drawn circle + cross
// ---------------------------------------------------------------------------
function AnimatedCross() {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-16"
      aria-hidden
    >
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-foreground [stroke-dasharray:176] [stroke-dashoffset:176] animate-draw-circle"
      />
      <line
        x1="22" y1="22" x2="42" y2="42"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-foreground [stroke-dasharray:30] [stroke-dashoffset:30] animate-draw-path"
      />
      <line
        x1="42" y1="22" x2="22" y2="42"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ animationDelay: "0.6s" }}
        className="text-foreground [stroke-dasharray:30] [stroke-dashoffset:30] animate-draw-path"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Password strength
// ---------------------------------------------------------------------------
function StrengthIndicator({ password }: { password: string }) {
  const met = REQUIREMENTS.filter((r) => r.test(password)).length;

  return (
    <div className="space-y-2.5">
      {/* Bar */}
      <div className="flex gap-1" role="meter" aria-label="Password strength" aria-valuenow={met} aria-valuemin={0} aria-valuemax={4}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-0.5 flex-1 rounded-full transition-all duration-300",
              i < met ? "bg-foreground" : "bg-border"
            )}
          />
        ))}
      </div>

      {/* Requirements */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {REQUIREMENTS.map((req) => {
          const ok = req.test(password);
          return (
            <li
              key={req.label}
              className={cn(
                "flex items-center gap-1.5 text-[11px] transition-colors duration-200",
                ok ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="font-mono">{ok ? "✓" : "·"}</span>
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password field with show/hide toggle
// ---------------------------------------------------------------------------
function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="pr-10 font-mono tracking-wide"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inner component (reads search params)
// ---------------------------------------------------------------------------
function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [stage, setStage] = useState<Stage>(token ? "form" : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(5);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (stage === "success") {
      intervalRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(intervalRef.current!);
            
            router.push("/login");
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stage, router]);

  const allMet = REQUIREMENTS.every((r) => r.test(password));
  const matches = password === confirm && confirm.length > 0;
  const canSubmit = allMet && matches && stage === "form";

  async function handleSubmit() {
    if (!canSubmit) return;
    setStage("submitting");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setStage("success");
      } else {
        const text = await res.text();
        setErrorMsg(text || "The link may have expired. Request a new one from the login page.");
        setStage("error");
      }
    } catch {
      setErrorMsg("Unable to reach the server. Check your connection and try again.");
      setStage("error");
    }
  }

  // ── Shared card wrapper ──────────────────────────────────────────────────
  const wrap = (children: React.ReactNode) => (
    <Card className="w-full max-w-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      {children}
    </Card>
  );

  // ── Invalid ──────────────────────────────────────────────────────────────
  if (stage === "invalid") return wrap(
    <>
      <CardHeader className="items-center text-center pb-4">
        <div className="mb-3"><AnimatedCross /></div>
        <CardTitle className="text-lg">Invalid reset link</CardTitle>
        <CardDescription className="text-sm">
          No token was found in this URL. Reset links are single-use and expire after 60 minutes.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex-col gap-2">
        <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
          <ArrowLeft size={14} className="mr-2" />
          Back to login
        </Button>
      </CardFooter>
    </>
  );

  // ── Form ─────────────────────────────────────────────────────────────────
  if (stage === "form") return wrap(
    <>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Set a new password</CardTitle>
        <CardDescription>
          Must be 8+ characters with uppercase, lowercase, and a number.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            placeholder="Enter new password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          {password.length > 0 && (
            <div className="pt-1">
              <StrengthIndicator password={password} />
            </div>
          )}
        </div>

        <Separator />

        {/* Confirm password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="confirm">Confirm password</Label>
            {confirm.length > 0 && (
              <span className={cn("text-[11px] font-medium", matches ? "text-foreground" : "text-muted-foreground")}>
                {matches ? "Matches" : "Doesn't match"}
              </span>
            )}
          </div>
          <PasswordInput
            id="confirm"
            placeholder="Confirm new password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" disabled={!canSubmit} onClick={handleSubmit}>
          Reset password
        </Button>
      </CardFooter>
    </>
  );

  // ── Submitting ───────────────────────────────────────────────────────────
  if (stage === "submitting") return wrap(
    <CardContent className="flex flex-col items-center gap-4 py-10">
      <div
        className="size-8 rounded-full border-2 border-border border-t-foreground animate-spin"
        role="status"
        aria-label="Updating password"
      />
      <p className="text-sm text-muted-foreground">Updating your password…</p>
    </CardContent>
  );

  // ── Success ──────────────────────────────────────────────────────────────
  if (stage === "success") return wrap(
    <>
      <CardHeader className="items-center text-center pb-4">
        <div className="mb-3"><AnimatedCheck /></div>
        <CardTitle className="text-lg">Password updated</CardTitle>
        <CardDescription>
          You&apos;re signed out of all active sessions. Use your new password to sign back in.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">Redirecting to login</p>
          <span className="font-mono text-xl font-semibold tabular-nums leading-none">
            {countdown}
          </span>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Go to login
        </Button>
      </CardFooter>
    </>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (stage === "error") return wrap(
    <>
      <CardHeader className="items-center text-center pb-4">
        <div className="mb-3"><AnimatedCross /></div>
        <CardTitle className="text-lg">Reset failed</CardTitle>
        <CardDescription>{errorMsg}</CardDescription>
      </CardHeader>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setStage("form");
            setPassword("");
            setConfirm("");
            setErrorMsg("");
          }}
        >
          <RotateCcw size={14} className="mr-2" />
          Try again
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => router.push("/login")}>
          <ArrowLeft size={14} className="mr-2" />
          Login
        </Button>
      </CardFooter>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page (Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------
export default function ResetPasswordPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 py-12 bg-background">
      {/* Wordmark */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center size-9 rounded-lg bg-foreground text-background">
          <ShieldCheck size={18} strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">Fortmont</span>
      </div>

      <Suspense
        fallback={
          <Card className="w-full max-w-sm">
            <CardContent className="flex items-center justify-center py-10">
              <div className="size-6 rounded-full border-2 border-border border-t-foreground animate-spin" />
            </CardContent>
          </Card>
        }
      >
        <ResetPasswordInner />
      </Suspense>

      <p className="mt-8 text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Fortmont
      </p>
    </div>
  );
}