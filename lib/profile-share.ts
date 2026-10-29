import type { AdminProfile } from "@/lib/types/profile";
import { buildImageUrl } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Resolve the primary (or first) public profile photo URL. */
export function getProfileSharePhotoUrl(p: AdminProfile): string | null {
  const images = (p.images ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const primary =
    images.find((i) => i.isPrimary && !i.isPrivate) ??
    images.find((i) => !i.isPrivate) ??
    images[0];
  const raw = primary?.url?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return buildImageUrl(API_BASE, raw.startsWith("/") ? raw : `/${raw}`);
}

/** Plain-text WhatsApp / share body for a profile (no contact numbers). */
export function buildProfileShareText(p: AdminProfile): string {
  const clean = (v?: string | number | null) =>
    v === null || v === undefined ? "" : String(v).trim();
  const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "\u2014";
  const lines: string[] = [`*${p.profileNumber ?? "\u2014"} \u2014 ${name}*`];

  const photoUrl = getProfileSharePhotoUrl(p);
  if (photoUrl) lines.push(`Photo: ${photoUrl}`);

  const badges = [
    p.isProfileVerified ? "Verified" : "",
    p.isVip ? "VIP" : "",
    p.isPremium ? "Premium" : "",
  ].filter(Boolean);
  if (badges.length) lines.push(badges.join(" \u00b7 "));

  const bio = [p.age ? `${p.age} yrs` : "", clean(p.gender), clean(p.height)].filter(
    Boolean,
  );
  if (bio.length) lines.push(bio.join(" \u00b7 "));

  const add = (label: string, value?: string | number | null) => {
    const v = clean(value);
    if (v) lines.push(`${label}: ${v}`);
  };

  add("Complexion", p.complexion);
  add("Marital status", p.maritalStatus ? p.maritalStatus.replace(/_/g, " ") : "");
  if (typeof p.hasChildren === "boolean") {
    add("Has children", p.hasChildren ? "Yes" : "No");
  }
  (p.children ?? []).forEach((c, i) => {
    const child = [
      c.age ? `Age ${c.age}` : "",
      clean(c.gender),
      typeof c.stayingWithYou === "boolean"
        ? c.stayingWithYou
          ? "Staying with you"
          : "Not staying with you"
        : "",
    ]
      .filter(Boolean)
      .join(" \u2014 ");
    if (child) lines.push(`Child ${i + 1}: ${child}`);
  });
  if (p.languagesKnown?.length) add("Languages", p.languagesKnown.join(", "));
  add("Caste", p.caste);
  add("Caste preference", p.castePreference);
  add("Marriage preference", p.marriagePreference);
  add("Education", p.education);
  add("Occupation", p.occupation);
  add("Income", p.income);
  const location = [clean(p.city), clean(p.state)].filter(Boolean).join(", ");
  if (location) lines.push(`Location: ${location}`);
  add("Home town", p.homeTown);
  add("Address area", p.addressArea);
  add("Address city", p.addressCity);

  return lines.join("\n");
}

function buildShareMessage(profiles: AdminProfile[]): string {
  const header =
    profiles.length === 1
      ? "*Maher Matrimony*"
      : `*Maher Matrimony* — ${profiles.length} profiles`;
  const blocks = profiles.map(buildProfileShareText);
  return `${header}\n\n${blocks.join("\n\n— — —\n\n")}`;
}

/**
 * Open WhatsApp Web in the browser with profile details pre-filled
 * (photo URL + bio; no contact numbers).
 */
export async function shareProfilesViaWhatsApp(profiles: AdminProfile[]): Promise<void> {
  if (profiles.length === 0) return;

  const message = buildShareMessage(profiles);
  const url = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
