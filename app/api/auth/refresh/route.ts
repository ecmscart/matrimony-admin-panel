import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

const BACKEND =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

export async function POST() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) return NextResponse.json({ message: "No refresh token" }, { status: 401 });

  const upstream = await fetch(`${BACKEND}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const res = NextResponse.json({ message: "Refresh failed" }, { status: 401 });
    res.cookies.delete(ACCESS_COOKIE);
    res.cookies.delete(REFRESH_COOKIE);
    return res;
  }

  const { accessToken, refreshToken } = (await upstream.json()) as RefreshResponse;
  const secure = process.env.JWT_COOKIE_SECURE === "true";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return res;
}
