

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { DashboardHero, DashboardPage, DashboardSection } from "@/components/dashboard/page-shell";
import { SectionCards } from "@/components/section-cards";
import { SystemStatusPanel } from "@/components/dashboard_res/status";
import TicketOverviewCard from "@/components/dashboard_res/ticket_overview";

export default function Page() {
  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="Fortmont API"
        title="Dashboard"
        description="A consistent overview of platform health, Proxmox resources, and resource activity."
      />
      <div className=" gap-10 sm:flex flex-row  ">
     
      <SystemStatusPanel />
       <SectionCards />
       <TicketOverviewCard />
      </div>

      <DashboardSection
        title="Resource inventory"
        description="Search, filter, and reorder the resources currently exposed by the API."
      >
        <DataTable />
      </DashboardSection>
    </DashboardPage>
  );
}
