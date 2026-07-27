

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); 

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state parameter" },
      { status: 400 }
    );
  }

 
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
    `https://home.fortmont.me/platform/account?section=github&linked=github`
  );
}