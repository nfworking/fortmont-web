// app/api/entra/route.ts
// Proxies requests to Microsoft Graph API.
// Usage: GET /api/entra?resource=<key>[&top=<n>]

import { getGraphToken } from "@/lib/EntraHelper";
import { NextRequest } from "next/server";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// Map of allowed resource keys → Graph API path segments
const RESOURCE_MAP: Record<string, string> = {
  "users":                                 "users",
  "groups":                                "groups",
  "devices":                               "devices",
  "applications":                          "applications",
  "auditLogs/signIns":                     "auditLogs/signIns",
  "identity/conditionalAccess/policies":   "identity/conditionalAccess/policies",
};

// Lean $select fields per resource to avoid over-fetching
const SELECT_MAP: Record<string, string> = {
  users: [
    "id", "displayName", "userPrincipalName", "accountEnabled",
    "userType", "jobTitle", "department", "createdDateTime",
    "lastPasswordChangeDateTime", "assignedLicenses",
    "strongAuthenticationMethods", "isMfaRegistered",
  ].join(","),

  groups: [
    "id", "displayName", "description", "securityEnabled",
    "mailEnabled", "groupTypes", "createdDateTime",
    "membershipRule", "membershipRuleProcessingState",
  ].join(","),

  devices: [
    "id", "displayName", "operatingSystem", "operatingSystemVersion",
    "trustType", "isCompliant", "isManaged",
    "approximateLastSignInDateTime", "registrationDateTime",
    "deviceId", "manufacturer", "model",
  ].join(","),

  applications: [
    "id", "appId", "displayName", "signInAudience",
    "createdDateTime", "passwordCredentials", "keyCredentials",
    "web", "spa", "requiredResourceAccess",
  ].join(","),
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") ?? "";
  const top = searchParams.get("top") ?? "100";

  const graphPath = RESOURCE_MAP[resource];
  if (!graphPath) {
    return Response.json(
      { error: "Unknown resource", resource },
      { status: 400 }
    );
  }

  try {
    const tokenData = await getGraphToken();

    const params = new URLSearchParams({ $top: top });

    const select = SELECT_MAP[resource];
    if (select) params.set("$select", select);

    // Sign-in logs: last 24h only, newest first
    if (resource === "auditLogs/signIns") {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      params.set("$filter", `createdDateTime ge ${since}`);
      params.set("$orderby", "createdDateTime desc");
    }

    const url = `${GRAPH_BASE}/${graphPath}?${params.toString()}`;
    console.log(`➡️  Graph request [${resource}]: ${url}`);

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
        ConsistencyLevel: "eventual", // required for some $filter and $count queries
      },
    });

    console.log(`📡 Graph status [${resource}]:`, res.status);
    const text = await res.text();

    if (!res.ok) {
      console.error(`❌ Graph error [${resource}]:`, text);
      return Response.json(
        {
          error: "Microsoft Graph returned an error",
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
        error: "Failed to fetch from Microsoft Graph",
        message,
      },
      { status: 500 }
    );
  }
}