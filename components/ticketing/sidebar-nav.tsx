"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface SidebarNavProps {
  articles: {
    title: string;
    slug: string;
  }[];
}

export function SidebarNav({ articles }: SidebarNavProps) {
  const pathname = usePathname();

  const sidebarConfig = [
    {
      title: "Articles",
      items: articles.map((article) => ({
        title: article.title,
        url: `/ticketing/kba/${article.slug}`,
      })),
    },
  ];

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
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold  tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors">
              {section.title}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  openSections.includes(section.title) && "rotate-180"
                )}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-1">
              <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-2">
                {section.items.map((item) => (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                      pathname === item.url
                        ? "bg-foreground text-background font-medium"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {item.title}

                    
                    
                  </Link>
                ))}

              </div>
            </CollapsibleContent>
            
          </Collapsible>
        ))}
        {/* Universal Request Forms */}
        <Collapsible open={openSections.includes("Universal Request Forms")} onOpenChange={() => toggleSection("Universal Request Forms")}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold  tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors">
            Universal Request Forms
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                openSections.includes("Universal Request Forms") && "rotate-180" 
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-2">
              <a
                href="/ticketing/universal/iam"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              > IAM (Identity and Access Management)</a>
              <a
                href="/ticketing/universal/general"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              > General Request</a>
            </div>
          </CollapsibleContent>
        </Collapsible>
        {/* Incident Tickets */}
         <Collapsible open={openSections.includes("Incident Ticket Forms")} onOpenChange={() => toggleSection("Incident Ticket Forms")}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-semibold  tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors">
            Incident Ticket Forms
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                openSections.includes("Incident Ticket Forms") && "rotate-180" 
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <div className="ml-3 flex flex-col gap-0.5 border-l border-border pl-2">
              <a
                href="/ticketing/incidents/iam"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              > IAM (Identity and Access Management)</a>
              <a
                href="/ticketing/incidents/infrastructure"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              > Infrastructure</a>
              <a
                href="/ticketing/incidents/services"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              > Services</a>
              <a
                href="/ticketing/incidents/remote-access-networking"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              > Remote Access & Networking</a>
            </div>
          </CollapsibleContent>
        </Collapsible>

      </nav>
    </ScrollArea>
  );
}