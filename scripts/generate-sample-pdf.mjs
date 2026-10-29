/**
 * Sample PDF matching ChatGPT biodata CSS design (scaled to A4).
 * Run: node scripts/generate-sample-pdf.mjs
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
  Circle,
  renderToFile,
} from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_W = 195;
const PHOTO_H = 260;

const C = {
  navy: "#071e43",
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

const styles = StyleSheet.create({
  page: { backgroundColor: C.pageBg, fontFamily: "Helvetica", position: "relative" },
  watermark: { position: "absolute", top: 300, left: 170, width: 250, height: 190, opacity: 0.1 },
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
  sheet: { flex: 1, backgroundColor: C.cream, borderWidth: 1, borderColor: C.gold, position: "relative" },
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
  logo: { width: 48, height: 36, objectFit: "contain" },
  headerContent: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
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
  phoneText: { fontFamily: "Times-Roman", fontSize: 9, color: C.phone },
  headerSpacer: { width: 52 },
  hero: {
    flexDirection: "row",
    gap: 18,
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  heroLeft: { flex: 1 },
  profileName: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    color: C.navy,
    marginBottom: 6,
    lineHeight: 1.2,
  },
  profileMeta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 8 },
  metaText: { fontSize: 9, color: "#101827" },
  metaDivider: { width: 1, height: 11, backgroundColor: "#9f8250" },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
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
  aboutTop: { marginTop: 4 },
  inlineTitle: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  inlineIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.navySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineTitleText: { fontFamily: "Times-Bold", fontSize: 10, color: C.navy },
  aboutText: { fontSize: 8.5, lineHeight: 1.45, color: C.text },
  photoFrame: {
    width: PHOTO_W,
    height: PHOTO_H,
    borderWidth: 2,
    borderColor: C.gold,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#e8e3d9",
  },
  photo: { width: PHOTO_W, height: PHOTO_H, objectFit: "cover" },
  topGrid: { flexDirection: "row", gap: 8, paddingHorizontal: 12, alignItems: "flex-start" },
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
  },
  cardSpaced: { marginTop: 8 },
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
  sectionRibbonText: { fontFamily: "Times-Bold", fontSize: 8, color: C.white },
  cardBody: { marginTop: 10 },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 1.5,
    borderBottomWidth: 0.6,
    borderBottomColor: "rgba(93, 78, 47, 0.15)",
  },
  detailLabel: { width: "38%", fontSize: 7.5, color: C.label },
  separator: { width: 10, fontSize: 7.5, color: C.label, textAlign: "center" },
  detailValue: { flex: 1, fontSize: 7.5, color: C.text, fontFamily: "Helvetica-Bold" },
  childItem: { marginBottom: 6 },
  childStrong: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 1 },
  childText: { fontSize: 7.5, color: C.text, marginLeft: 6, lineHeight: 1.35 },
  educationWrap: { width: "59%", paddingTop: 8, paddingLeft: 12 },
  midRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    alignItems: "flex-start",
  },
  midCol: { flex: 1 },
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
  familyGrid: { flexDirection: "row", gap: 12, marginTop: 8 },
  familyLeft: { flex: 1.15 },
  siblingList: {
    flex: 1,
    paddingLeft: 10,
    borderLeftWidth: 0.8,
    borderLeftColor: "#9e8652",
    gap: 5,
  },
  siblingItem: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  siblingIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.navySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  siblingText: { flex: 1, fontSize: 7.5, color: C.text, lineHeight: 1.3 },
  bottomGrid: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  bottomCol: { flex: 1 },
  bottomColWide: { flex: 1.1 },
  paragraph: { fontSize: 7.5, lineHeight: 1.4, color: C.text },
  interests: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
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
  disclaimerText: { flex: 1, fontSize: 6.5, lineHeight: 1.35, color: C.navy, textAlign: "center" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.navyDeep,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  footerCell: { flex: 1, alignItems: "center", borderRightWidth: 1, borderRightColor: "#cb9b38" },
  footerCellWide: { flex: 1.25, alignItems: "center" },
  footerText: { fontFamily: "Times-Roman", fontSize: 7.5, color: C.white, textAlign: "center" },
});

function makeSolidPng(r, g, b, w, h) {
  const rowSize = 1 + w * 3;
  const data = Buffer.alloc(rowSize * h);
  for (let y = 0; y < h; y++) {
    const off = y * rowSize;
    data[off] = 0;
    for (let x = 0; x < w; x++) {
      const i = off + 1 + x * 3;
      const t = (x + y) / (w + h);
      data[i] = Math.min(255, Math.round(r + t * 40));
      data[i + 1] = Math.min(255, Math.round(g + t * 20));
      data[i + 2] = Math.min(255, Math.round(b + t * 30));
    }
  }
  const compressed = zlib.deflateSync(data);
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
    return ~c >>> 0;
  }
  function chunk(type, body) {
    const typeBuf = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, body])));
    return Buffer.concat([len, typeBuf, body, crcBuf]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function SectionGlyph(kind) {
  if (kind === "grad") {
    return React.createElement(
      Svg,
      { width: 9, height: 9, viewBox: "0 0 24 24" },
      React.createElement(Path, { d: "M2 10l10-5 10 5-10 5L2 10z", fill: C.white }),
    );
  }
  if (kind === "faith") {
    return React.createElement(
      Svg,
      { width: 9, height: 9, viewBox: "0 0 24 24" },
      React.createElement(Path, {
        d: "M14 4a7.5 7.5 0 100 15 6.2 6.2 0 01-4.2-10.8A7.4 7.4 0 0114 4z",
        fill: C.white,
      }),
    );
  }
  if (kind === "pin") {
    return React.createElement(
      Svg,
      { width: 9, height: 9, viewBox: "0 0 24 24" },
      React.createElement(Path, {
        d: "M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z",
        fill: C.white,
      }),
    );
  }
  if (kind === "heart") {
    return React.createElement(
      Svg,
      { width: 9, height: 9, viewBox: "0 0 24 24" },
      React.createElement(Path, {
        d: "M12 20s-7-4.4-7-9.2A4.2 4.2 0 0112 8.2a4.2 4.2 0 017 2.6C19 15.6 12 20 12 20z",
        fill: C.white,
      }),
    );
  }
  if (kind === "info") {
    return React.createElement(
      Svg,
      { width: 9, height: 9, viewBox: "0 0 24 24" },
      React.createElement(Circle, { cx: 12, cy: 12, r: 8.5, fill: C.white }),
    );
  }
  // user / family / users default
  return React.createElement(
    Svg,
    { width: 9, height: 9, viewBox: "0 0 24 24" },
    React.createElement(Circle, { cx: 12, cy: 8, r: 3.2, fill: C.white }),
    React.createElement(Path, { d: "M5.5 19c1.2-3.2 3.6-4.8 6.5-4.8S17.8 15.8 19 19", fill: C.white }),
  );
}

function SectionHeading(title, icon = "user") {
  return React.createElement(
    View,
    { style: styles.sectionHeading },
    React.createElement(View, { style: styles.sectionIcon }, SectionGlyph(icon)),
    React.createElement(
      View,
      { style: styles.sectionRibbon },
      React.createElement(Text, { style: styles.sectionRibbonText }, title),
    ),
  );
}

function DetailRows(rows) {
  return rows.map(([label, value]) =>
    React.createElement(
      View,
      { style: styles.detailRow, key: label },
      React.createElement(Text, { style: styles.detailLabel }, label),
      React.createElement(Text, { style: styles.separator }, ":"),
      React.createElement(Text, { style: styles.detailValue }, `${value}`),
    ),
  );
}

const sample = {
  name: "Farhaan Ahmed Qureshi",
  age: 38,
  height: `5'10"`,
  city: "Mumbai",
  state: "Maharashtra",
  profileNumber: "MMB-2088",
  about:
    "Divorced professional seeking a respectful second marriage. Caring father, family-oriented, and settled in Mumbai with a stable career.",
  personal: [
    ["Date of Birth", "12 Mar 1988"],
    ["Height", `5'10"`],
    ["Complexion", "Wheatish"],
    ["Gender", "Male"],
    ["Marital Status", "Divorced"],
    ["Mother Tongue", "Urdu"],
    ["Languages Known", "Urdu, Hindi, English, Marathi"],
    ["Has Children", "Yes"],
  ],
  children: [
    { title: "Child 1", text: "Age 8 — Male — Staying with you" },
    { title: "Child 2", text: "Age 5 — Female — Staying with you" },
  ],
  address: [
    ["Address City", "Mumbai"],
    ["Address Area", "Andheri West"],
  ],
  religious: [
    ["Religion", "Islam (Sunni)"],
    ["Caste", "Qureshi"],
    ["Caste Preference", "Caste No Bar"],
    ["Marriage Preference", "Divorced, Widowed, Separated"],
    ["Family Type", "Nuclear"],
    ["City", "Mumbai"],
    ["State", "Maharashtra"],
    ["Home Town", "Lucknow"],
  ],
  education: [
    ["Education", "B.Tech Computer Science, MBA Finance"],
    ["University", "University of Mumbai"],
    ["Education City", "Mumbai"],
    ["Occupation", "Senior Product Manager — Fintech"],
    ["Income", "₹35-40 LPA"],
  ],
  family: [
    ["Father's Name", "Mohammed Qureshi"],
    ["Father's Occupation", "Retired Bank Manager"],
    ["Mother's Name", "Nasreen Qureshi"],
    ["Mother's Occupation", "Homemaker"],
    ["Total Siblings", "2 Brothers, 1 Sister"],
    ["Brother's Education", "Elder brother — CA; Younger brother — B.Com"],
    ["Sister's Education", "Younger sister — M.Sc Biotechnology"],
  ],
  siblings: [
    "Sibling 1: Imran — Brother — Elder — Married — CA — Own practice",
    "Sibling 2: Zoya — Sister — Younger — Unmarried — M.Sc Biotech — Research Associate",
    "Sibling 3: Ayaan — Brother — Younger — Unmarried — B.Com — Business",
  ],
  otherDetails:
    "Divorce finalized amicably in 2022. Children stay with father. Looking for a partner open to a blended family. Completed Umrah (2024).",
  interests: ["Reading", "Travel", "Cricket", "Cooking", "Community Service"],
};

async function main() {
  const logoPath = path.join(__dirname, "..", "public", "logo-pdf.png");
  const logoDataUrl = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
  const photo = `data:image/png;base64,${makeSolidPng(55, 75, 120, 80, 100).toString("base64")}`;
  const bureauPhone = "98115 99425, 98119 90161";

  const card = (title, body, icon = "user", extraStyle) =>
    React.createElement(
      View,
      { style: extraStyle ? [styles.card, extraStyle] : styles.card },
      SectionHeading(title, icon),
      React.createElement(View, { style: styles.cardBody }, ...body),
    );

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page, wrap: false },
      React.createElement(
        View,
        { style: styles.sheet },
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(
            View,
            { style: styles.logoWrap },
            React.createElement(Image, { style: styles.logo, src: logoDataUrl }),
          ),
          React.createElement(
            View,
            { style: styles.headerContent },
            React.createElement(Text, { style: styles.brandTitle }, "Maher Marriage Bureau"),
            React.createElement(
              View,
              { style: styles.phonePill },
              React.createElement(Text, { style: styles.phoneText }, bureauPhone),
            ),
          ),
          React.createElement(View, { style: styles.headerSpacer }),
        ),
        React.createElement(
          View,
          { style: styles.hero },
          React.createElement(
            View,
            { style: styles.heroLeft },
            React.createElement(
              Text,
              { style: styles.profileName },
              `${sample.name}, ${sample.age} · ${sample.height}`,
            ),
            React.createElement(
              View,
              { style: styles.profileMeta },
              React.createElement(Text, { style: styles.metaText }, `${sample.city}, ${sample.state}`),
              React.createElement(View, { style: styles.metaDivider }),
              React.createElement(
                Text,
                { style: styles.metaText },
                `Profile ID: ${sample.profileNumber}`,
              ),
            ),
            React.createElement(
              View,
              { style: styles.badges },
              React.createElement(Text, { style: [styles.badge, styles.badgeVerified] }, "Verified"),
              React.createElement(Text, { style: [styles.badge, styles.badgeVip] }, "VIP"),
              React.createElement(Text, { style: [styles.badge, styles.badgePremium] }, "Premium"),
            ),
            React.createElement(
              View,
              { style: styles.aboutTop },
              React.createElement(
                View,
                { style: styles.inlineTitle },
                React.createElement(View, { style: styles.inlineIcon }, SectionGlyph("user")),
                React.createElement(Text, { style: styles.inlineTitleText }, "ABOUT"),
              ),
              React.createElement(Text, { style: styles.aboutText }, sample.about),
            ),
          ),
          React.createElement(
            View,
            { style: styles.photoFrame },
            React.createElement(Image, { style: styles.photo, src: photo }),
          ),
        ),
        React.createElement(
          View,
          { style: styles.topGrid },
          React.createElement(
            View,
            { style: styles.topColPersonal },
            card("Personal Details", DetailRows(sample.personal), "user"),
          ),
          React.createElement(
            View,
            { style: styles.topColChildren },
            card(
              "Children",
              sample.children.map((c) =>
                React.createElement(
                  View,
                  { style: styles.childItem, key: c.title },
                  React.createElement(Text, { style: styles.childStrong }, c.title),
                  React.createElement(Text, { style: styles.childText }, c.text),
                ),
              ),
              "family",
            ),
          ),
          React.createElement(
            View,
            { style: styles.topColRight },
            card("Address", DetailRows(sample.address), "pin"),
          ),
        ),
        React.createElement(
          View,
          { style: styles.midRow },
          React.createElement(
            View,
            { style: styles.midCol },
            card("Education & Career", DetailRows(sample.education), "grad"),
          ),
          React.createElement(
            View,
            { style: styles.midCol },
            card("Religious & Background", DetailRows(sample.religious), "faith"),
          ),
        ),
        React.createElement(
          View,
          { style: styles.familyCard },
          SectionHeading("Family Details", "users"),
          React.createElement(
            View,
            { style: styles.familyGrid },
            React.createElement(View, { style: styles.familyLeft }, ...DetailRows(sample.family)),
            React.createElement(
              View,
              { style: styles.siblingList },
              ...sample.siblings.map((line) =>
                React.createElement(
                  View,
                  { style: styles.siblingItem, key: line },
                  React.createElement(View, { style: styles.siblingIcon }, SectionGlyph("user")),
                  React.createElement(Text, { style: styles.siblingText }, line),
                ),
              ),
            ),
          ),
        ),
        React.createElement(
          View,
          { style: styles.bottomGrid },
          React.createElement(
            View,
            { style: styles.bottomCol },
            card("Other Details", [
              React.createElement(Text, { style: styles.paragraph, key: "od" }, sample.otherDetails),
            ], "info"),
          ),
          React.createElement(
            View,
            { style: styles.bottomColWide },
            card("Interests & Hobbies", [
              React.createElement(
                View,
                { style: styles.interests, key: "ints" },
                ...sample.interests.slice(0, 5).map((i) =>
                  React.createElement(Text, { key: i, style: styles.interestPill }, i),
                ),
              ),
            ], "heart"),
          ),
        ),
        React.createElement(
          View,
          { style: styles.disclaimer },
          React.createElement(View, { style: styles.shield }, SectionGlyph("info")),
          React.createElement(
            Text,
            { style: styles.disclaimerText },
            "Maher Marriage Bureau will not be responsible for the authenticity of information provided by applicants, nor for any disputes, misunderstandings, or consequences arising after the introduction of parties.",
          ),
        ),
        React.createElement(
          View,
          { style: styles.footer },
          React.createElement(
            View,
            { style: styles.footerCell },
            React.createElement(
              Text,
              { style: styles.footerText },
              `Generated on ${new Date().toLocaleDateString("en-IN")}`,
            ),
          ),
          React.createElement(
            View,
            { style: styles.footerCell },
            React.createElement(Text, { style: styles.footerText }, "Maher Marriage Bureau"),
          ),
          React.createElement(
            View,
            { style: styles.footerCellWide },
            React.createElement(Text, { style: styles.footerText }, `Phone: ${bureauPhone}`),
          ),
        ),
        React.createElement(Image, { style: styles.watermark, src: logoDataUrl, fixed: true }),
        React.createElement(
          View,
          { style: styles.watermarkWrap, fixed: true },
          React.createElement(Text, { style: styles.watermarkText }, "Maher Marriage Bureau"),
        ),
      ),
    ),
  );

  const outPath = path.join(__dirname, "..", "sample-profile.pdf");
  await renderToFile(doc, outPath);
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
