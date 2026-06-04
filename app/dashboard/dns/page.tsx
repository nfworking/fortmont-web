import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Fortmont DNS",
  description: "Dashboard for managing your Fortmont DNS settings.",
};

import { DnsTable } from "@/components/dns/dns-table";

export default function DnsPage() {
  return <DnsTable />;
}