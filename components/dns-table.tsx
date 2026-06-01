"use client";

import { useCallback, useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DnsRecord = {
  name: string;
  type: string;
  ttl: number;
  disabled: boolean;
  rData?: {
    ipAddress?: string;
  };
};

type DnsApiResponse = {
  response?: {
    zone?: {
      name: string;
    };
    records?: DnsRecord[];
  };
  server?: string;
  status?: string;
};

type CreateDnsRecordForm = {
  zone: string;
  domain: string;
  type: string;
  ttl: string;
  ipAddress: string;
};



export function DnsTable() {
  const [dnsEntries, setDnsEntries] = useState<DnsRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateDnsRecordForm>({
    zone: "fortmont.me",
    domain: "",
    type: "A",
    ttl: "3600",
    ipAddress: "",
  });

  const loadDnsEntries = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const res = await fetch("/api/dns");

      if (!res.ok) {
        setDnsEntries([]);
        return;
      }

      const data = (await res.json()) as DnsApiResponse;
      setDnsEntries(Array.isArray(data.response?.records) ? data.response.records : []);
      setLastRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleCreateDnsRecord = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsCreating(true);
      setCreateError(null);

      try {
        const res = await fetch("/api/dns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            zone: createForm.zone.trim(),
            domain: createForm.domain.trim(),
            type: createForm.type,
            ttl: Number(createForm.ttl),
            ipAddress: createForm.ipAddress.trim(),
          }),
        });

        if (!res.ok) {
          let details = "Failed to create DNS record";

          try {
            const payload = (await res.json()) as { error?: string; details?: string };
            details = payload.details ?? payload.error ?? details;
          } catch {
            const text = await res.text();
            if (text) {
              details = text;
            }
          }

          throw new Error(details);
        }

        setIsCreateOpen(false);
        setCreateForm((current) => ({
          ...current,
          domain: "",
          ipAddress: "",
        }));
        toast.success("DNS record created");
        await loadDnsEntries();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create DNS record";
        setCreateError(message);
        toast.error(message);
      } finally {
        setIsCreating(false);
      }
    },
    [createForm.domain, createForm.ipAddress, createForm.ttl, createForm.type, createForm.zone, loadDnsEntries]
  );

  useEffect(() => {
    void loadDnsEntries();

    const intervalId = window.setInterval(() => {
      void loadDnsEntries();
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [loadDnsEntries]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="rounded-2xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              FortmontAPI
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              DNS overview
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              DNS records from your configured server and endpoint
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {dnsEntries.length} records
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">DNS Entries</h2>
            <p className="text-sm text-muted-foreground">
              {lastRefreshedAt ? `Last refreshed at ${lastRefreshedAt.toLocaleTimeString()}` : "Loading records..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadDnsEntries()}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh now"}
            </Button>

            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <SheetTrigger asChild>
                <Button type="button" className="gap-1.5">
                  <PlusIcon className="size-4" />
                  Add DNS record
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-full sm:max-w-xl">
                <form className="flex h-full flex-col" onSubmit={handleCreateDnsRecord}>
                  <SheetHeader className="border-b border-border/60 px-6 py-5">
                    <SheetTitle>Add DNS record</SheetTitle>
                    <SheetDescription>
                      Create a new record and push it to the configured DNS endpoint.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field className="sm:col-span-2">
                        <FieldLabel htmlFor="zone">Zone</FieldLabel>
                        <FieldContent>
                          <Input
                            id="zone"
                            name="zone"
                            value={createForm.zone}
                            onChange={(event) =>
                              setCreateForm((current) => ({ ...current, zone: event.target.value }))
                            }
                            placeholder="fortmont.me"
                            required
                          />
                        </FieldContent>
                        <FieldDescription>The DNS zone this record belongs to.</FieldDescription>
                      </Field>

                      <Field className="sm:col-span-2">
                        <FieldLabel htmlFor="domain">Domain</FieldLabel>
                        <FieldContent>
                          <Input
                            id="domain"
                            name="domain"
                            value={createForm.domain}
                            onChange={(event) =>
                              setCreateForm((current) => ({ ...current, domain: event.target.value }))
                            }
                            placeholder="test.fortmont.me"
                            required
                          />
                        </FieldContent>
                        <FieldDescription>The host or subdomain you want to add.</FieldDescription>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="type">Type</FieldLabel>
                        <FieldContent>
                          <Select
                            value={createForm.type}
                            onValueChange={(value) =>
                              setCreateForm((current) => ({ ...current, type: value }))
                            }
                          >
                            <SelectTrigger id="type" className="w-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {['A', 'AAAA', 'CNAME', 'MX', 'NS', 'SOA', 'TXT'].map((item) => (
                                <SelectItem key={item} value={item}>
                                  {item}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldContent>
                        <FieldDescription>Record type to create.</FieldDescription>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="ttl">TTL</FieldLabel>
                        <FieldContent>
                          <Input
                            id="ttl"
                            name="ttl"
                            type="number"
                            min={60}
                            step={1}
                            value={createForm.ttl}
                            onChange={(event) =>
                              setCreateForm((current) => ({ ...current, ttl: event.target.value }))
                            }
                            required
                          />
                        </FieldContent>
                        <FieldDescription>Time to live in seconds.</FieldDescription>
                      </Field>

                      <Field className="sm:col-span-2">
                        <FieldLabel htmlFor="ipAddress">IP Address</FieldLabel>
                        <FieldContent>
                          <Input
                            id="ipAddress"
                            name="ipAddress"
                            value={createForm.ipAddress}
                            onChange={(event) =>
                              setCreateForm((current) => ({ ...current, ipAddress: event.target.value }))
                            }
                            placeholder="192.168.1.50"
                            required={createForm.type === "A" || createForm.type === "AAAA"}
                          />
                        </FieldContent>
                        <FieldDescription>
                          For A records, this is the IP address passed as <span className="font-medium">rData</span>.
                        </FieldDescription>
                      </Field>
                    </div>

                    {createError ? (
                      <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {createError}
                      </p>
                    ) : null}
                  </div>

                  <SheetFooter className="border-t border-border/60 px-6 py-5">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <SheetClose asChild>
                        <Button type="button" variant="outline" disabled={isCreating}>
                          Cancel
                        </Button>
                      </SheetClose>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creating..." : "Create record"}
                      </Button>
                    </div>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="min-w-full table-auto">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  TTL
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Disabled
                </th>
              </tr>
            </thead>
            <tbody>
              {dnsEntries.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                    No DNS records found.
                  </td>
                </tr>
              ) : (
                dnsEntries.map((entry) => (
                  <tr key={`${entry.name}-${entry.type}-${entry.ttl}`} className="border-t border-border/60">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{entry.name}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{entry.ttl}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{entry.type}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {entry.rData?.ipAddress ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {entry.disabled ? "Yes" : "No"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}