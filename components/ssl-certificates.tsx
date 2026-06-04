"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type Cert = {
  main: string;
  not_after: string;
  resolver: string;
  sans: string[];
};

type ProxyApiResponse = {
  certs?: Cert[];
};

export default function ProxyPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const loadCerts = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const res = await fetch("/api/proxy/certs");

      if (!res.ok) {
        setCerts([]);
        return;
      }

      const data = (await res.json()) as ProxyApiResponse;

      setCerts(Array.isArray(data.certs) ? data.certs : []);
      setLastRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCerts();
  }, [loadCerts]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="rounded-2xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              FortmontAPI
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Certificate overview
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Certificates pulled from the /api/proxy/certs endpoint.
            </p>
          </div>

          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {certs.length} certs
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Certificates
            </h2>
            <p className="text-sm text-muted-foreground">
              {lastRefreshedAt
                ? `Last refreshed at ${lastRefreshedAt.toLocaleTimeString()}`
                : "Loading certificates..."}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void loadCerts()}
            disabled={isRefreshing}
          >
            <RefreshCwIcon
              className={isRefreshing ? "size-4 animate-spin" : "size-4"}
            />
            {isRefreshing ? "Refreshing..." : "Refresh now"}
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="min-w-full table-auto">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Domain
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resolver
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Expiry
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  SANs
                </th>
              </tr>
            </thead>

            <tbody>
              {certs.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-muted-foreground"
                    colSpan={4}
                  >
                    No certificates found.
                  </td>
                </tr>
              ) : (
                certs.map((cert) => (
                  <tr
                    key={`${cert.main}-${cert.not_after}`}
                    className="border-t border-border/60"
                  >
                    <td className="px-4 py-3 text-sm text-foreground">
                      {cert.main}
                    </td>

                    <td className="px-4 py-3 text-sm text-foreground">
                      {cert.resolver}
                    </td>

                    <td className="px-4 py-3 text-sm text-foreground">
                      {new Date(cert.not_after).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-sm text-foreground">
                      {cert.sans.length > 0 ? cert.sans.join(", ") : "-"}
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