"use client"

import { DashboardProfileBar } from "@fortmont/fortmont-ui"
import { useSession } from "next-auth/react"

export function NavUser() {
  const { data: session } = useSession()

  return (
    <DashboardProfileBar
      user={{
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        avatar: session?.user?.image ?? "",
      }}
    />
  )
}