"use client";

import { useCallback, useEffect, useState } from "react";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CreateDnsRecordDialog } from "./create-dns-record-dialog";
import { DnsRecordsTable } from "./dns-records-table";

import {
  DnsApiResponse,
  DnsRecord,
} from "./types";

export function DnsTable() {
  const [dnsEntries, setDnsEntries] =
    useState<DnsRecord[]>([]);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [lastRefreshedAt, setLastRefreshedAt] =
    useState<Date | null>(null);

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const loadDnsEntries = useCallback(
    async () => {
      setIsRefreshing(true);

      try {
        const res = await fetch("/api/dns");

        if (!res.ok) {
          setDnsEntries([]);
          return;
        }

        const data =
          (await res.json()) as DnsApiResponse;

        setDnsEntries(
          Array.isArray(
            data.response?.records
          )
            ? data.response.records
            : []
        );

        setLastRefreshedAt(new Date());
      } finally {
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDnsEntries();

    const intervalId =
      window.setInterval(() => {
        void loadDnsEntries();
      }, 60000);

    return () =>
      window.clearInterval(intervalId);
  }, [loadDnsEntries]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* header unchanged */}

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              DNS Entries
            </h2>

            <p className="text-sm text-muted-foreground">
              {lastRefreshedAt
                ? `Last refreshed at ${lastRefreshedAt.toLocaleTimeString()}`
                : "Loading records..."}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                void loadDnsEntries()
              }
              disabled={isRefreshing}
            >
              {isRefreshing
                ? "Refreshing..."
                : "Refresh"}
            </Button>

            <Button
              onClick={() =>
                setIsCreateOpen(true)
              }
            >
              <PlusIcon className="mr-2 size-4" />
              Add Record
            </Button>
          </div>
        </div>

        <DnsRecordsTable
          records={dnsEntries}
        />
      </section>

      <CreateDnsRecordDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={loadDnsEntries}
      />
    </main>
  );
}