import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/profile"];
const authPageRoutes = ["/login"];

const apiAuthPrefix = "/api/auth";
const protectedApiPrefix = ["/api/lxc", "/api/apiUsers"];

export default auth(async (req) => {
  const { nextUrl } = req;

  const path = nextUrl.pathname;

  const isLoggedIn = !!req.auth;

  /*
   * Ignore NextAuth API routes
   */
  if (path.startsWith(apiAuthPrefix)) {
    return NextResponse.next();
  }

  /*
   * Protect API routes with API key
   */
  if (protectedApiPrefix.some((prefix) => path.startsWith(prefix))) {
    const apiKey = req.headers.get("x-api-key");

    if (apiKey !== process.env.API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  /*
   * Protected pages
   */
  const isProtectedRoute = protectedRoutes.includes(path);

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(
      new URL("/login", req.nextUrl)
    );
  }

  /*
   * Prevent logged-in users
   * from seeing auth pages
   */
  const isAuthPageRoute = authPageRoutes.includes(path);

  if (isLoggedIn && isAuthPageRoute) {
    return NextResponse.redirect(
      new URL("/dashboard", req.nextUrl)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Include API routes
     */
    "/api/:path*",

    /*
     * Include pages
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};