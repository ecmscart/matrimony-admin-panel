// Shared option lists for the profile create/edit forms so the "Add profile"
// and "Edit profile" screens stay in sync. Enum-backed fields (maritalStatus,
// familyType) use the backend enum value; every other field is a plain string
// column, so the human-readable label is stored as-is and shown on the site.

export type FieldOption = { value: string; label: string };

const o = (label: string, value: string = label): FieldOption => ({
  value,
  label,
});

// Marital status — enum-backed (server MaritalStatus).
export const MARITAL_STATUS_OPTIONS: FieldOption[] = [
  o("Never Married", "Never_Married"),
  o("Divorced", "Divorced"),
  o("Widowed", "Widowed"),
  o("Separated", "Separated"),
  o("Awaiting Divorce", "Awaiting_Divorce"),
  o("Second Marriage", "Second_Marriage"),
  o("Annulled", "Annulled"),
];

/** Marital statuses that imply a prior marriage — show children questions. */
export const PAST_MARRIAGE_STATUSES = new Set([
  "Divorced",
  "Widowed",
  "Separated",
  "Awaiting_Divorce",
  "Second_Marriage",
  "Annulled",
]);

export function isPastMarriageStatus(status?: string | null): boolean {
  if (!status) return false;
  return PAST_MARRIAGE_STATUSES.has(status.replace(/ /g, "_"));
}

// Family type — enum-backed (server FamilyType).
export const FAMILY_TYPE_OPTIONS: FieldOption[] = [
  o("Nuclear", "Nuclear"),
  o("Joint", "Joint"),
  o("Extended", "Extended"),
  o("Single Parent", "Single_Parent"),
  o("Other", "Other"),
];

export const FAMILY_TYPE_KNOWN_VALUES = [
  "Nuclear",
  "Joint",
  "Extended",
  "Single_Parent",
] as const;

/** Letters and spaces only, max 40 characters (Family Type — Other). */
export const FAMILY_TYPE_OTHER_REGEX = /^[A-Za-z\s]{1,40}$/;

export function sanitizeFamilyTypeOther(value: string): string {
  return value.replace(/[^A-Za-z\s]/g, "").slice(0, 40);
}

export function isKnownFamilyType(value?: string | null): boolean {
  return Boolean(
    value && (FAMILY_TYPE_KNOWN_VALUES as readonly string[]).includes(value),
  );
}

export function isValidFamilyTypeValue(value?: string | null): boolean {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "Other") return false;
  return isKnownFamilyType(trimmed) || FAMILY_TYPE_OTHER_REGEX.test(trimmed);
}

// Per-sibling relation (brother/sister) and marital status dropdowns.
export const SIBLING_RELATION_OPTIONS: FieldOption[] = [
  o("Brother"),
  o("Sister"),
];

export const SIBLING_MARITAL_STATUS_OPTIONS: FieldOption[] = [
  o("Married"),
  o("Unmarried"),
  o("Engaged"),
  o("Divorced"),
  o("Widowed"),
  o("Separated"),
];

// Whether the sibling is older or younger than the member.
export const SIBLING_AGE_RELATION_OPTIONS: FieldOption[] = [
  o("Older"),
  o("Younger"),
];

// Marriage preference — acceptable marital status of a prospective partner
// (multi-select, stored comma-separated). Admins may also add their own.
export const MARRIAGE_PREFERENCE_OPTIONS: FieldOption[] = [
  "Never Married",
  "Divorced",
  "Widowed",
  "Separated",
  "Second Marriage",
  "Any",
].map((x) => o(x));

// Mother tongue — multi-select (stored comma-separated).
export const MOTHER_TONGUE_OPTIONS: FieldOption[] = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Bengali",
  "Urdu",
  "Other",
].map((x) => o(x));

// Languages known — multi-select (stored as an array).
export const LANGUAGE_OPTIONS: FieldOption[] = [
  "English",
  "Hindi",
  "Urdu",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Bengali",
  "French",
  "Spanish",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Russian",
  "Other",
].map((x) => o(x));

export const COMPLEXION_OPTIONS: FieldOption[] = [
  "Fair",
  "Wheatish",
  "Dusky",
  "Dark",
  "Other",
].map((x) => o(x));

export const RELIGION_OPTIONS: FieldOption[] = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Buddhist",
  "Jain",
  "Parsi/Zoroastrian",
  "Jewish",
  "Other",
].map((x) => o(x));

// Indian states & union territories — single-select with "Others" free text.
export const INDIA_STATE_OPTIONS: FieldOption[] = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Others",
].map((x) => o(x));

// Education — multi-select (stored comma-separated).
export const EDUCATION_OPTIONS: FieldOption[] = [
  "High School Diploma",
  "Secondary School Certificate (SSC)",
  "Higher Secondary Certificate (HSC)",
  "Intermediate",
  "Pre-University Course (PUC)",
  "Diploma in Engineering",
  "Polytechnic Diploma",
  "ITI (Industrial Training Institute)",
  "Associate Degree",
  "Bachelor of Arts (BA)",
  "Bachelor of Science (BSc)",
  "Bachelor of Commerce (BCom)",
  "Bachelor of Business Administration (BBA)",
  "Bachelor of Computer Applications (BCA)",
  "Bachelor of Technology (BTech)",
  "Bachelor of Engineering (BE)",
  "Bachelor of Architecture (BArch)",
  "Bachelor of Pharmacy (BPharm)",
  "Bachelor of Education (BEd)",
  "Bachelor of Design (BDes)",
  "Bachelor of Laws (LLB)",
  "Bachelor of Medicine and Surgery (MBBS)",
  "Bachelor of Dental Surgery (BDS)",
  "Master of Arts (MA)",
  "Master of Science (MSc)",
  "Master of Commerce (MCom)",
  "Master of Business Administration (MBA)",
  "Master of Computer Applications (MCA)",
  "Master of Technology (MTech)",
  "Master of Engineering (ME)",
  "Master of Pharmacy (MPharm)",
  "Master of Education (MEd)",
  "Master of Laws (LLM)",
  "Master of Design (MDes)",
  "Postgraduate Diploma (PGD)",
  "Postgraduate Certificate",
  "Doctor of Philosophy (PhD)",
  "Doctor of Medicine (MD)",
  "Doctor of Science (DSc)",
  "Chartered Accountant (CA)",
  "Company Secretary (CS)",
  "Cost and Management Accountant (CMA)",
  "ACCA",
  "CPA",
  "PMP Certification",
  "Six Sigma Certification",
  "Google Certifications",
  "Microsoft Certifications",
  "AWS Certifications",
  "Cisco Certifications",
  "Oracle Certifications",
  "SAP Certifications",
  "Professional Diploma",
  "Vocational Training Certificate",
  "Apprenticeship Program",
  "Online Certifications",
  "Executive Education Programs",
  "Research Fellowship",
  "Post-Doctoral Fellowship",
  "Other",
].map((x) => o(x));

export const OCCUPATION_OPTIONS: FieldOption[] = [
  "Student",
  "Self-Employed",
  "Business Owner",
  "Private Employee",
  "Government Employee",
  "Unemployed",
  "Homemaker",
  "Freelancer",
  "Consultant",
  "Doctor",
  "Engineer",
  "Teacher",
  "Lawyer",
  "Accountant",
  "Architect",
  "Nurse",
  "Software Developer",
  "IT Professional",
  "HR",
  "Marketing",
  "Sales Manager",
  "Customer Service",
  "Logistics",
  "Supply Chain Professional",
  "Technician",
  "Electrician",
  "Driver",
  "Artist",
  "Writer",
  "Journalist",
  "Photographer",
  "Other",
].map((x) => o(x));

export const INCOME_OPTIONS: FieldOption[] = [
  "Below ₹5 LPA",
  "₹5 – ₹10 LPA",
  "₹10 – ₹15 LPA",
  "₹15 – ₹20 LPA",
  "₹20 – ₹25 LPA",
  "₹25 – ₹30 LPA",
  "₹30 – ₹40 LPA",
  "₹40 – ₹50 LPA",
  "₹50 – ₹75 LPA",
  "₹75 LPA – ₹1 Crore",
  "₹1 – ₹2 Crore",
  "₹2 – ₹3 Crore",
  "₹3 – ₹4 Crore",
  "₹4 – ₹5 Crore",
  "Above ₹5 Crore",
  "Other",
].map((x) => o(x));

function buildHeightOptions(): FieldOption[] {
  const out: FieldOption[] = [];
  for (let feet = 4; feet <= 7; feet++) {
    for (let inch = 0; inch <= 11; inch++) {
      if (feet === 7 && inch > 0) break;
      const label = `${feet}'${inch}"`;
      out.push(o(label));
    }
  }
  return out;
}

// Height — dropdown in feet/inches, e.g. 5'7".
export const HEIGHT_OPTIONS: FieldOption[] = buildHeightOptions();

// Self caste + caste preference share the same community list.
export const CASTE_OPTIONS: FieldOption[] = [
  o("Syed"),
  o("Sheikh"),
  o("Pathan"),
  o("Mughal"),
  o("Mirza"),
  o("Malik"),
  o("Khan"),
  o("Rajput"),
  o("Chaudhary"),
  o("Ansari"),
  o("Qureshi"),
  o("Siddiqui"),
  o("Mansoori"),
  o("Saifi"),
  o("Darzi"),
  o("Rayeen"),
  o("Hajjam"),
  o("Teli"),
  o("Dhobi"),
  o("Rangrez"),
  o("Chhipi"),
  o("Barhai"),
  o("Bhatiara"),
  o("Faqir"),
  o("Mirasi"),
  o("Momin"),
  o("Julaha"),
  o("Kunjra"),
  o("Idrisi"),
  o("Lohar"),
  o("Dhunia"),
  o("Qassab"),
  o("Nai"),
  o("Mewati"),
  o("Banjara"),
  o("Gujjar"),
  o("Baloch"),
  o("Arain"),
  o("Kayastha"),
  o("Halalkhor"),
  o("Lalbegi"),
  o("Mehtar"),
  o("Chikwa"),
  o("Mochi"),
  o("Nat"),
  o("Bari"),
  o("Attar"),
  o("Baghban"),
  o("Raeen"),
  o("Shamshi"),
  o("Rangad"),
  o("Lahori"),
  o("Hasmi"),
  o("Farooqi"),
  o("Other"),
];

// Caste / community preference (multi-select). Admins may also add custom values.
export const CASTE_PREFERENCE_OPTIONS: FieldOption[] = [
  ...CASTE_OPTIONS,
  o("Caste No Bar"),
];

export const FATHER_TITLE_OPTIONS: FieldOption[] = [
  o("Mr.", "Mr."),
  o("Lt.", "Lt."),
];

export const MOTHER_TITLE_OPTIONS: FieldOption[] = [
  o("Mrs.", "Mrs."),
  o("Lt.", "Lt."),
];

/** Letters and spaces only, max 20 characters (City / Home Town / Education City). */
export const CITY_TEXT_REGEX = /^[A-Za-z\s]{1,20}$/;

export function sanitizeCityText(value: string): string {
  return value.replace(/[^A-Za-z\s]/g, "").slice(0, 20);
}

export function isValidCityText(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && CITY_TEXT_REGEX.test(trimmed);
}

export function parseParentName(full?: string | null): {
  title: string;
  name: string;
} {
  const raw = (full ?? "").trim();
  if (!raw) return { title: "", name: "" };
  const titles = ["Mr.", "Mrs.", "Lt."];
  for (const title of titles) {
    if (raw === title) return { title, name: "" };
    if (raw.startsWith(`${title} `)) {
      return { title, name: raw.slice(title.length).trim() };
    }
  }
  return { title: "", name: raw };
}

export function formatParentName(title: string, name: string): string {
  const n = name.trim();
  const t = title.trim();
  if (!n) return "";
  return t ? `${t} ${n}` : n;
}

export function isLateTitle(title?: string | null): boolean {
  return (title ?? "").trim() === "Lt.";
}

// When editing existing data, the stored value may not be one of the options
// above (e.g. free-text imported earlier). Keep it selectable so saving the
// form never silently drops it.
export function ensureOption(
  options: FieldOption[],
  value?: string | null,
): FieldOption[] {
  if (!value) return options;
  return options.some((opt) => opt.value === value)
    ? options
    : [{ value, label: value }, ...options];
}
