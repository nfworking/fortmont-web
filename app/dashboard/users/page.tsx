import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Fortmont Users",
  description: "Dashboard for managing your Fortmont users.",
};

import { UsersTable } from "./users-table";

export default function UsersPage() {
  return <UsersTable />;
}