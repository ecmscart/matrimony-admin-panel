import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth/session";

const BACKEND =
  process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "content-encoding",
  "accept-encoding",
]);

async function forward(req: NextRequest, params: { path: string[] }) {
  const segments = params.path?.join("/") ?? "";
  const url = new URL(`/api/${segments}${req.nextUrl.search}`, BACKEND).toString();

  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;

  const headers = new Headers();
  req.headers.forEach((v, k) => {
    if (!HOP_BY_HOP.has(k.toLowerCase()) && k.toLowerCase() !== "cookie") headers.set(k, v);
  });
  if (token) headers.set("authorization", `Bearer ${token}`);

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
    redirect: "manual",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(url, init);
    const body = await upstream.arrayBuffer();
    const resHeaders = new Headers();
    upstream.headers.forEach((v, k) => {
      if (!HOP_BY_HOP.has(k.toLowerCase()) && k.toLowerCase() !== "set-cookie")
        resHeaders.set(k, v);
    });
    return new NextResponse(body, { status: upstream.status, headers: resHeaders });
  } catch {
    return NextResponse.json(
      {
        message: "Upstream API unavailable",
        path: `/api/${segments}`,
      },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, await ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, await ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, await ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, await ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return forward(req, await ctx.params);
}
