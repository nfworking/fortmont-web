import { TicketDashboard } from '@/components/ticketing/admin/ticket-dashboard';

export default async function DashboardPage() {
  const res = await fetch("https://api.fortmont.me/api/ticketing/get/ticket", {
    cache: "no-store",
    credentials: "include",
  });

  const tickets = await res.json();

  return <TicketDashboard tickets={tickets} />;
}