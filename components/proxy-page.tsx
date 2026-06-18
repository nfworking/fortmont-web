"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCwIcon } from "lucide-react";
import {toast} from "sonner";

import { Button } from "@/components/ui/button";

type ProxyApp = {
  enabled: boolean;
  entryPoints: string[];
  id: string;
  rule: string;
  target: string;
};

type ProxyApiResponse = {
  apps?: ProxyApp[];
  middlewares?: unknown[];
};

export default function ProxyPage() {
  const [apps, setApps] = useState<ProxyApp[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const loadProxyApps = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const res = await fetch("/api/proxy/routes");

      if (!res.ok) {
        setApps([]);
        return;
      }

      const data = (await res.json()) as ProxyApiResponse;
      setApps(Array.isArray(data.apps) ? data.apps : []);
      setLastRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProxyApps();
  }, [loadProxyApps]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="rounded-2xl border border-border/60 backdrop-blur bg-background/40  p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              FortmontAPI
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Proxy overview
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Proxy applications pulled from the /api/proxy endpoint.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {apps.length} apps
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 backdrop-blur bg-background/40 p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Proxy Apps</h2>
            <p className="text-sm text-muted-foreground">
              {lastRefreshedAt ? `Last refreshed at ${lastRefreshedAt.toLocaleTimeString()}` : "Loading apps..."}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void loadProxyApps()} disabled={isRefreshing}>
            <RefreshCwIcon className={isRefreshing ? "size-4 animate-spin" : "size-4"} />
            {isRefreshing ? "Refreshing..." : "Refresh now"}
          </Button>
          
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="min-w-full table-auto">
            <thead className="bg-background/0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Enabled
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Entry Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rule
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Target
                </th>
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                    No proxy apps found.
                  </td>
                </tr>
              ) : (
                apps.map((app) => (
                  <tr key={app.id} className="border-t border-border/60">
                    <td className="px-4 py-3 text-sm text-foreground">
                      <span className={app.enabled ? "rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600" : "rounded-full bg-destructive/10 px-2 py-1 text-destructive"}>
                        {app.enabled ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {app.entryPoints.length > 0 ? app.entryPoints.join(", ") : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{app.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{app.rule}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{app.target}</td>
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