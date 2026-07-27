"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowLeft, Mail } from "lucide-react";

import { toast } from "sonner";
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

type Stage = "form" | "submitting" | "sent";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("form");
  const [email, setEmail] = useState("");

  async function handleSubmit() {
    if (!email.trim()) return;
    setStage("submitting");

    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Server error (${res.status})`);
      }

      // Always show "sent" regardless of whether the email exists —
      // avoids leaking which addresses are registered.
      setStage("sent");
    } catch (err) {
      setStage("form");
      toast.error("Failed to send reset link", {
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  // ── Shared card wrapper ──────────────────────────────────────────────────
  const wrap = (children: React.ReactNode) => (
    <Card className="w-full max-w-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      {children}
    </Card>
  );

  const page = (card: React.ReactNode) => (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 py-12 bg-background">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center size-9 rounded-lg bg-foreground text-background">
          <ShieldCheck size={18} strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">Fortmont</span>
      </div>
      {card}
      <p className="mt-8 text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Fortmont
      </p>
    </div>
  );

  // ── Form ─────────────────────────────────────────────────────────────────
  if (stage === "form" || stage === "submitting") return page(wrap(
    <>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Reset your password</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoComplete="email"
              autoFocus
              disabled={stage === "submitting"}
              className="pl-9"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!email.trim() || stage === "submitting"}
        >
          {stage === "submitting" ? (
            <>
              <span
                className="mr-2 size-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin"
              />
              Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => router.push("/login")}
          disabled={stage === "submitting"}
        >
          <ArrowLeft size={14} className="mr-2" />
          Back to login
        </Button>
      </CardFooter>
    </>
  ));

  // ── Sent ─────────────────────────────────────────────────────────────────
  if (stage === "sent") return page(wrap(
    <>
      <CardHeader className="items-center text-center pb-4">
        <div className="mb-3 flex size-16 items-center justify-center rounded-full border border-border bg-muted/40">
          <Mail size={24} className="text-foreground" />
        </div>
        <CardTitle className="text-lg">Check your inbox</CardTitle>
        <CardDescription>
          If <span className="font-medium text-foreground">{email}</span> is
          registered, a reset link is on its way. It expires in 60 minutes.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Didn&apos;t receive anything? Check your spam folder or contact your IT administrator.
        </p>
      </CardContent>

      <CardFooter className="flex-col gap-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setEmail("");
            setStage("form");
          }}
        >
          Try a different email
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => router.push("/login")}
        >
          <ArrowLeft size={14} className="mr-2" />
          Back to login
        </Button>
      </CardFooter>
    </>
  ));
}