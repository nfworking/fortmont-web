"use client";

import { PageTransition } from "@/components/ui/page-transition";
import React from "react";

export default function PlatformAccountTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
