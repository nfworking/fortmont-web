# @fortmont/fortmont-ui

Reusable dashboard shell components for Next.js apps.

## What it exports

- `DashboardShell`
- `DashboardSidebar`
- `DashboardNavbar`
- `DashboardProfileBar`
- `DEFAULT_DASHBOARD_NAVIGATION`
- `DEFAULT_DASHBOARD_SECTIONS`

## Requirements

- Next.js 16+
- React 19+
- next-auth 5+
- Tailwind CSS classes available in the consuming app

## Example

```tsx
import { DashboardShell } from "@fortmont/fortmont-ui"

export default function Page() {
  return <DashboardShell user={{ name: "Cal" }}>Hello</DashboardShell>
}
```

This package is intended for Next.js applications because it depends on `next/link`, `next/navigation`, and `next-auth/react`.