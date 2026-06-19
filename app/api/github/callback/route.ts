// app/api/github/callback/route.ts
// GitHub redirects here after the user authorizes. Exchanges the code for a token,
// fetches the GitHub user profile, and saves/updates the record in the DB.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is the userId we passed in connect/route.ts

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state parameter" },
      { status: 400 }
    );
  }

  // 1. Exchange the code for an access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID!,
      client_secret: process.env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    console.error("GitHub token exchange error:", tokenData);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?error=github_token_failed`
    );
  }

  const { access_token, token_type, scope } = tokenData;

  // 2. Fetch the authenticated GitHub user's profile
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/settings/integrations?error=github_user_failed`
    );
  }

  const githubUser = await userRes.json();

  // 3. Upsert the GitHubLink record tied to the appUser
  await prisma.gitHubLink.upsert({
    where: { userId: state },
    create: {
      userId: state,
      githubId: String(githubUser.id),
      username: githubUser.login,
      accessToken: access_token,
      tokenType: token_type ?? "bearer",
      scope: scope ?? null,
      avatarUrl: githubUser.avatar_url ?? null,
      profileUrl: githubUser.html_url ?? null,
    },
    update: {
      githubId: String(githubUser.id),
      username: githubUser.login,
      accessToken: access_token,
      tokenType: token_type ?? "bearer",
      scope: scope ?? null,
      avatarUrl: githubUser.avatar_url ?? null,
      profileUrl: githubUser.html_url ?? null,
    },
  });

  // 4. Redirect back to your settings/integrations page on success
  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/settings/integrations?github=linked`
  );
}