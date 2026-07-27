// app/api/azure/route.ts
// Proxies requests to Azure Resource Manager (management.azure.com).
// Usage: GET /api/azure?resource=<key>

import { getGraphToken } from "@/lib/AzureHelper";
import { NextRequest } from "next/server";

const ARM_BASE = "https://management.azure.com";
const SUB_ID = process.env.AZURE_SUBSCRIPTION_ID;

// ARM API versions per resource type
const API_VERSIONS: Record<string, string> = {
  subscriptions:    "2022-12-01",
  resourceGroups:   "2021-04-01",
  virtualMachines:  "2024-03-01",
  storageAccounts:  "2023-01-01",
  roleAssignments:  "2022-04-01",
};

// ARM URL builder per resource key
function buildUrl(resource: string): string | null {
  switch (resource) {
    case "subscriptions":
      // List all subscriptions the service principal can see
      return `${ARM_BASE}/subscriptions?api-version=${API_VERSIONS.subscriptions}`;

    case "resourceGroups":
      return `${ARM_BASE}/subscriptions/${SUB_ID}/resourcegroups?api-version=${API_VERSIONS.resourceGroups}`;

    case "virtualMachines":
      // Subscription-wide VM list — includes all resource groups
      return `${ARM_BASE}/subscriptions/${SUB_ID}/providers/Microsoft.Compute/virtualMachines?api-version=${API_VERSIONS.virtualMachines}`;

    case "storageAccounts":
      return `${ARM_BASE}/subscriptions/${SUB_ID}/providers/Microsoft.Storage/storageAccounts?api-version=${API_VERSIONS.storageAccounts}`;

    case "roleAssignments":
      return `${ARM_BASE}/subscriptions/${SUB_ID}/providers/Microsoft.Authorization/roleAssignments?api-version=${API_VERSIONS.roleAssignments}`;

    default:
      return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") ?? "";

  const url = buildUrl(resource);
  if (!url) {
    return Response.json(
      { error: "Unknown resource", resource },
      { status: 400 }
    );
  }

  if (!SUB_ID && resource !== "subscriptions") {
    return Response.json(
      { error: "AZURE_SUBSCRIPTION_ID is not set" },
      { status: 500 }
    );
  }

  try {
    const tokenData = await getGraphToken();

    console.log(`➡️  ARM request [${resource}]: ${url}`);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`📡 ARM status [${resource}]:`, res.status);
    const text = await res.text();

    if (!res.ok) {
      console.error(`❌ ARM error [${resource}]:`, text);
      return Response.json(
        {
          error: "Azure Resource Manager returned an error",
          status: res.status,
          details: text,
        },
        { status: res.status }
      );
    }

    return Response.json(JSON.parse(text));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Unexpected error [${resource}]:`, error);
    return Response.json(
      {
        error: "Failed to fetch from Azure Resource Manager",
        message,
      },
      { status: 500 }
    );
  }
}