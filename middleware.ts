import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

function redirectToLogin(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isOAuthFlow =
    pathname === "/oauth" ||
    pathname.startsWith("/oauth/") ||
    pathname.startsWith("/api/oauth/");

  const loginPath = isOAuthFlow ? "/oauth/login" : "/login";
  const response = NextResponse.redirect(new URL(loginPath, req.url));

  if (isOAuthFlow) {
    const loginUrl = new URL(loginPath, req.url);
    // Preserve full authorize URL when session dies mid OAuth
    if (pathname.startsWith("/api/oauth/authorize")) {
      loginUrl.searchParams.set("callbackUrl", pathname + search);
    } else if (pathname.startsWith("/oauth/consent")) {
      const authorize = new URL("/api/oauth/authorize", req.url);
      req.nextUrl.searchParams.forEach((value, key) => {
        if (key !== "consent") authorize.searchParams.set(key, value);
      });
      loginUrl.searchParams.set("callbackUrl", authorize.pathname + authorize.search);
    }
    const clientId = req.nextUrl.searchParams.get("client_id");
    if (clientId) loginUrl.searchParams.set("client_id", clientId);
    return NextResponse.redirect(loginUrl);
  }

  const cookiesToClear = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
    "next-auth.state",
  ];

  cookiesToClear.forEach((cookieName) => {
    response.cookies.delete(cookieName);
    response.cookies.set({
      name: cookieName,
      value: "",
      maxAge: 0,
      path: "/",
    });
  });

  return response;
}

// Common public frontend routes. No need to list "/api/..." routes here.
// Note: /oauth/login is an auth page (handled below), not a blanket public route,
// so logged-in users still get redirected back to authorize via callbackUrl.
const publicRoutes = [
  "/apps",
  "/forgot-password",
  "/reset-password",
  "/onboard",
  "/privacy-policy",
  "/terms-of-service",
  "/.well-known",
];
const authPages = ["/login", "/login_webmail", "/signup", "/oauth/login"];

/** OAuth UI that must work even if the user has not finished Fortmont onboarding. */
function isOAuthConnectRoute(pathname: string): boolean {
  return (
    pathname === "/oauth/login" ||
    pathname === "/oauth/consent" ||
    pathname.startsWith("/oauth/login/") ||
    pathname.startsWith("/oauth/consent/")
  );
}

export default auth(async (req) => {
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // After determining the request is logged in, verify the session is still active via an API route
  if (isLoggedIn) {
    const token = req.auth as any;
    const sessionId = token?.sessionId as string | undefined;

    if (sessionId) {
      try {
        const verifyRes = await fetch(new URL("/api/auth/verify-session", req.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ sessionId }),
        });

        const { active } = await verifyRes.json();

        if (!verifyRes.ok || !active) {
          return redirectToLogin(req);
        }
      } catch (err) {
        console.error("Middleware session verification fetch failed", err);
        return redirectToLogin(req);
      }
    }
  }

  const onboarded = (req.auth?.user as { isOnboarded?: boolean })?.isOnboarded;

  const isPublicRoute =
    pathname.startsWith("/api") ||
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

  const isAuthPage = authPages.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  const isOnboardingRoute = pathname === "/onboard/user" || pathname.startsWith("/onboard/");
  const isOAuthUi = isOAuthConnectRoute(pathname);

  // Allow all API routes and public frontend routes globally
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Not logged in
  if (!isLoggedIn) {
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Consent requires login — send to OAuth connect login, not dashboard login
    if (isOAuthUi) {
      const loginUrl = new URL("/oauth/login", req.url);
      if (pathname.startsWith("/oauth/consent")) {
        const authorize = new URL("/api/oauth/authorize", req.url);
        req.nextUrl.searchParams.forEach((value, key) => {
          if (key !== "consent") authorize.searchParams.set(key, value);
        });
        loginUrl.searchParams.set("callbackUrl", authorize.pathname + authorize.search);
      } else {
        loginUrl.searchParams.set("callbackUrl", pathname + search);
      }
      const clientId = req.nextUrl.searchParams.get("client_id");
      if (clientId) loginUrl.searchParams.set("client_id", clientId);
      return NextResponse.redirect(loginUrl);
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Force onboarding for Fortmont app usage — but never interrupt OAuth connect flows
  if (onboarded === false && !isOnboardingRoute && !isOAuthUi) {
    return NextResponse.redirect(new URL("/onboard/user", req.url));
  }

  // Prevent onboarded users revisiting onboarding
  if (onboarded === true && isOnboardingRoute) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    return NextResponse.redirect(new URL(callbackUrl || "/dashboard", req.url));
  }

  // Logged-in users shouldn't see login/signup (including oauth login)
  if (isAuthPage) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    // Prefer returning to authorize URL for OAuth login; otherwise dashboard
    if (callbackUrl) {
      return NextResponse.redirect(new URL(callbackUrl, req.url));
    }
    if (pathname.startsWith("/oauth/login")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
