"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Mail,
  UserCircle,
  Shield,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Smartphone,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ShieldCheck,
  MailCheck,
  LayoutDashboard,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingData {
  // Profile
  displayName: string;
  jobTitle: string;
  department: string;
  avatarUrl: string | null;

  // Role
  role: string;

  // Mailbox — always required
  mailboxAlias: string;
  mailboxDomain: string;
  mailboxPassword: string;

  // Devices — phones only
  phones: RegisteredPhone[];
}

interface RegisteredPhone {
  id: string;
  name: string;
  number: string;
}

type StrengthScore = 0 | 1 | 2 | 3;

interface PasswordStrength {
  score: StrengthScore;
  label: string;
  color: string;
}

type OnboardingFlowProps = {
  initialData?: Partial<OnboardingData>;
  callbackUrl?: string;
};

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------

const STEPS = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "role",    label: "Role",    icon: Shield },
  { id: "mailbox", label: "Mailbox", icon: Mail },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "review",  label: "Review",  icon: CheckCircle2 },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLES = [
  { value: "viewer",  label: "Viewer",               description: "Read-only access to assigned resources" },
  { value: "support", label: "Support Technician",    description: "Manage tickets and user requests" },
  { value: "admin",   label: "IT Administrator",      description: "Full access to infrastructure management" },
  { value: "manager", label: "Department Manager",    description: "Manage team members and approvals" },
];

const DOMAINS = ["fortmont.me", "corp.fortmont.me", "dev.fortmont.me"];

function suggestMailboxAlias(displayName: string) {
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

function initData(initialData?: Partial<OnboardingData>): OnboardingData {
  return {
    displayName: initialData?.displayName ?? "",
    jobTitle: "",
    department: initialData?.department ?? "",
    avatarUrl: initialData?.avatarUrl ?? null,
    role: initialData?.role ?? "",
    mailboxAlias: initialData?.mailboxAlias ?? "",
    mailboxDomain: initialData?.mailboxDomain ?? DOMAINS[0],
    mailboxPassword: initialData?.mailboxPassword ?? "",
    phones: [],
  };
}

// ---------------------------------------------------------------------------
// Password strength helper
// ---------------------------------------------------------------------------

function passwordStrength(pw: string): PasswordStrength {
  if (!pw || pw.length === 0) return { score: 0, label: "", color: "" };

  let score = 0;
  if (pw.length >= 8)                                   score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw))            score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw))     score++;

  if (score === 3) return { score: 3, label: "Strong", color: "bg-emerald-500" };
  if (score === 2) return { score: 2, label: "Fair",   color: "bg-amber-500" };
  if (score === 1) return { score: 1, label: "Weak",   color: "bg-destructive" };
  return { score: 0, label: "", color: "" };
}

// ---------------------------------------------------------------------------
// Sub-step: Profile
// ---------------------------------------------------------------------------

function ProfileStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ avatarUrl: url });
    // TODO: Upload avatar to your storage provider (e.g. Azure Blob / S3 / local)
    // POST /api/users/avatar with FormData containing the image file.
    // Replace the object URL with the returned permanent URL in data.avatarUrl.
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-muted/20 p-4 text-center">
          <Avatar
            className="h-20 w-20 cursor-pointer ring-1 ring-border"
            onClick={() => fileRef.current?.click()}
          >
            <AvatarImage src={data.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-muted text-lg text-muted-foreground">
              <UserCircle className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Add photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <p className="text-xs text-muted-foreground">
            Shown in the directory, mail, and support views.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="displayName">Full name</Label>
            <Input
              id="displayName"
              placeholder="Jane Smith"
              value={data.displayName}
              onChange={(e) => onChange({ displayName: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              placeholder="Systems Engineer"
              value={data.jobTitle}
              onChange={(e) => onChange({ jobTitle: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="department">Department</Label>
            <Select value={data.department} onValueChange={(v) => onChange({ department: v })}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department…" />
              </SelectTrigger>
              <SelectContent>
                {['IT', 'Engineering', 'Finance', 'HR', 'Operations', 'Sales', 'Legal'].map((d) => (
                  <SelectItem key={d} value={d.toLowerCase()}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-step: Role
// ---------------------------------------------------------------------------

function RoleStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pick the role that best matches the user&apos;s responsibilities. This controls access across
        the workspace, ticketing, and admin surfaces.
      </p>

      <div className="grid gap-2">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange({ role: r.value })}
            className={cn(
              "w-full text-left rounded-lg border px-4 py-3 transition-all",
              "hover:bg-accent hover:border-accent-foreground/20",
              data.role === r.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium leading-none">{r.label}</span>
              {data.role === r.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
          </button>
        ))}
      </div>

      {data.role && (
        <div className="rounded-md bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            Selected: {ROLES.find((r) => r.value === data.role)?.label}
          </p>
          <p>
            {/* TODO: Load dynamic permission list from your role definition API */}
            {/* GET /api/roles/{role}/permissions — render a breakdown of allowed scopes */}
            Permissions will be assigned from your Entra ID role group on completion.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-step: Mailbox (required)
// ---------------------------------------------------------------------------

function MailboxStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const pw = data.mailboxPassword ?? "";
  const strength = passwordStrength(pw);
  const preview = data.mailboxAlias ? `${data.mailboxAlias}@${data.mailboxDomain}` : null;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Create the mailbox the user will actually sign into. The preview updates as you type, and
        the password must pass a simple strength check before you continue.
      </p>

      {/* Email address */}
      <div className="space-y-1.5">
        <Label htmlFor="alias">
          Email address <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="alias"
            placeholder="jane.smith"
            value={data.mailboxAlias}
            onChange={(e) =>
              onChange({ mailboxAlias: e.target.value.toLowerCase().replace(/\s+/g, ".") })
            }
            className="flex-1"
          />
          <Select
            value={data.mailboxDomain}
            onValueChange={(v) => onChange({ mailboxDomain: v })}
          >
            <SelectTrigger className="w-45">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>
                  @{d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preview && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 mt-1">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-mono">{preview}</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">Preview</Badge>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="mailboxPassword">
          Initial password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="mailboxPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={pw}
            onChange={(e) => onChange({ mailboxPassword: e.target.value })}
            className="pr-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Strength meter */}
        {pw.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex gap-1">
              {([1, 2, 3] as StrengthScore[]).map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i <= strength.score ? strength.color : "bg-muted"
                  )}
                />
              ))}
            </div>
            {strength.label && (
              <p className="text-xs text-muted-foreground">
                Password strength:{" "}
                <span
                  className={cn(
                    strength.score === 1 && "text-destructive",
                    strength.score === 2 && "text-amber-500",
                    strength.score === 3 && "text-emerald-500"
                  )}
                >
                  {strength.label}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border border-dashed border-muted-foreground/25 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/70">Exchange provisioning</p>
        <p>
          {/*
           * Handled in handleSubmit via POST /api/mailbox/create
           * Body: { email, password }
           * Force password change on first login via Exchange New-Mailbox -ResetPasswordOnNextLogon.
           */}
          Mailbox will be provisioned on your Exchange 2019 server on completion.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-step: Devices (phones only)
// ---------------------------------------------------------------------------

function DevicesStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const [phoneName, setPhoneName]     = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  function addPhone() {
    if (!phoneName.trim()) return;
    const newPhone: RegisteredPhone = {
      id: crypto.randomUUID(),
      name: phoneName.trim(),
      number: phoneNumber.trim(),
    };
    onChange({ phones: [...data.phones, newPhone] });
    setPhoneName("");
    setPhoneNumber("");
    // TODO: POST /api/devices/register
    // Body: { userId, name: phoneName, type: "mobile", number: phoneNumber }
    // Integrate with Entra ID device registration or your MDM/Intune solution.
  }

  function removePhone(id: string) {
    onChange({ phones: data.phones.filter((p) => p.id !== id) });
    // TODO: DELETE /api/devices/{id} to de-register the device in Entra ID / MDM
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Add a phone now if you want to queue device enrollment right away. It&apos;s optional, and
        the account can still be provisioned without it.
      </p>

      {/* Add phone form */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Register a phone
        </p>
        <div className="space-y-2">
          <Input
            placeholder="Device label (e.g. Jane's iPhone 15)"
            value={phoneName}
            onChange={(e) => setPhoneName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addPhone(); }}
          />
          <Input
            placeholder="Phone number (optional, for enrolment SMS)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addPhone(); }}
          />
        </div>
        <Button
          type="button"
          onClick={addPhone}
          disabled={!phoneName.trim()}
          size="sm"
          className="w-full gap-1.5"
        >
          <Smartphone className="h-3.5 w-3.5" />
          Add phone
        </Button>
      </div>

      {/* Registered phones list */}
      {data.phones.length > 0 ? (
        <div className="space-y-2">
          {data.phones.map((phone) => (
            <div
              key={phone.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
            >
              <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{phone.name}</p>
                {phone.number && (
                  <p className="text-xs text-muted-foreground font-mono">{phone.number}</p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                Mobile
              </Badge>
              <button
                type="button"
                onClick={() => removePhone(phone.id)}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors text-xs shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 py-8 flex flex-col items-center gap-2 text-muted-foreground">
          <Smartphone className="h-7 w-7" />
          <p className="text-sm">No phone registered</p>
          <p className="text-xs">Can be added later from the user profile</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-step: Review
// ---------------------------------------------------------------------------

function ReviewStep({ data }: { data: OnboardingData }) {
  const roleLabel = ROLES.find((r) => r.value === data.role)?.label ?? "—";
  const pw = data.mailboxPassword ?? "";
  const maskedPassword = "•".repeat(Math.min(pw.length, 12));

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Name",       value: data.displayName || "—" },
    { label: "Job title",  value: data.jobTitle || "—" },
    { label: "Department", value: data.department || "—" },
    { label: "Role",       value: roleLabel },
    { label: "Mailbox",    value: `${data.mailboxAlias}@${data.mailboxDomain}` },
    { label: "Password",   value: <span className="font-mono tracking-widest">{maskedPassword || "—"}</span> },
    {
      label: "Phones",
      value: data.phones.length > 0
        ? data.phones.map((p) => p.name).join(", ")
        : "None registered",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Avatar summary */}
      <div className="flex items-center gap-4 rounded-lg bg-muted/40 px-4 py-3">
        <Avatar className="h-12 w-12 ring-1 ring-border">
          <AvatarImage src={data.avatarUrl ?? undefined} />
          <AvatarFallback className="text-sm bg-muted">
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Provisioning summary</p>
          <p className="font-medium font-mono text-sm">
            {data.mailboxAlias}@{data.mailboxDomain}
          </p>
          <p className="text-xs text-muted-foreground">{data.jobTitle || "No job title"}</p>
        </div>
        <Badge variant="secondary" className="ml-auto capitalize">
          {data.role || "No role"}
        </Badge>
      </div>

      {/* Detail rows */}
      <div className="divide-y divide-border rounded-lg border overflow-hidden">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center px-4 py-2.5 text-sm">
            <span className="w-28 text-muted-foreground shrink-0 text-xs">{label}</span>
            <span className="text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-dashed border-muted-foreground/20 px-4 py-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/60 mb-0.5">On confirmation</p>
        <p>
          Mailbox creation, onboarding status, and the final handoff are submitted in one pass.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main OnboardingFlow component
// ---------------------------------------------------------------------------

export default function OnboardingFlow({ initialData, callbackUrl }: OnboardingFlowProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex]       = useState(0);
  const [direction, setDirection]       = useState<1 | -1>(1);
  const [data, setData]                 = useState<OnboardingData>(() => initData(initialData));
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [complete, setComplete]         = useState(false);

  useEffect(() => {
    if (!complete) return;

    const timeout = window.setTimeout(() => {
      router.replace("/dashboard");
    }, 1300);

    return () => window.clearTimeout(timeout);
  }, [complete, router]);

  const currentStep = STEPS[stepIndex];
  const progress    = ((stepIndex + 1) / STEPS.length) * 100;

  const stepState = [
    {
      label: "Profile",
      done: data.displayName.trim().length > 0,
      detail: data.displayName.trim() || "Add the user's name",
      icon: UserCircle,
    },
    {
      label: "Role",
      done: data.role !== "",
      detail: data.role ? ROLES.find((role) => role.value === data.role)?.label ?? "Assigned" : "Choose access level",
      icon: Shield,
    },
    {
      label: "Mailbox",
      done: data.mailboxAlias.trim().length > 0 && data.mailboxPassword.trim().length >= 8,
      detail: data.mailboxAlias
        ? `${data.mailboxAlias}@${data.mailboxDomain}`
        : "Set the sign-in address",
      icon: Mail,
    },
    {
      label: "Devices",
      done: data.phones.length > 0,
      detail: data.phones.length > 0 ? `${data.phones.length} queued` : "Optional",
      icon: Smartphone,
    },
  ];

  const completedSteps = stepState.filter((step) => step.done).length;
  const readyForReview = completedSteps >= 3;

  function patch(p: Partial<OnboardingData>) {
    setData((prev) => {
      const next = { ...prev, ...p };

      if (p.displayName !== undefined) {
        const previousSuggestion = suggestMailboxAlias(prev.displayName);
        const nextSuggestion = suggestMailboxAlias(p.displayName);

        if (!prev.mailboxAlias.trim() || prev.mailboxAlias === previousSuggestion) {
          next.mailboxAlias = nextSuggestion;
        }
      }

      return next;
    });
  }

  function canAdvance(): boolean {
    switch (currentStep.id as StepId) {
      case "profile":
        return data.displayName.trim().length > 0;
      case "role":
        return data.role !== "";
      case "mailbox":
        return (
          data.mailboxAlias.trim().length > 0 &&
          (data.mailboxPassword ?? "").trim().length >= 8
        );
      default:
        return true;
    }
  }

  function goNext() {
    if (stepIndex >= STEPS.length - 1) return;
    setDirection(1);
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    if (stepIndex === 0) return;
    setDirection(-1);
    setStepIndex((i) => i - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/mailbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Credentials": "include" },
        body: JSON.stringify({
          email: `${data.mailboxAlias}@${data.mailboxDomain}`,
          password: data.mailboxPassword,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload?.error ?? "Mailbox creation failed");
      }

      const onboardRes = await fetch("/api/users/onboarded", {
        method: "POST",
      });

      if (!onboardRes.ok) {
        throw new Error("Failed to update onboarding status");
      }

      setComplete(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------
  if (complete) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_35%)]" />
        <Card className="relative w-full max-w-xl border-border/70 bg-card/95 shadow-xl backdrop-blur">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <CardTitle>Setup complete</CardTitle>
            <CardDescription>
              Fortmont is finishing the account handoff now. You will be returned to the dashboard
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <ShieldCheck className="mb-2 h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-wider">Access</p>
                <p className="mt-1 text-foreground">Role assigned</p>
              </div>
              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <MailCheck className="mb-2 h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-wider">Mailbox</p>
                <p className="mt-1 text-foreground">{data.mailboxAlias}@{data.mailboxDomain}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <LayoutDashboard className="mb-2 h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-wider">Next</p>
                <p className="mt-1 text-foreground">Dashboard</p>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              If the redirect does not happen, use the button below.
            </p>
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => router.replace(callbackUrl || "/dashboard")}
                className="gap-1.5"
              >
                {callbackUrl ? "Continue to app" : "Go to dashboard"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(2,132,199,0.08),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-border/60 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Onboarding
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Set up this user</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Complete the essentials once, then Fortmont will take care of the mailbox, access,
              and onboarding state.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {completedSteps}/{stepState.length} essentials done
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-muted-foreground">
              {readyForReview ? "Ready for review" : "Collecting details"}
            </Badge>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Setup progress</CardTitle>
                    <CardDescription>
                      Current setup progress and remaining steps.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    Step {stepIndex + 1} of {STEPS.length}
                  </Badge>
                </div>
                <Progress value={progress} className="h-1.5" />
              </CardHeader>
              <CardContent className="space-y-3 pb-6">
                {stepState.map((step, index) => {
                  const Icon = step.icon;
                  const active = index === stepIndex;

                  return (
                    <button
                      key={step.label}
                      type="button"
                      disabled={index > stepIndex}
                      onClick={() => {
                        if (index < stepIndex) {
                          setDirection(-1);
                          setStepIndex(index);
                        }
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all",
                        active
                          ? "border-primary/40 bg-primary/5"
                          : step.done
                          ? "border-border bg-muted/30 hover:bg-muted/50"
                          : "border-border/60 bg-background/70 opacity-70",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : step.done
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-border bg-muted text-muted-foreground"
                        )}
                      >
                        {step.done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{step.label}</p>
                          {active && <Badge variant="outline" className="rounded-full text-[10px]">Now</Badge>}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{step.detail}</p>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/90 shadow-sm backdrop-blur">
              <CardHeader>
                <CardTitle className="text-base">Provisioning includes</CardTitle>
                <CardDescription>
                  Mailbox, role, and account handoff.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pb-6 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <MailCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Mailbox and initial password provisioning.</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Role assignment for access-controlled screens.</span>
                </div>
                <div className="flex items-start gap-2">
                  <LayoutDashboard className="mt-0.5 h-4 w-4 text-primary" />
                  <span>Onboarding flag so the user lands in the dashboard next time.</span>
                </div>
              </CardContent>
            </Card>
          </aside>

          <Card className="border-border/70 bg-card/95 shadow-sm backdrop-blur">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = currentStep.icon;
                  return <Icon className="h-4 w-4 text-muted-foreground" />;
                })()}
                <CardTitle className="text-base">{currentStep.label}</CardTitle>
                {currentStep.id === "mailbox" && (
                  <Badge variant="destructive" className="ml-auto rounded-full text-[10px]">
                    Required
                  </Badge>
                )}
              </div>
              <CardDescription>
                {currentStep.id === "profile" && "Add the basics Fortmont will use everywhere."}
                {currentStep.id === "role" && "Pick the access level before you continue."}
                {currentStep.id === "mailbox" && "Create the mailbox and its initial password."}
                {currentStep.id === "devices" && "Optionally queue device enrollment now."}
                {currentStep.id === "review" && "Check the final summary before provisioning."}
              </CardDescription>
            </CardHeader>

            <CardContent className="min-h-90 px-6 py-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                >
                  {currentStep.id === "profile" && <ProfileStep data={data} onChange={patch} />}
                  {currentStep.id === "role"    && <RoleStep    data={data} onChange={patch} />}
                  {currentStep.id === "mailbox" && <MailboxStep data={data} onChange={patch} />}
                  {currentStep.id === "devices" && <DevicesStep data={data} onChange={patch} />}
                  {currentStep.id === "review"  && <ReviewStep  data={data} />}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={goBack}
                disabled={stepIndex === 0}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {currentStep.id !== "review" ? (
                <Button
                  size="sm"
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvance()}
                  className="gap-1.5"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  {submitError && <p className="text-xs text-destructive">{submitError}</p>}
                  <Button
                    size="sm"
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="gap-1.5"
                  >
                    {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {submitting ? "Provisioning…" : "Confirm & provision"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}