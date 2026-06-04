"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CreateDnsRecordForm } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
};

export function CreateDnsRecordDialog({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateDnsRecordForm>({
    zone: "fortmont.me",
    domain: "",
    type: "A",
    ttl: "3600",
    ipAddress: "",
  });

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setIsCreating(true);

    try {
      const res = await fetch("/api/dns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zone: form.zone.trim(),
          domain: form.domain.trim(),
          type: form.type,
          ttl: Number(form.ttl),
          ipAddress: form.ipAddress.trim(),
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);

        throw new Error(
          payload?.details ??
            payload?.error ??
            "Failed to create DNS record"
        );
      }

      toast.success("DNS record created");

      setForm((current) => ({
        ...current,
        domain: "",
        ipAddress: "",
      }));

      onOpenChange(false);

      await onCreated();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create DNS record";

      setError(message);
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-lg
          p-0
          overflow-hidden
          rounded-3xl
          bg-background/95
          backdrop-blur-xl
        "
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b px-8 py-6">
            <DialogTitle>Create DNS Record</DialogTitle>

            <DialogDescription>
              Add a new DNS record to your zone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 p-8">
            <div className="rounded-2xl border p-5">
              <h3 className="font-semibold">Record Details</h3>

              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Zone</FieldLabel>

                    <FieldContent>
                      <Input
                        value={form.zone}
                        onChange={(e) =>
                          setForm({ ...form, zone: e.target.value })
                        }
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Domain</FieldLabel>

                    <FieldContent>
                      <Input
                        value={form.domain}
                        onChange={(e) =>
                          setForm({ ...form, domain: e.target.value })
                        }
                      />
                    </FieldContent>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Type</FieldLabel>

                    <FieldContent>
                      <Select
                        value={form.type}
                        onValueChange={(value) =>
                          setForm({ ...form, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          {["A", "AAAA", "CNAME", "MX", "NS", "TXT"].map(
                            (item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>TTL</FieldLabel>

                    <FieldContent>
                      <Input
                        type="number"
                        value={form.ttl}
                        onChange={(e) =>
                          setForm({ ...form, ttl: e.target.value })
                        }
                      />
                    </FieldContent>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Target</FieldLabel>

                  <FieldContent>
                    <Input
                      value={form.ipAddress}
                      placeholder="192.168.1.50"
                      onChange={(e) =>
                        setForm({ ...form, ipAddress: e.target.value })
                      }
                    />
                  </FieldContent>

                  <FieldDescription>
                    Destination value for the record.
                  </FieldDescription>
                </Field>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {form.domain || "hostname"}
              </span>
              <span>Type: {form.type}</span>
              <span>TTL: {form.ttl}</span>
              <span>→ {form.ipAddress || "target"}</span>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Record"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}