"use client";

import { Download } from "lucide-react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
  Svg,
  Path,
  Circle,
} from "@react-pdf/renderer";
import type { AdminProfile } from "@/lib/types/profile";
import { buildImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DEFAULT_BUREAU_PHONE = "98115 99425, 98119 90161";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Design CSS targets ~1100px sheet. A4 is 595pt wide → scale ≈ 0.54.
 * Photo column in CSS is 360px @ 3/4 → ~195 × 260 pt.
 */
const PHOTO_W = 195;
const PHOTO_H = 260;

const C = {
  navy: "#071e43",
  navyMid: "#0b3973",
  navyDeep: "#001a3d",
  navySoft: "#092653",
  gold: "#d6a63b",
  goldDark: "#ad7615",
  goldLine: "#c89325",
  goldSoft: "#f8ecd7",
  cream: "#fffdf8",
  pageBg: "#fdfaf4",
  cardBorder: "#e8d3a3",
  text: "#111827",
  label: "#10294e",
  white: "#ffffff",
  creamText: "#fff8e8",
  phone: "#efbd4f",
};

interface DownloadProfilePDFProps {
  profile: AdminProfile;
  variant?: "default" | "outline";
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.pageBg,
    fontFamily: "Helvetica",
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: 300,
    left: 170,
    width: 250,
    height: 190,
    opacity: 0.1,
  },
  watermarkWrap: {
    position: "absolute",
    top: 390,
    left: 50,
    right: 50,
    alignItems: "center",
  },
  watermarkText: {
    fontSize: 36,
    fontFamily: "Times-Bold",
    color: "#071e43",
    opacity: 0.14,
    transform: "rotate(-32deg)",
  },
  sheet: {
    flex: 1,
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.gold,
    position: "relative",
  },
  header: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: C.navyDeep,
    borderBottomWidth: 3,
    borderBottomColor: C.goldLine,
  },
  logoWrap: {
    width: 52,
    height: 40,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.gold,
    overflow: "hidden",
    backgroundColor: C.creamText,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 48,
    height: 36,
    objectFit: "contain",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  brandTitle: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    color: C.creamText,
    textAlign: "center",
    marginBottom: 5,
  },
  phonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: C.gold,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 12,
  },
  phoneText: {
    fontFamily: "Times-Roman",
    fontSize: 9,
    color: C.phone,
  },
  headerSpacer: {
    width: 52,
  },
  hero: {
    flexDirection: "row",
    gap: 18,
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  heroLeft: {
    flex: 1,
  },
  profileName: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    color: C.navy,
    marginBottom: 6,
    lineHeight: 1.2,
  },
  profileMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 9,
    color: "#101827",
  },
  metaDivider: {
    width: 1,
    height: 11,
    backgroundColor: "#9f8250",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  badge: {
    fontSize: 8,
    color: C.white,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeVerified: { backgroundColor: "#0e366d" },
  badgeVip: { backgroundColor: "#d4a33e", color: C.navyDeep },
  badgePremium: { backgroundColor: "#268252" },
  aboutTop: {
    marginTop: 4,
  },
  aboutCard: {
    marginTop: 8,
    marginHorizontal: 12,
  },
  inlineTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  inlineIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.navySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineTitleText: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    color: C.navy,
  },
  aboutText: {
    fontSize: 8.5,
    lineHeight: 1.45,
    color: C.text,
  },
  photoFrame: {
    width: PHOTO_W,
    height: PHOTO_H,
    borderWidth: 2,
    borderColor: C.gold,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#e8e3d9",
  },
  photo: {
    width: PHOTO_W,
    height: PHOTO_H,
    objectFit: "cover",
  },
  topGrid: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    alignItems: "flex-start",
  },
  topColPersonal: { flex: 1.45 },
  topColChildren: { flex: 0.75 },
  topColRight: { flex: 1.5, gap: 8 },
  card: {
    position: "relative",
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 9,
    backgroundColor: "#fffef9",
    marginBottom: 0,
  },
  cardSpaced: {
    marginTop: 8,
  },
  sectionHeading: {
    position: "absolute",
    top: -8,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  sectionIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.goldDark,
    borderWidth: 1.5,
    borderColor: C.creamText,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionRibbon: {
    backgroundColor: C.navy,
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    paddingVertical: 2,
    paddingLeft: 8,
    paddingRight: 10,
  },
  sectionRibbonText: {
    fontFamily: "Times-Bold",
    fontSize: 8,
    color: C.white,
  },
  cardBody: {
    marginTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 1.5,
    borderBottomWidth: 0.6,
    borderBottomColor: "rgba(93, 78, 47, 0.15)",
    borderStyle: "dotted",
  },
  detailLabel: {
    width: "38%",
    fontSize: 7.5,
    color: C.label,
  },
  separator: {
    width: 10,
    fontSize: 7.5,
    color: C.label,
    textAlign: "center",
  },
  detailValue: {
    flex: 1,
    fontSize: 7.5,
    color: C.text,
    fontFamily: "Helvetica-Bold",
  },
  childItem: {
    marginBottom: 6,
  },
  childStrong: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginBottom: 1,
  },
  childText: {
    fontSize: 7.5,
    color: C.text,
    marginLeft: 6,
    lineHeight: 1.35,
  },
  educationWrap: {
    width: "59%",
    paddingTop: 8,
    paddingLeft: 12,
  },
  midRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    alignItems: "flex-start",
  },
  midCol: {
    flex: 1,
  },
  familyCard: {
    marginTop: 8,
    marginHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 9,
    backgroundColor: "#fffef9",
    position: "relative",
  },
  familyGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  familyLeft: { flex: 1.15 },
  siblingList: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 0.8,
    borderLeftColor: "#9e8652",
    borderStyle: "dotted",
    gap: 5,
  },
  siblingItem: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  siblingIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.navySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  siblingText: {
    flex: 1,
    fontSize: 7.5,
    color: C.text,
    lineHeight: 1.3,
  },
  bottomGrid: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  bottomCol: { flex: 1 },
  bottomColWide: { flex: 1.1 },
  paragraph: {
    fontSize: 7.5,
    lineHeight: 1.4,
    color: C.text,
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  interestPill: {
    fontSize: 7.5,
    color: C.navySoft,
    backgroundColor: "#f5e9d2",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 999,
  },
  disclaimer: {
    marginTop: 8,
    marginHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: C.goldSoft,
  },
  shield: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff8ea",
    borderWidth: 1,
    borderColor: "#d8b56b",
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 6.5,
    lineHeight: 1.35,
    color: C.navy,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.navyDeep,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  footerCell: {
    flex: 1,
    alignItems: "center",
  },
  footerCellWide: {
    flex: 1.25,
    alignItems: "center",
  },
  footerDivider: {
    borderRightWidth: 1,
    borderRightColor: "#cb9b38",
  },
  footerText: {
    fontFamily: "Times-Roman",
    fontSize: 7.5,
    color: C.white,
    textAlign: "center",
  },
});

function stripPlus91(value: string): string {
  return value
    .replace(/\+?\s*91[\s-]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatDob(dob?: string | null): string {
  if (!dob) return "";
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function truncate(text?: string | null, max = 240): string {
  if (!text) return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

type DetailRow = [string, string | number | null | undefined];

type SectionIconKind =
  | "user"
  | "family"
  | "pin"
  | "grad"
  | "faith"
  | "users"
  | "info"
  | "heart"
  | "shield"
  | "phone";

function SectionIcon({ kind, size = 9, color = C.white }: {
  kind: SectionIconKind;
  size?: number;
  color?: string;
}) {
  const s = size;
  if (kind === "phone") {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Path
          d="M6.5 3.5h3.2l1.6 4.2-2.1 1.1a11 11 0 005.4 5.4l1.1-2.1 4.2 1.6v3.2a1.8 1.8 0 01-1.8 1.8A15 15 0 014.7 5.3a1.8 1.8 0 011.8-1.8z"
          fill={color}
        />
      </Svg>
    );
  }
  if (kind === "shield") {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Path
          d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"
          fill={color}
        />
      </Svg>
    );
  }
  if (kind === "user") {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Circle cx={12} cy={8} r={3.2} fill={color} />
        <Path d="M5.5 19c1.2-3.2 3.6-4.8 6.5-4.8S17.8 15.8 19 19" fill={color} />
      </Svg>
    );
  }
  if (kind === "users" || kind === "family") {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Circle cx={8} cy={8} r={2.4} fill={color} />
        <Circle cx={16} cy={8} r={2.4} fill={color} />
        <Circle cx={12} cy={11} r={2} fill={color} />
        <Path d="M3.5 19c.8-2.4 2.4-3.6 4.5-3.6S12 16.6 12.8 19" fill={color} />
        <Path d="M11.2 19c.8-2.4 2.4-3.6 4.5-3.6S20 16.6 20.8 19" fill={color} />
      </Svg>
    );
  }
  if (kind === "pin") {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Path
          d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z"
          fill={color}
        />
        <Circle cx={12} cy={11} r={2.2} fill={C.goldDark} />
      </Svg>
    );
  }
  if (kind === "grad") {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Path d="M2 10l10-5 10 5-10 5L2 10z" fill={color} />
        <Path d="M6 12.2v3.3c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-3.3" fill={color} />
        <Path d="M20 10.2v5.2" stroke={color} strokeWidth={1.6} />
      </Svg>
    );
  }
  if (kind === "faith") {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Path
          d="M14 4a7.5 7.5 0 100 15 6.2 6.2 0 01-4.2-10.8A7.4 7.4 0 0114 4z"
          fill={color}
        />
        <Path
          d="M17.2 7.2l.6 1.4 1.5.2-1.1 1 .3 1.5-1.3-.8-1.3.8.3-1.5-1.1-1 1.5-.2.6-1.4z"
          fill={color}
        />
      </Svg>
    );
  }
  if (kind === "heart") {
    return (
      <Svg width={s} height={s} viewBox="0 0 24 24">
        <Path
          d="M12 20s-7-4.4-7-9.2A4.2 4.2 0 0112 8.2a4.2 4.2 0 017 2.6C19 15.6 12 20 12 20z"
          fill={color}
        />
      </Svg>
    );
  }
  // info
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} fill={color} />
      <Path d="M11.2 10.2h1.6V17h-1.6z" fill={C.goldDark} />
      <Circle cx={12} cy={7.8} r={1.1} fill={C.goldDark} />
    </Svg>
  );
}

function SectionHeading({
  title,
  icon,
}: {
  title: string;
  icon: SectionIconKind;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}>
        <SectionIcon kind={icon} size={9} color={C.white} />
      </View>
      <View style={styles.sectionRibbon}>
        <Text style={styles.sectionRibbonText}>{title}</Text>
      </View>
    </View>
  );
}

function DetailRows({ rows }: { rows: DetailRow[] }) {
  const visible = rows.filter(
    ([, value]) => value != null && `${value}`.trim() !== "",
  );
  if (visible.length === 0) return null;
  return (
    <View>
      {visible.map(([label, value]) => (
        <View style={styles.detailRow} key={label}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.separator}>:</Text>
          <Text style={styles.detailValue}>{`${value}`}</Text>
        </View>
      ))}
    </View>
  );
}

function hasRows(rows: DetailRow[]) {
  return rows.some(([, value]) => value != null && `${value}`.trim() !== "");
}

function ProfileDocument({
  profile,
  imageDataUrl,
  logoDataUrl,
}: {
  profile: AdminProfile;
  imageDataUrl?: string;
  logoDataUrl?: string;
}) {
  const bureauPhone = stripPlus91(DEFAULT_BUREAU_PHONE);
  const name = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  const about = (profile.about ?? "").trim();
  const otherDetails = truncate(profile.otherDetails, 200);

  const personalRows: DetailRow[] = [
    ["Date of Birth", formatDob(profile.dateOfBirth)],
    ["Height", profile.height],
    ["Complexion", profile.complexion],
    ["Gender", profile.gender],
    [
      "Marital Status",
      profile.maritalStatus ? profile.maritalStatus.replace(/_/g, " ") : "",
    ],
    ["Mother Tongue", profile.motherTongue],
    ["Languages Known", profile.languagesKnown?.join(", ")],
    [
      "Has Children",
      typeof profile.hasChildren === "boolean"
        ? profile.hasChildren
          ? "Yes"
          : "No"
        : "",
    ],
  ];

  const children = profile.children ?? [];
  const showChildren =
    profile.hasChildren === true || children.length > 0;

  const addressRows: DetailRow[] = [
    ["Address City", profile.addressCity],
    ["Address Area", profile.addressArea],
  ];

  const religiousRows: DetailRow[] = [
    ["Religion", profile.religion],
    ["Caste", profile.caste],
    ["Caste Preference", profile.castePreference],
    ["Marriage Preference", profile.marriagePreference],
    [
      "Family Type",
      profile.familyType ? String(profile.familyType).replace(/_/g, " ") : "",
    ],
    ["City", profile.city],
    ["State", profile.state],
    ["Home Town", profile.homeTown],
  ];

  const educationRows: DetailRow[] = [
    ["Education", profile.education],
    ["University", profile.educationUniversity],
    ["Education City", profile.educationCity],
    ["Occupation", profile.occupation],
    ["Income", profile.income],
  ];

  const familyRows: DetailRow[] = [
    ["Father's Name", profile.fatherName?.trim() ? "XXXX" : ""],
    ["Father's Occupation", profile.fatherOccupation],
    ["Mother's Name", profile.motherName],
    ["Mother's Occupation", profile.motherOccupation],
    ["Total Siblings", profile.totalSiblings],
    ["Brother's Education", profile.brotherEducation],
    ["Sister's Education", profile.sisterEducation],
  ];

  const siblings = (profile.siblings ?? [])
    .map((s, i) => {
      const line = [
        s.name,
        s.relation,
        s.ageRelation,
        s.maritalStatus,
        s.education,
        s.profession,
      ]
        .filter(Boolean)
        .join(" — ");
      return line ? { key: `sib-${i}`, line: `Sibling ${i + 1}: ${line}` } : null;
    })
    .filter(Boolean) as { key: string; line: string }[];

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.sheet}>
          <View style={styles.header} wrap={false}>
            <View style={styles.logoWrap}>
              {logoDataUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image style={styles.logo} src={logoDataUrl} />
              ) : null}
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.brandTitle}>Maher Marriage Bureau</Text>
              <View style={styles.phonePill}>
                <SectionIcon kind="phone" size={8} color={C.phone} />
                <Text style={styles.phoneText}>{bureauPhone}</Text>
              </View>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.hero}>
            <View style={styles.heroLeft}>
              <Text style={styles.profileName}>
                {name}
                {profile.age ? `, ${profile.age}` : ""}
                {profile.height ? ` · ${profile.height}` : ""}
              </Text>
              <View style={styles.profileMeta}>
                <Text style={styles.metaText}>
                  {[profile.city, profile.state].filter(Boolean).join(", ")}
                </Text>
                {(profile.profileNumber || profile.id) && (
                  <>
                    <View style={styles.metaDivider} />
                    <Text style={styles.metaText}>
                      Profile ID: {profile.profileNumber || profile.id}
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.badges}>
                {profile.isProfileVerified ? (
                  <Text style={[styles.badge, styles.badgeVerified]}>Verified</Text>
                ) : null}
                {profile.isVip ? (
                  <Text style={[styles.badge, styles.badgeVip]}>VIP</Text>
                ) : null}
                {profile.isPremium ? (
                  <Text style={[styles.badge, styles.badgePremium]}>Premium</Text>
                ) : null}
              </View>
            </View>

            {imageDataUrl ? (
              <View style={styles.photoFrame}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image style={styles.photo} src={imageDataUrl} />
              </View>
            ) : (
              <View style={styles.photoFrame} />
            )}
          </View>

          {about ? (
            <View style={[styles.card, styles.aboutCard]} wrap>
              <SectionHeading title="About" icon="user" />
              <View style={styles.cardBody}>
                <Text style={styles.aboutText}>{about}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.topGrid}>
            {hasRows(personalRows) ? (
              <View style={[styles.card, styles.topColPersonal]}>
                <SectionHeading title="Personal Details" icon="user" />
                <View style={styles.cardBody}>
                  <DetailRows rows={personalRows} />
                </View>
              </View>
            ) : null}

            {showChildren ? (
              <View style={[styles.card, styles.topColChildren]}>
                <SectionHeading title="Children" icon="family" />
                <View style={styles.cardBody}>
                  {children.length === 0 ? (
                    <Text style={styles.childText}>Yes</Text>
                  ) : (
                    children.map((c, i) => (
                      <View style={styles.childItem} key={`child-${i}`}>
                        <Text style={styles.childStrong}>Child {i + 1}</Text>
                        <Text style={styles.childText}>
                          {[
                            c.age ? `Age ${c.age}` : null,
                            c.gender,
                            typeof c.stayingWithYou === "boolean"
                              ? c.stayingWithYou
                                ? "Staying with you"
                                : "Not staying with you"
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" — ")}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            ) : null}

            {hasRows(addressRows) ? (
              <View style={[styles.card, styles.topColRight]}>
                <SectionHeading title="Address" icon="pin" />
                <View style={styles.cardBody}>
                  <DetailRows rows={addressRows} />
                </View>
              </View>
            ) : null}
          </View>

          {(hasRows(educationRows) || hasRows(religiousRows)) && (
            <View style={styles.midRow}>
              {hasRows(educationRows) ? (
                <View style={[styles.card, styles.midCol]}>
                  <SectionHeading title="Education & Career" icon="grad" />
                  <View style={styles.cardBody}>
                    <DetailRows rows={educationRows} />
                  </View>
                </View>
              ) : null}
              {hasRows(religiousRows) ? (
                <View style={[styles.card, styles.midCol]}>
                  <SectionHeading title="Religious & Background" icon="faith" />
                  <View style={styles.cardBody}>
                    <DetailRows rows={religiousRows} />
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {(hasRows(familyRows) || siblings.length > 0) && (
            <View style={styles.familyCard}>
              <SectionHeading title="Family Details" icon="users" />
              <View style={styles.familyGrid}>
                <View style={styles.familyLeft}>
                  <DetailRows rows={familyRows} />
                </View>
                {siblings.length > 0 ? (
                  <View style={styles.siblingList}>
                    {siblings.map((s) => (
                      <View style={styles.siblingItem} key={s.key}>
                        <View style={styles.siblingIcon}>
                          <SectionIcon kind="user" size={7} color={C.white} />
                        </View>
                        <Text style={styles.siblingText}>{s.line}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          )}

          <View style={styles.bottomGrid}>
            {otherDetails ? (
              <View style={[styles.card, styles.bottomCol]}>
                <SectionHeading title="Other Details" icon="info" />
                <View style={styles.cardBody}>
                  <Text style={styles.paragraph}>{otherDetails}</Text>
                </View>
              </View>
            ) : null}
            {profile.interests?.length ? (
              <View style={[styles.card, styles.bottomColWide]}>
                <SectionHeading title="Interests & Hobbies" icon="heart" />
                <View style={styles.cardBody}>
                  <View style={styles.interests}>
                    {profile.interests.slice(0, 5).map((interest) => (
                      <Text key={interest} style={styles.interestPill}>
                        {interest}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.disclaimer} wrap={false}>
            <View style={styles.shield}>
              <SectionIcon kind="shield" size={9} color={C.navySoft} />
            </View>
            <Text style={styles.disclaimerText}>
              Maher Marriage Bureau will not be responsible for the authenticity
              of information provided by applicants, nor for any disputes,
              misunderstandings, or consequences arising after the introduction
              of parties.
            </Text>
          </View>

          <View style={styles.footer} wrap={false}>
            <View style={[styles.footerCell, styles.footerDivider]}>
              <Text style={styles.footerText}>
                Generated on {new Date().toLocaleDateString("en-IN")}
              </Text>
            </View>
            <View style={[styles.footerCell, styles.footerDivider]}>
              <Text style={styles.footerText}>Maher Marriage Bureau</Text>
            </View>
            <View style={styles.footerCellWide}>
              <Text style={styles.footerText}>Phone: {bureauPhone}</Text>
            </View>
          </View>

          {/* Drawn last so it stays visible over content at low opacity */}
          {logoDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image style={styles.watermark} src={logoDataUrl} fixed />
          ) : null}
          <View style={styles.watermarkWrap} fixed>
            <Text style={styles.watermarkText}>Maher Marriage Bureau</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

function resolveFetchUrl(url: string): string {
  if (typeof window === "undefined") return url;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) return url;
    return `/api/image-proxy?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return url;
  }
}

/** react-pdf only embeds JPEG/PNG — convert WebP (and others) via canvas. */
function isJpegOrPng(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // JPEG SOI
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return true;
  // PNG signature
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return true;
  }
  return false;
}

async function blobToJpegDataUrl(blob: Blob): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return undefined;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return undefined;
  }
}

async function fetchImageAsDataUrl(url?: string | null): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const res = await fetch(resolveFetchUrl(url));
    if (!res.ok) return undefined;
    const buffer = new Uint8Array(await res.arrayBuffer());
    if (buffer.length === 0) return undefined;

    const blob = new Blob([buffer], {
      type: res.headers.get("content-type") || "application/octet-stream",
    });

    // @react-pdf/image only supports JPEG/PNG — convert WebP/etc via canvas.
    if (!isJpegOrPng(buffer)) {
      return await blobToJpegDataUrl(blob);
    }

    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

function resolveProfilePhotoUrl(path?: string | null): string | null {
  if (!path?.trim()) return null;
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) return buildImageUrl(API_BASE, trimmed);
  if (trimmed.startsWith("/uploads")) return buildImageUrl(API_BASE, trimmed);
  const uploadsBase =
    process.env.NEXT_PUBLIC_UPLOADS_BASE_URL ?? `${API_BASE}/uploads`;
  return buildImageUrl(uploadsBase, trimmed);
}

export default function DownloadProfilePDF({
  profile,
  variant = "outline",
}: DownloadProfilePDFProps) {
  const handleDownload = async () => {
    const imgs = profile.images ?? [];
    const primary =
      imgs.find((i) => i.isPrimary && !i.isPrivate)?.url ??
      imgs.find((i) => !i.isPrivate)?.url ??
      imgs.find((i) => i.isPrimary)?.url ??
      imgs[0]?.url;
    const imageUrl = resolveProfilePhotoUrl(primary);
    const [imageDataUrl, logoDataUrl] = await Promise.all([
      fetchImageAsDataUrl(imageUrl),
      fetchImageAsDataUrl("/logo-pdf.png"),
    ]);
    const blob = await pdf(
      <ProfileDocument
        profile={profile}
        imageDataUrl={imageDataUrl}
        logoDataUrl={logoDataUrl}
      />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileName =
      `${profile.firstName ?? ""}_${profile.lastName ?? ""}`.trim() || "Profile";
    link.download = `${fileName.replace(/\s+/g, "_")}_Profile_${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button type="button" variant={variant} onClick={() => void handleDownload()}>
      <Download className="h-4 w-4" />
      Download PDF
    </Button>
  );
}
