import { NextResponse, type NextRequest } from "next/server";

const BACKEND =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.email !== "string") {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const upstream = await fetch(`${BACKEND}/api/auth/admin/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email }),
    cache: "no-store",
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
