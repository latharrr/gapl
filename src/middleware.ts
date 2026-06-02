import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Rewrite links.gapl.in/abc123 or links.localhost:3000/abc123 to /api/t/abc123
  if (host === "links.gapl.in" || host.startsWith("links.")) {
    const url = request.nextUrl.clone();
    // Prevent rewriting API calls or static files if request already targets them
    if (!url.pathname.startsWith("/api/t/")) {
      url.pathname = `/api/t${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all paths so shortlinks like links.gapl.in/abc123 are resolved
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (except /api/t/)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api(?!/t/)|_next/static|_next/image|favicon.ico).*)",
  ],
};
