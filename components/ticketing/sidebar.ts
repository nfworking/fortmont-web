export interface SidebarItem {
  title: string;
  url: string;
  badge?: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export const sidebarConfig: SidebarSection[] = [
  {
    title: "IT Support",
    items: [
      { title: "Getting Started", url: "/docs" },
      { title: "Key Terms", url: "/docs/quick-start" }
    ],
  },
  {
    title: "Lab Overview",
    items: [
      { title: "Infrastructure", url: "/ticketing/kba/how-to-access-fortmont-web" },
      { title: "Network", url: "/ticketing/kba/network" },
      { title: "Services", url: "/ticketing/kba/services" },
      { title: "Security", url: "/ticketing/kba/security" },
    ],
  },
  {
    title: "Remote Access",
    items: [
      { title: "Tailscale", url: "/docs" }      
    ],
  },
  {
    title: "Automation Services",
    items: [
      { title: "Tailscale", url: "/docs" }      
    ],
  },
  
];
