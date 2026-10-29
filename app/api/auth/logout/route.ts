import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/session";

const BACKEND =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST() {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  await fetch(`${BACKEND}/api/auth/logout`, {
    method: "POST",
    headers: access ? { authorization: `Bearer ${access}` } : undefined,
    cache: "no-store",
  }).catch(() => {});

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}
