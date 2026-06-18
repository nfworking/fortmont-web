"use client";

import { DnsRecord } from "./types";

type Props = {
  records: DnsRecord[];
};

export function DnsRecordsTable({ records }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <table className="min-w-full table-auto">
        <thead className="bg-background/40 ">
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
          {records.length === 0 ? (
            <tr>
              <td
                className="px-4 py-6 text-sm text-muted-foreground"
                colSpan={5}
              >
                No DNS records found.
              </td>
            </tr>
          ) : (
            records.map((entry) => (
              <tr
                key={`${entry.name}-${entry.type}-${entry.ttl}`}
                className="border-t border-border/60"
              >
                <td className="px-4 py-3 text-sm font-medium">
                  {entry.name}
                </td>

                <td className="px-4 py-3 text-sm">
                  {entry.ttl}
                </td>

                <td className="px-4 py-3 text-sm">
                  {entry.type}
                </td>

                <td className="px-4 py-3 text-sm">
                  {entry.rData?.ipAddress ?? "-"}
                </td>

                <td className="px-4 py-3 text-sm">
                  {entry.disabled ? "Yes" : "No"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}