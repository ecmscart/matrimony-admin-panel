import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

const BACKEND =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; firstName?: string; lastName?: string };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Invalid request" }, { status: 400 });

  const upstream = await fetch(`${BACKEND}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const data = await upstream.json().catch(() => ({ message: "Login failed" }));
    return NextResponse.json(data, { status: upstream.status });
  }

  const { accessToken, refreshToken, user } = (await upstream.json()) as LoginResponse;
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden — admin role required" }, { status: 403 });
  }

  const secure = process.env.JWT_COOKIE_SECURE === "true";
  const res = NextResponse.json({ user });
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
  res.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
