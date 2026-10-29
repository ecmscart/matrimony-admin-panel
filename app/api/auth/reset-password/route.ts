import { NextResponse, type NextRequest } from "next/server";

const BACKEND =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.otp !== "string" ||
    typeof body.newPassword !== "string"
  ) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const upstream = await fetch(`${BACKEND}/api/auth/admin/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, otp: body.otp, newPassword: body.newPassword }),
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
