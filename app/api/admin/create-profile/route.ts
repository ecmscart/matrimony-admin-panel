import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth/session";

const BACKEND =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Creates a user account and matrimony profile via the admin API
 * (POST /api/admin/users), which bypasses the public OTP signup flow.
 */
export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const claims = decodeJwt(token) as { role?: string };
    if (claims.role !== "admin") {
      return NextResponse.json({ message: "Forbidden — admin role required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Invalid request" }, { status: 400 });

  const createRes = await fetch(`${BACKEND}/api/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const data = await createRes.json().catch(() => ({ message: "Failed to create profile" }));
  return NextResponse.json(data, { status: createRes.status });
}
