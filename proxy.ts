import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "jose";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];
const ACCESS_COOKIE = "access_token";

type JwtClaims = {
  exp?: number;
  role?: string;
};

function isValidAdminToken(token?: string) {
  if (!token) return false;
  try {
    const claims = decodeJwt(token) as JwtClaims;
    const now = Math.floor(Date.now() / 1000);
    if (!claims.exp || claims.exp <= now) return false;
    return claims.role === "admin";
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const hasValidAdminSession = isValidAdminToken(token);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!hasValidAdminSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    // Ensure stale/invalid auth state does not keep causing redirects.
    res.cookies.delete(ACCESS_COOKIE);
    return res;
  }
  if (hasValidAdminSession && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|.*\\..*).*)"],
};
