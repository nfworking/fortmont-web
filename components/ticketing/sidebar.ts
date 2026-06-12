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
    title: "Getting Started",
    items: [
      { title: "Introduction", url: "/docs" },
      { title: "Quick Start", url: "/docs/quick-start" },
      { title: "Installation", url: "/docs/installation" },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { title: "Architecture", url: "/docs/architecture" },
      { title: "Components", url: "/docs/components" },
      { title: "State Management", url: "/docs/state" },
      { title: "Routing", url: "/docs/routing" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "Overview", url: "/docs/api" },
      { title: "Authentication", url: "/docs/api/auth" },
      { title: "Endpoints", url: "/docs/api/endpoints", badge: "New" },
      { title: "Webhooks", url: "/docs/api/webhooks" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Deployment", url: "/docs/deployment" },
      { title: "Best Practices", url: "/docs/best-practices" },
      { title: "Examples", url: "/docs/examples" },
    ],
  },
];
