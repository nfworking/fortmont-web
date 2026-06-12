"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { sidebarConfig } from "./sidebar";
import { Search, File, BookOpen, ArrowRight } from "lucide-react";

interface SearchCommandProps {
  user?: {
    username: string;
    email: string;
    avatarUrl: string;
  } | null;
}

export function SearchCommand({ user }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors w-full max-w-xs"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search docs...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-70 sm:flex">
          <span className="text-xs">Cmd</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() =>
                runCommand(() => (window.location.href = "/docs"))
              }
            >
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Go to Documentation</span>
            </CommandItem>
            {user && (
              <CommandItem
                onSelect={() =>
                  runCommand(() => (window.location.href = "/settings"))
                }
              >
                <File className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </CommandItem>
            )}
          </CommandGroup>
          <CommandSeparator />
          {sidebarConfig.map((section) => (
            <CommandGroup key={section.title} heading={section.title}>
              {section.items.map((item) => (
                <CommandItem
                  key={item.url}
                  onSelect={() =>
                    runCommand(() => (window.location.href = item.url))
                  }
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
