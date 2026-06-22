"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
    Globe,
    Layout,
    Server,
    Plus,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Button } from "../ui/button"
import { useTicketModal } from "@/components/ticket-modal-context"

export function CommandDemo() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { openTicketModal } = useTicketModal() // <-- Use the global hook
  

  // Listen for the '/' keypress to trigger the modal
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Handle routing and close the menu
  const handleNavigation = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={() => setOpen(true)} variant="outline" className="w-fit">
        Open Menu{" "}
        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          /
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => handleNavigation("/dashboard")}>
              <Layout className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/dashboard/server-settings")}>
              <Server className="mr-2 h-4 w-4" />
              <span>Server Settings</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/dashboard/users")}>
              <Calculator className="mr-2 h-4 w-4" />
              <span>Users</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/dashboard/dns")}>
              <Globe className="mr-2 h-4 w-4" />
              <span>DNS</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/dashboard/proxy")}>
              <Globe className="mr-2 h-4 w-4" />
              <span>Proxy</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/dashboard/certs")}>
              <Globe className="mr-2 h-4 w-4" />
              <span>SSL Certs</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/dashboard/entra")}>
              <Globe className="mr-2 h-4 w-4" />
              <span>Azure</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/webmail")}>
              <Globe className="mr-2 h-4 w-4" />
              <span>Webmail</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/admin_ticketing/dashboard")}>
              <Globe className="mr-2 h-4 w-4" />
              <span>Tickets</span>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/apps")}>
              <Globe className="mr-2 h-4 w-4" />
              <span>Apps</span>
            </CommandItem>

          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Commands">
            <CommandItem onSelect={() => handleNavigation("/dashboard/create-ticket")}>
              <User className="mr-2 h-4 w-4" />
              <span>Create Ticket</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/billing")}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleNavigation("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          
      <CommandGroup heading="Actions">
      <CommandItem 
        onSelect={() => {
          // 1. Fire up the modal immediately on the current active page
          openTicketModal() 
          
          // 2. Clear out the command bar menu overlay
          setOpen(false) 
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span>Create New Ticket</span>
      </CommandItem>
    </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}