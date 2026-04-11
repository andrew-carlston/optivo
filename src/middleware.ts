import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't need auth
const PUBLIC_PATHS = ["/", "/ui", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Company slug routes: /[company]/...
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 1) {
    const slug = parts[0];
    const subpath = parts[1] || "";

    // Allow login page without auth
    if (subpath === "login") {
      return NextResponse.next();
    }

    // TODO: Check session cookie here
    // For now, allow all routes (auth not wired yet)
    // When auth is ready:
    // 1. Check session cookie
    // 2. If no session → redirect to /[company]/login
    // 3. If session → look up company slug on main → get branch_id
    // 4. Set branch connection in request headers for server components

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
