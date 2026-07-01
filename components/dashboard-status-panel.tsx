"use client";

import { useEffect, useState } from "react";
import { DashboardHero, DashboardPage, DashboardSection } from "@/components/dashboard/page-shell";

// Type definition for the LXC data structure
type LxcRecord = {
  lxc_ip: string | null;
  lxc_status: string | null;
  lxc_role: string | null;
  lxc_compose_status: string | null;
  created_at: string | null;
  lxc_unique_id: string;
};

export default function DashboardStatusPanel() {
  const [lxcs, setLxcs] = useState<LxcRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/proxy/containers"); // or your specific container endpoint

        if (!res.ok) {
          setLxcs([]);
          return;
        }

        const data = await res.json();
        setLxcs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load LXC container info:", error);
        setLxcs([]);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="Fortmont API"
        title="Registry and LXC overview"
        description="Live status pulled from the container endpoint."
        badge={
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {lxcs.length} {lxcs.length === 1 ? "container" : "containers"}
          </span>
        }
      />

      <DashboardSection
        title="LXC info"
        description="Container state and deployment context from the LXC endpoint."
      >
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-background/40 backdrop-blur">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">IP</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compose Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created At</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unique ID</th>
              </tr>
            </thead>
            <tbody>
              {lxcs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground text-center" colSpan={6}>
                    {isLoading ? "Fetching container records..." : "No records found."}
                  </td>
                </tr>
              ) : (
                lxcs.map((lxc) => (
                  <tr key={lxc.lxc_unique_id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-foreground">{lxc.lxc_ip ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        lxc.lxc_status?.toLowerCase() === "running" || lxc.lxc_status?.toLowerCase() === "active"
                          ? "bg-emerald-500/10 text-emerald-600" 
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        {lxc.lxc_status ?? "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{lxc.lxc_role ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{lxc.lxc_compose_status ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {lxc.created_at ? new Date(lxc.created_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground max-w-[120px] truncate" title={lxc.lxc_unique_id}>
                      {lxc.lxc_unique_id ?? "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardSection>
    </DashboardPage>
  );
}