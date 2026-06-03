"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";
import { useEffect, useState } from "react";

type ApiResourceEntry = {
  type: string;
  cpu: number;
  vmid: string;
  id: string;
  name: string;
  status: string;
  mem: number;
  maxmem: number;
  disk: number;
};

export function SectionCards() {
  const [resources, setResources] = useState<ApiResourceEntry[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/proxmox/resources");

      if (!res.ok) {
        setResources([]);
        return;
      }

      const json = await res.json();
      setResources(Array.isArray(json.data) ? json.data : []);
    }

    load();
  }, []);

  const totalResources = resources.length;

  const countsByType = resources.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalStorageUsed = resources.reduce((acc, r) => {
    return acc + (r.disk || 0);
  }, 0);

  const bytesToGB = (bytes: number) =>
    (bytes / 1024 / 1024 / 1024).toFixed(2);

  return resources.length === 0 ? (
    <div className="flex h-32 items-center justify-center rounded-md border">
      <p className="text-sm text-muted-foreground">No resources found.</p>
    </div>
  ) : (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

      {/* Total resources */}
      <Card>
        <CardHeader>
          <CardDescription>Total Resources</CardDescription>
          <CardTitle>{totalResources}</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon className="size-4" />
              All
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>

      {/* LXC */}
      <Card>
        <CardHeader>
          <CardDescription>LXC Containers</CardDescription>
          <CardTitle>{countsByType.lxc || 0}</CardTitle>
        </CardHeader>
      </Card>

      {/* QEMU */}
      <Card>
        <CardHeader>
          <CardDescription>VMs (QEMU)</CardDescription>
          <CardTitle>{countsByType.qemu || 0}</CardTitle>
        </CardHeader>
      </Card>

      {/* Storage */}
      <Card>
        <CardHeader>
          <CardDescription>Total Disk Usage</CardDescription>
          <CardTitle>
            {bytesToGB(totalStorageUsed)} GB
          </CardTitle>
        </CardHeader>
      </Card>

    </div>
  );
}