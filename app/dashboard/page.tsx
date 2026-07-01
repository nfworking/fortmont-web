

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { DashboardHero, DashboardPage, DashboardSection } from "@/components/dashboard/page-shell";
import { SectionCards } from "@/components/section-cards";

export default function Page() {
  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="Fortmont API"
        title="Dashboard"
        description="A consistent overview of platform health, Proxmox resources, and resource activity."
      />

      <SectionCards />

      <DashboardSection
        title="Cluster activity"
        description="Live CPU, memory, and network trends from the Proxmox cluster."
      >
        <ChartAreaInteractive />
      </DashboardSection>

      <DashboardSection
        title="Resource inventory"
        description="Search, filter, and reorder the resources currently exposed by the API."
      >
        <DataTable />
      </DashboardSection>
    </DashboardPage>
  );
}
