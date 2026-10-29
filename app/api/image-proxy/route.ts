import { NextRequest } from "next/server";

/**
 * Same-origin image proxy for PDF embedding (uploads host may lack CORS).
 */

function allowedHosts(): Set<string> {
  const hosts = new Set<string>();
  const api =
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000";
  try {
    hosts.add(new URL(api).host);
  } catch {
    // ignore
  }
  const uploads = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL;
  if (uploads) {
    try {
      hosts.add(new URL(uploads).host);
    } catch {
      // ignore
    }
  }
  hosts.add("maher.mahershadi.com");
  return hosts;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new Response("Unsupported protocol", { status: 403 });
  }

  if (!allowedHosts().has(target.host)) {
    return new Response("Host not allowed", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString());
  } catch {
    return new Response("Failed to fetch image", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Upstream returned an error", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const looksLikeImage =
    contentType.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|bmp|heic|heif)(\?|$)/i.test(target.pathname);
  if (!looksLikeImage && contentType && !contentType.includes("octet-stream")) {
    return new Response("Not an image", { status: 415 });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType.startsWith("image/")
        ? contentType
        : "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
