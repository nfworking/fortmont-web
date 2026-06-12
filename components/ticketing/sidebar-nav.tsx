"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { sidebarConfig } from "./sidebar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function SidebarNav() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<string[]>(() =>
    sidebarConfig.map((s) => s.title)
  );

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-4rem)] pb-8">
      <nav className="flex flex-col gap-1 p-4">
        {sidebarConfig.map((section) => (
          <Collapsible
            key={section.title}
            open={openSections.includes(section.title)}
            onOpenChange={() => toggleSection(section.title)}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors">
              {section.title}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  openSections.includes(section.title) && "rotate-180"
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1">
              <div className="flex flex-col gap-0.5 pl-2 border-l border-border ml-3">
                {section.items.map((item) => (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                      pathname === item.url
                        ? "bg-foreground text-background font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {item.title}
                    {item.badge && (
                      <Badge
                        variant="outline"
                        className="ml-auto rounded px-1.5 py-0 text-[10px] font-normal"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
    </ScrollArea>
  );
}
