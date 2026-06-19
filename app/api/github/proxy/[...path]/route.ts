// app/api/github/proxy/[...path]/route.ts
// A catch-all proxy that forwards requests to the GitHub API using the user's stored token.
// Usage from your frontend: GET /api/github/proxy/user/repos
//                           GET /api/github/proxy/repos/owner/repo/issues

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up the stored GitHub token for this user
  const link = await prisma.gitHubLink.findUnique({
    where: { userId: session.user.id },
    select: { accessToken: true },
  });

  if (!link) {
    return NextResponse.json(
      { error: "No GitHub account linked. Connect your account first." },
      { status: 403 }
    );
  }

  // Build the GitHub API URL from the catch-all path segments
  const { path } = await params;
  const githubPath = path.join("/");
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();
  const githubUrl = `https://api.github.com/${githubPath}${queryString ? `?${queryString}` : ""}`;

  // Forward the request to GitHub
  const githubRes = await fetch(githubUrl, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${link.accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(req.method !== "GET" && req.method !== "HEAD"
        ? { "Content-Type": "application/json" }
        : {}),
    },
    ...(req.method !== "GET" && req.method !== "HEAD"
      ? { body: await req.text() }
      : {}),
  });

  const data = await githubRes.json();

  return NextResponse.json(data, { status: githubRes.status });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;