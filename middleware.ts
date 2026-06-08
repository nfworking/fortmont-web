import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/login", "/login_webmail"];
const apiAuthPrefix = "/api/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isLoggedIn = !!req.auth;

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Allow NextAuth internal routes
  if (pathname.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  // ❌ HARD BLOCK: all API routes require auth
  if (pathname.startsWith("/api")) {
    if (!isLoggedIn) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        }
      );
    }
    return NextResponse.next();
  }

  // ❌ HARD BLOCK: protected pages
  if (!isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🚫 prevent logged-in users from login page
  if (isPublicRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};