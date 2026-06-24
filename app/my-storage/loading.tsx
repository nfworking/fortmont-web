// app/dashboard/loading.tsx
import { AppShell } from "@/components/storage/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <AppShell title="Dashboard">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="mt-4 h-72 rounded-lg" />
    </AppShell>
  );
}