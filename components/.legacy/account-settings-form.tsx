"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccountSettingsFormProps = {
  user: {
    id: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
  };
  hasMailbox?: boolean;

};

export function AccountSettingsForm({ user, hasMailbox = false }: AccountSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialValues = useMemo(
    () => ({
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      avatarUrl: user.avatarUrl ?? "",
    }),
    [user.avatarUrl, user.displayName, user.email, user.phone],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      displayName: formData.get("displayName")?.toString() ?? null,
      email: formData.get("email")?.toString() ?? null,
      phone: formData.get("phone")?.toString() ?? null,
      avatarUrl: formData.get("avatarUrl")?.toString() ?? null,
    };

    startTransition(async () => {
      const response = await fetch(`/api/auth?id=${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Unable to save account settings.");
        return;
      }

      setMessage("Account settings saved.");
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" name="displayName" defaultValue={initialValues.displayName} placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" defaultValue={initialValues.email} placeholder="you@example.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={initialValues.phone} placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input id="avatarUrl" name="avatarUrl" defaultValue={initialValues.avatarUrl} placeholder="https://..." />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Changes are saved directly to the database-backed account record.</p>
          <p>Clearing a field and saving will remove that value.</p>
        </div>
        <div className="flex items-center gap-2">
  <Button type="submit" disabled={isPending}>
    {isPending ? "Saving..." : "Save changes"}
  </Button>

  {!hasMailbox && (
    <Button
      type="button"
      variant="outline"
      onClick={() => router.push("/onboard/mailbox")}
    >
      Link mailbox
    </Button>
  )}
</div>
      </div>

      {message ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}