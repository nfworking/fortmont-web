import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Fortmont LXC Registry",
  description: "Registry for managing your Fortmont LXC containers.",
};

import { LxcRegistryTable } from "@/components/lxc-registry-table";

export default function LxcRegistryPage() {
  return <LxcRegistryTable />;
}