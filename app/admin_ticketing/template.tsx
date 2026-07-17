"use client";

import { PageTransition } from "@/components/ui/page-transition";
import React from "react";

export default function AdminTicketingTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
