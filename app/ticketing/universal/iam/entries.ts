export interface Entry {
  id: string;
  title: string;
  description: string;
  href: string;
}

export const entries: Entry[] = [
  {
    id: "github",
    title: "GitHub Overview",
    description:
      "View your repositories, recent activity, pull requests, and organisation memberships at a glance.",
    href: "/integrations/github",
  },
  {
    id: "entra",
    title: "Microsoft Entra ID",
    description:
      "Manage users, groups, and service principals synced from your Azure Active Directory tenant.",
    href: "/integrations/entra",
  },
  {
    id: "exchange",
    title: "Exchange 2019",
    description:
      "Administer mailboxes, distribution lists, and mail-flow rules on your on-premises Exchange server.",
    href: "/integrations/exchange",
  },
  {
    id: "proxmox",
    title: "Proxmox VE",
    description:
      "Monitor virtual machines, containers, and node health across your Proxmox hypervisor cluster.",
    href: "/integrations/proxmox",
  },
  {
    id: "dns",
    title: "DNS Management",
    description:
      "Inspect and update DNS zones, records, and TTLs for all domains managed by Fortmont.",
    href: "/integrations/dns",
  },
  {
    id: "active-directory",
    title: "Active Directory",
    description:
      "Browse OUs, manage computer objects, and synchronise group policies across domain controllers.",
    href: "/integrations/active-directory",
  },
];