import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "balaji_session";

/**
 * Verifies the session cookie at the edge. This mirrors `decodeSession` in
 * `lib/auth.ts` but is inlined because middleware runs in the Edge runtime and
 * cannot import modules marked `server-only`.
 *
 * Middleware is a first gate for redirects only — every admin server action
 * still calls `requireAdmin()`, so authorization never depends on this alone.
 */
async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;

  if (!token || !secret || secret.length < 32) return false;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] },
    );
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLoggedIn = await hasValidSession(request);

  // Signed-in admins have no reason to see the login page.
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname.startsWith("/admin") && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    // Remember where they were headed so login can send them back.
    loginUrl.searchParams.set("from", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
