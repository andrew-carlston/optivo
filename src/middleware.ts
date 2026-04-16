import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that never require auth
const PUBLIC_PATHS = ["/", "/ui", "/api/auth", "/api/company"];

// Cookie name used by Better Auth
const SESSION_COOKIE = "better-auth.session_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward pathname to server components (layouts can't access it otherwise)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const passthrough = () => NextResponse.next({ request: { headers: requestHeaders } });

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return passthrough();
  }

  const parts = pathname.split("/").filter(Boolean);

  // Allow login pages without auth
  if (parts[0] === "admin" && parts[1] === "login") {
    return passthrough();
  }
  if (parts.length >= 2 && parts[1] === "login") {
    return passthrough();
  }

  // Check for session cookie (fast gate — full validation in layouts)
  const hasSession = request.cookies.get(SESSION_COOKIE)?.value;

  if (!hasSession) {
    // Admin routes → admin login
    if (parts[0] === "admin") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // Company routes → company login
    if (parts.length >= 1) {
      return NextResponse.redirect(new URL(`/${parts[0]}/login`, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return passthrough();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
