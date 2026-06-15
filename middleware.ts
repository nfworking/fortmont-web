
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);


const publicRoutes = ["/apps", "/forgot-password", "/reset-password", "/onboard", "/api/ticketing/get/ticket"];
const authPages = ["/login", "/login_webmail", "/signup"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  const isLoggedIn = !!req.auth;

  const onboarded = (req.auth?.user as {
    isOnboarded?: boolean;
  })?.isOnboarded;

  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathname === route || pathname.startsWith(route + "/")
  );

  const isAuthPage = authPages.some(
    (route) =>
      pathname === route || pathname.startsWith(route + "/")
  );

  const isOnboardingRoute =
    pathname === "/onboard/user" ||
    pathname.startsWith("/onboard/");

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Not logged in
  if (!isLoggedIn) {
    // Allow login/signup pages
    if (isAuthPage) {
      return NextResponse.next();
    }

    // Redirect to login and preserve destination
    const loginUrl = new URL("/login", req.url);

    loginUrl.searchParams.set(
      "callbackUrl",
      pathname + search
    );

    return NextResponse.redirect(loginUrl);
  }

  // Force onboarding
  if (
    onboarded === false &&
    !isOnboardingRoute
  ) {
    return NextResponse.redirect(
      new URL("/onboard/user", req.url)
    );
  }

  // Prevent onboarded users revisiting onboarding
  if (
    onboarded === true &&
    isOnboardingRoute
  ) {
    const callbackUrl =
      req.nextUrl.searchParams.get("callbackUrl");

    return NextResponse.redirect(
      new URL(
        callbackUrl || "/dashboard",
        req.url
      )
    );
  }

  // Logged-in users shouldn't see login/signup
  if (isAuthPage) {
    const callbackUrl =
      req.nextUrl.searchParams.get("callbackUrl");

    return NextResponse.redirect(
      new URL(
        callbackUrl || "/dashboard",
        req.url
      )
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};

