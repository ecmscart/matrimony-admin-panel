import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// The backend persists images via a pluggable storage driver (Hostinger FTP or
// local disk — see docs/BACKEND.md §2/§8). With the FTP driver the stored image
// `url` is an absolute URL on a public host that may differ from the API host.
// Mirror the backend's UPLOADS_PUBLIC_BASE_URL here so next/image allows it.
// Falls back to the API's local `/uploads` path when not set.
const uploadsBaseUrl = process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? `${apiUrl}/uploads`;

function toRemotePattern(url: string) {
  const u = new URL(url);
  return {
    protocol: u.protocol.replace(":", "") as "http" | "https",
    hostname: u.hostname,
    port: u.port || undefined,
    pathname: `${u.pathname.replace(/\/$/, "")}/**`,
  };
}

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      toRemotePattern(`${apiUrl}/uploads`),
      toRemotePattern(uploadsBaseUrl),
      { protocol: "https", hostname: "maher.mahershadi.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
