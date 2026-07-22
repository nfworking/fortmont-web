"use client"

import type { ComponentProps } from "react"
import { DashboardSidebar } from "@fortmont/fortmont-ui"

type AppSidebarProps = ComponentProps<typeof DashboardSidebar>

export function AppSidebar(props: AppSidebarProps) {
  return <DashboardSidebar {...props} />
}