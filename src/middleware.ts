import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/analytics", "/journal", "/settings"];
// Routes only for admins
const ADMIN_ROUTES = ["/admin"];
// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ["/login", "/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtected = PROTECTED_ROUTES.some((r) => nextUrl.pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => nextUrl.pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => nextUrl.pathname.startsWith(r));

  // If logged in and trying to access login/signup, redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // If not logged in and trying to access protected routes
  if ((isProtected || isAdminRoute) && !isLoggedIn) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
