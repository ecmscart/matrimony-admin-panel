import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...opts,
  }).format(date);
}

export function relativeTime(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = (Date.now() - date.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (diff < 60) return rtf.format(-Math.floor(diff), "second");
  if (diff < 3600) return rtf.format(-Math.floor(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), "hour");
  if (diff < 2592000) return rtf.format(-Math.floor(diff / 86400), "day");
  if (diff < 31536000) return rtf.format(-Math.floor(diff / 2592000), "month");
  return rtf.format(-Math.floor(diff / 31536000), "year");
}

/**
 * Safely build an absolute image URL from a base and a (possibly relative) path.
 * Returns null when the inputs cannot form a valid URL, so callers can render a fallback.
 */
export function buildImageUrl(
  base: string | undefined,
  path: string | undefined | null,
): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  // Already an absolute URL — validate and return as-is.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return new URL(trimmed).href;
    } catch {
      return null;
    }
  }

  if (!base) return null;
  try {
    const normalizedBase = base.replace(/\/$/, "");
    const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return new URL(`${normalizedBase}${normalizedPath}`).href;
  } catch {
    return null;
  }
}

/** Same-origin src for <img>: blob/data as-is, remote URLs via image proxy. */
export function toDisplayImageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  if (src.startsWith("blob:") || src.startsWith("data:") || src.startsWith("/")) {
    return src;
  }
  if (/^https?:\/\//i.test(src)) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}
