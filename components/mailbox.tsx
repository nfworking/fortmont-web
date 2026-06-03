"use client";

import { useState, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  Info,
  AlertCircle,
  Lock,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface MailboxOnboardingProps {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title?: string;
  };
  onComplete?: (email: string, password: string) => Promise<void>;
  className?: string;
}

type Step = "email" | "password" | "done";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  if (password.length === 0)
    return { score: 0, label: "Enter a password to see strength", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Too short", "Fair", "Good", "Strong"];
  const colors = [
    "bg-red-500",
    "bg-amber-400",
    "bg-emerald-500",
    "bg-emerald-500",
  ];
  return {
    score,
    label: labels[Math.max(0, score - 1)],
    color: colors[Math.max(0, score - 1)],
  };
}

const TOTAL_STEPS = 2;

export function MailboxOnboarding({
  logo,
  onComplete,
  className,
}: MailboxOnboardingProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = step === "email" ? 0 : step === "password" ? 1 : 2;
  const strength = getPasswordStrength(password);

  const validateEmail = (value: string) => {
    if (!value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailNext = () => {
    if (validateEmail(email)) setStep("password");
  };

  const handlePasswordNext = async () => {
    if (!validatePassword(password)) return;
    if (!onComplete) {
      setStep("done");
      return;
    }
    setIsSubmitting(true);
    try {
      await onComplete(email.trim(), password);
      setStep("done");
      toast.success("Mailbox created", {
        description: `${email.trim()} is ready to use.`,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create mailbox";
      toast.error("Something went wrong", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleEmailNext();
  };

  const handlePasswordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handlePasswordNext();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-12">
  <div
    className="absolute inset-0 bg-center bg-cover"
    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1779464433263-35e2c02d1cc8?q=80&w=1528&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}
  />

  {/* overlay */}
  <div className="absolute inset-0 bg-black/40" />

  
      <div className="relative w-full max-w-sm flex flex-col items-center gap-6">
        {/* Logo */}
        {logo && (
          <a href={logo.url}>
            <img
              src={logo.src}
              alt={logo.alt}
              title={logo.title}
              className="h-8 dark:invert"
            />
          </a>
        )}

        {/* Card */}
        <div className="w-full rounded-2xl border border-border bg-background shadow-sm px-7 py-7 flex flex-col gap-5">
          {/* Progress bar */}
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-[3px] flex-1 rounded-full transition-all duration-500",
                  i < currentStepIndex
                    ? "bg-muted-foreground/50"
                    : i === currentStepIndex && step !== "done"
                    ? "bg-foreground"
                    : step === "done"
                    ? "bg-muted-foreground/50"
                    : "bg-border"
                )}
              />
            ))}
          </div>

          {/* Step counter */}
          {step !== "done" && (
            <p className="text-[11px] text-muted-foreground text-right -mt-2 font-mono tracking-wide">
              Step {currentStepIndex + 1} of {TOTAL_STEPS}
            </p>
          )}

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                  Mailbox setup
                </p>
                <h1 className="text-xl font-semibold text-foreground leading-snug">
                  What's your email?
                </h1>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed -mt-2">
                Enter the address for your new mailbox. This will be your
                primary address.
              </p>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email-input"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Email address
                </label>
                <Input
                  id="email-input"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onKeyDown={handleEmailKeyDown}
                  className={cn(
                    "h-10 text-sm",
                    emailError && "border-destructive focus-visible:ring-destructive"
                  )}
                  autoFocus
                />
                <p
                  className={cn(
                    "text-[11px] flex items-center gap-1",
                    emailError ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {emailError ? (
                    <AlertCircle className="w-3 h-3 shrink-0" />
                  ) : (
                    <Info className="w-3 h-3 shrink-0" />
                  )}
                  {emailError || "Use your organisation domain (@fortmont.me)"}
                </p>
              </div>

              <button
                onClick={handleEmailNext}
                className="w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 hover:opacity-85 active:scale-[0.98] transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Password ── */}
          {step === "password" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                  Mailbox setup
                </p>
                <h1 className="text-xl font-semibold text-foreground leading-snug">
                  Set a password
                </h1>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed -mt-2">
                Choose a strong password for your mailbox. You can change it at
                any time.
              </p>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="password-input"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                    }}
                    onKeyDown={handlePasswordKeyDown}
                    className={cn(
                      "h-10 text-sm pr-10",
                      passwordError &&
                        "border-destructive focus-visible:ring-destructive"
                    )}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Strength meter */}
                <div className="flex gap-1.5 mt-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-[3px] flex-1 rounded-full transition-all duration-300",
                        password.length > 0 && i < strength.score
                          ? strength.color
                          : "bg-border"
                      )}
                    />
                  ))}
                </div>

                <p
                  className={cn(
                    "text-[11px] flex items-center gap-1",
                    passwordError ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {passwordError ? (
                    <AlertCircle className="w-3 h-3 shrink-0" />
                  ) : (
                    <Info className="w-3 h-3 shrink-0" />
                  )}
                  {passwordError || strength.label}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handlePasswordNext}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-lg bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 hover:opacity-85 active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating mailbox...
                    </>
                  ) : (
                    <>
                      Finish setup
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep("email")}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted active:scale-[0.98] transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === "done" && (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-foreground" />
              </div>

              <div className="text-center flex flex-col gap-1.5">
                <h1 className="text-xl font-semibold text-foreground">
                  Mailbox ready
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your mailbox has been configured. You're all set to start
                  sending and receiving mail.
                </p>
              </div>

              <div className="w-full bg-muted rounded-lg border border-border px-4 py-3 flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Configured address
                </p>
                <p className="text-sm font-mono text-foreground">{email}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          {step !== "done" && (
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <Lock className="w-3 h-3" />
              Secured with TLS encryption
            </p>
          )}
        </div>
      </div>
    </section>
  );
}