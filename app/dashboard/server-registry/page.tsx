import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Fortmont Server Registry",
  description: "Registry for managing your Fortmont servers.",
};

import { ServerRegistryTable } from "@/components/server-registry-table";

export default function ServerRegistryPage() {
  return <ServerRegistryTable />;
}