"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useCallback, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckboxGroup } from "@/components/forms/CheckboxGroup";
import { AutocompleteInput } from "@/components/forms/AutocompleteInput";
import { SelectWithOther } from "@/components/forms/SelectWithOther";
import { MultiSelectDropdown } from "@/components/forms/MultiSelectDropdown";
import {
  CASTE_OPTIONS,
  CASTE_PREFERENCE_OPTIONS,
  CITY_TEXT_REGEX,
  COMPLEXION_OPTIONS,
  EDUCATION_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  FATHER_TITLE_OPTIONS,
  HEIGHT_OPTIONS,
  INCOME_OPTIONS,
  INDIA_STATE_OPTIONS,
  LANGUAGE_OPTIONS,
  MARRIAGE_PREFERENCE_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MOTHER_TITLE_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  OCCUPATION_OPTIONS,
  RELIGION_OPTIONS,
  SIBLING_AGE_RELATION_OPTIONS,
  SIBLING_MARITAL_STATUS_OPTIONS,
  SIBLING_RELATION_OPTIONS,
  formatParentName,
  isLateTitle,
  isPastMarriageStatus,
  sanitizeCityText,
  sanitizeFamilyTypeOther,
} from "@/lib/constants/profile-options";
import { useCreateProfile } from "@/lib/hooks/admin";
import { adminApi } from "@/lib/api/admin";
import type { CreateProfileInput } from "@/lib/types/profile";
import { toast } from "sonner";

function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function maxAdultDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split("T")[0];
}

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const CITY_MSG = "Letters and spaces only (max 20)";
const cityField = z
  .string()
  .min(1, "Required")
  .max(20, CITY_MSG)
  .regex(CITY_TEXT_REGEX, CITY_MSG);

const schema = z
  .object({
    // Account
    firstName: z.string().min(1, "Required"),
    lastName: z.string().min(1, "Required"),
    email: z.string().email("Invalid email"),
    phone: z.string().regex(INDIAN_MOBILE, "Enter a valid 10-digit Indian mobile number"),
    gender: z.enum(["Male", "Female"]),
    dateOfBirth: z.string().min(1, "Required"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/\d/, "Must include a number")
      .optional()
      .or(z.literal("")),
    // Matrimony profile
    height: z.string().min(1, "Required"),
    maritalStatus: z.enum([
      "Never_Married",
      "Divorced",
      "Widowed",
      "Separated",
      "Awaiting_Divorce",
      "Second_Marriage",
      "Annulled",
    ]),
    motherTongue: z.array(z.string()).min(1, "Select at least one"),
    familyType: z
      .string()
      .min(1, "Required")
      .max(40, "Max 40 characters")
      .refine((v) => v !== "Other", "Please specify family type")
      .refine(
        (v) =>
          ["Nuclear", "Joint", "Extended", "Single_Parent"].includes(v) ||
          /^[A-Za-z\s]{1,40}$/.test(v),
        "Letters only, max 40 characters",
      ),
    religion: z.string().min(1, "Required"),
    caste: z.string().min(1, "Required"),
    city: cityField,
    state: z.string().min(1, "Required"),
    education: z.array(z.string()).min(1, "Select at least one"),
    educationUniversity: z.string().optional(),
    occupation: z.string().min(1, "Required"),
    income: z.string().min(1, "Required"),
    about: z.string().min(20, "At least 20 characters").max(1000, "Max 1000 characters"),
    interests: z.string().optional(),
    complexion: z.string().min(1, "Required"),
    homeTown: cityField,
    educationCity: cityField,
    castePreference: z.array(z.string()).min(1, "Select at least one"),
    marriagePreference: z.array(z.string()).min(1, "Select at least one"),
    languagesKnown: z.array(z.string()).min(1, "Select at least one"),
    currentAddress: z.string().optional(),
    addressCity: z.string().optional(),
    addressArea: z.string().max(25, "Max 25 characters").optional(),
    fatherTitle: z.string().min(1, "Required"),
    fatherName: z.string().min(1, "Required"),
    fatherOccupation: z.string().min(1, "Required"),
    motherTitle: z.string().min(1, "Required"),
    motherName: z.string().min(1, "Required"),
    motherOccupation: z.string().min(1, "Required"),
    totalSiblings: z.string().optional(),
    siblings: z
      .array(
        z.object({
          name: z.string().optional(),
          relation: z.string().optional(),
          ageRelation: z.string().optional(),
          maritalStatus: z.string().optional(),
          education: z.string().optional(),
          profession: z.string().optional(),
        }),
      )
      .optional(),
    hasChildren: z.enum(["", "yes", "no"]).optional(),
    children: z
      .array(
        z.object({
          age: z.string().optional(),
          gender: z.string().optional(),
          stayingWithYou: z.enum(["yes", "no"]).optional(),
        }),
      )
      .optional(),
    fatherPhone: z.string().optional(),
    motherPhone: z.string().optional(),
    otherPhone: z.string().optional(),
    coordinatorNumber: z.string().min(1, "Required"),
    otherDetails: z.string().optional(),
  })
  .refine((v) => !v.dateOfBirth || ageFromDob(v.dateOfBirth) >= 18, {
    message: "User must be at least 18 years old",
    path: ["dateOfBirth"],
  })
  .superRefine((v, ctx) => {
    if (!isLateTitle(v.fatherTitle)) {
      if (!v.fatherPhone || !INDIAN_MOBILE.test(v.fatherPhone)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid 10-digit Indian mobile number",
          path: ["fatherPhone"],
        });
      }
    } else if (v.fatherPhone && !INDIAN_MOBILE.test(v.fatherPhone)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid 10-digit Indian mobile number",
        path: ["fatherPhone"],
      });
    }
    if (!isLateTitle(v.motherTitle)) {
      if (!v.motherPhone || !INDIAN_MOBILE.test(v.motherPhone)) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid 10-digit Indian mobile number",
          path: ["motherPhone"],
        });
      }
    } else if (v.motherPhone && !INDIAN_MOBILE.test(v.motherPhone)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid 10-digit Indian mobile number",
        path: ["motherPhone"],
      });
    }
    if (!isPastMarriageStatus(v.maritalStatus)) return;
    if (v.hasChildren !== "yes" && v.hasChildren !== "no") {
      ctx.addIssue({
        code: "custom",
        message: "Required for past marriage status",
        path: ["hasChildren"],
      });
      return;
    }
    if (v.hasChildren === "yes") {
      const kids = v.children ?? [];
      if (kids.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Add at least one child",
          path: ["children"],
        });
      }
      kids.forEach((c, i) => {
        if (!c.age?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["children", i, "age"],
          });
        }
        if (!c.gender) {
          ctx.addIssue({
            code: "custom",
            message: "Required",
            path: ["children", i, "gender"],
          });
        }
      });
    }
  });

type FormData = z.infer<typeof schema>;

export default function NewProfilePage() {
  const router = useRouter();
  const create = useCreateProfile();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: "Male",
      maritalStatus: "Never_Married",
      familyType: "Nuclear",
      motherTongue: [],
      education: [],
      languagesKnown: [],
      castePreference: [],
      marriagePreference: [],
      siblings: [],
      hasChildren: "",
      children: [],
      fatherTitle: "Mr.",
      motherTitle: "Mrs.",
    },
  });

  const registerNumeric = (
    name: "phone" | "fatherPhone" | "motherPhone" | "coordinatorNumber",
    max = 10,
  ) => {
    const reg = form.register(name);
    return {
      ...reg,
      inputMode: "numeric" as const,
      maxLength: max,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, max);
        return reg.onChange(e);
      },
    };
  };

  const registerCity = (name: "city" | "homeTown" | "educationCity") => {
    const reg = form.register(name);
    return {
      ...reg,
      maxLength: 20,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        e.target.value = sanitizeCityText(e.target.value);
        return reg.onChange(e);
      },
    };
  };

  const [pincode, setPincode] = useState("");
  const [areaOptions, setAreaOptions] = useState<string[]>([]);
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const siblingArray = useFieldArray({
    control: form.control,
    name: "siblings",
  });
  const childArray = useFieldArray({
    control: form.control,
    name: "children",
  });
  const maritalStatus = form.watch("maritalStatus");
  const hasChildren = form.watch("hasChildren");
  const fatherTitle = form.watch("fatherTitle");
  const motherTitle = form.watch("motherTitle");
  const showChildrenQuestions = isPastMarriageStatus(maritalStatus);
  const fatherIsLate = isLateTitle(fatherTitle);
  const motherIsLate = isLateTitle(motherTitle);

  const setSiblingCount = (count: number) => {
    const current = siblingArray.fields.length;
    if (count > current) {
      for (let i = current; i < count; i++) {
        siblingArray.append({
          name: "",
          relation: "",
          maritalStatus: "",
          education: "",
          profession: "",
        });
      }
    } else {
      for (let i = current; i > count; i--) {
        siblingArray.remove(i - 1);
      }
    }
  };

  const fetchUniversities = useCallback(
    (q: string) => adminApi.searchUniversities(q).then((r) => r.universities),
    [],
  );

  async function onPincodeChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setPincode(digits);
    if (digits.length !== 6) {
      setAreaOptions([]);
      setPincodeStatus(null);
      return;
    }
    setPincodeStatus("Looking up PIN code...");
    try {
      const res = await adminApi.lookupPincode(digits);
      if (!res.state && res.areas.length === 0) {
        setAreaOptions([]);
        setPincodeStatus("No match found for this PIN code.");
        return;
      }
      if (res.state) form.setValue("state", res.state);
      if (res.district) {
        form.setValue("addressCity", res.district);
        if (!form.getValues("city")) {
          form.setValue("city", sanitizeCityText(res.district));
        }
      }
      setAreaOptions(res.areas);
      const location = [res.district, res.state].filter(Boolean).join(", ");
      setPincodeStatus(location ? `Found: ${location}` : "Location found.");
    } catch {
      setAreaOptions([]);
      setPincodeStatus("Lookup failed. Please enter the address manually.");
    }
  }

  async function onSubmit(values: FormData) {
    const opt = (s?: string) => {
      const t = s?.trim();
      return t ? t : undefined;
    };
    const interests = values.interests
      ? values.interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];
    const languagesKnown = values.languagesKnown ?? [];

    if (interests.length === 0) {
      form.setError("interests", { message: "Add at least one interest" });
      return;
    }

    const body: CreateProfileInput = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
      password: opt(values.password),
      religion: values.religion,
      caste: values.caste,
      city: values.city,
      state: values.state,
      education: values.education.join(", "),
      educationUniversity: opt(values.educationUniversity),
      occupation: values.occupation,
      income: values.income,
      height: values.height,
      about: values.about,
      familyType: values.familyType,
      maritalStatus: values.maritalStatus,
      motherTongue: values.motherTongue.join(", "),
      interests,
      complexion: values.complexion,
      homeTown: values.homeTown.trim(),
      educationCity: values.educationCity.trim(),
      castePreference: values.castePreference.join(", "),
      marriagePreference: values.marriagePreference.join(", "),
      languagesKnown,
      currentAddress: opt(values.currentAddress),
      addressCity: opt(values.addressCity),
      addressArea: opt(values.addressArea),
      fatherName: formatParentName(values.fatherTitle, values.fatherName),
      fatherOccupation: values.fatherOccupation,
      motherName: formatParentName(values.motherTitle, values.motherName),
      motherOccupation: values.motherOccupation,
      totalSiblings: values.siblings?.length
        ? String(values.siblings.length)
        : undefined,
      siblings: values.siblings?.length
        ? values.siblings.map((s) => ({
            name: s.name?.trim() ?? "",
            relation: s.relation?.trim() ?? "",
            ageRelation: s.ageRelation?.trim() ?? "",
            maritalStatus: s.maritalStatus?.trim() ?? "",
            education: s.education?.trim() ?? "",
            profession: s.profession?.trim() ?? "",
          }))
        : undefined,
      hasChildren: isPastMarriageStatus(values.maritalStatus)
        ? values.hasChildren === "yes"
        : undefined,
      children:
        isPastMarriageStatus(values.maritalStatus) && values.hasChildren === "yes"
          ? (values.children ?? []).map((c) => ({
              age: c.age?.trim() ?? "",
              gender: c.gender ?? "",
              stayingWithYou: c.stayingWithYou !== "no",
            }))
          : undefined,
      fatherPhone: opt(values.fatherPhone),
      motherPhone: opt(values.motherPhone),
      otherPhone: opt(values.otherPhone),
      coordinatorNumber: opt(values.coordinatorNumber),
      otherDetails: opt(values.otherDetails),
    };

    const result = await create.mutateAsync(body);
    toast.success("Profile created. Upload at least one photo before publishing.");
    router.push(`/users/${result.userId}/edit`);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/users"
        className="text-sm text-(--color-muted-foreground) inline-flex items-center gap-1 hover:text-(--color-foreground)"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to profiles
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add profile</h1>
        <p className="text-sm text-(--color-muted-foreground)">
          Creates a user account and its matrimony profile.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name" error={form.formState.errors.firstName?.message}>
              <Input {...form.register("firstName")} />
            </Field>
            <Field label="Last name" error={form.formState.errors.lastName?.message}>
              <Input {...form.register("lastName")} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Phone" error={form.formState.errors.phone?.message}>
              <Input placeholder="9876543210" {...registerNumeric("phone")} />
            </Field>
            <Field label="Gender" error={form.formState.errors.gender?.message}>
              <Select {...form.register("gender")}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </Field>
            <Field label="Date of birth" error={form.formState.errors.dateOfBirth?.message}>
              <Input type="date" max={maxAdultDob()} {...form.register("dateOfBirth")} />
            </Field>
            <Field
              label="Password (optional — leave blank to set later)"
              error={form.formState.errors.password?.message}
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  className="pr-10"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-(--color-muted-foreground) hover:text-(--color-foreground)"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Personal</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Height" error={form.formState.errors.height?.message}>
              <Select defaultValue="" {...form.register("height")}>
                <option value="" disabled>
                  Select height
                </option>
                {HEIGHT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Family type" error={form.formState.errors.familyType?.message}>
              <Controller
                control={form.control}
                name="familyType"
                render={({ field }) => (
                  <SelectWithOther
                    value={field.value ?? ""}
                    onChange={(v) =>
                      field.onChange(
                        ["Nuclear", "Joint", "Extended", "Single_Parent", "Other"].includes(v)
                          ? v
                          : sanitizeFamilyTypeOther(v),
                      )
                    }
                    onBlur={field.onBlur}
                    options={FAMILY_TYPE_OPTIONS}
                    placeholder="Select family type"
                    maxLength={40}
                    sanitize={sanitizeFamilyTypeOther}
                  />
                )}
              />
            </Field>
            <Field label="Complexion" error={form.formState.errors.complexion?.message}>
              <Controller
                control={form.control}
                name="complexion"
                render={({ field }) => (
                  <SelectWithOther
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={COMPLEXION_OPTIONS}
                    placeholder="Select complexion"
                  />
                )}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Mother tongue (select one or more)"
                error={form.formState.errors.motherTongue?.message}
              >
                <Controller
                  control={form.control}
                  name="motherTongue"
                  render={({ field }) => (
                    <CheckboxGroup
                      options={MOTHER_TONGUE_OPTIONS}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Languages known"
                error={form.formState.errors.languagesKnown?.message}
              >
                <Controller
                  control={form.control}
                  name="languagesKnown"
                  render={({ field }) => (
                    <MultiSelectDropdown
                      options={LANGUAGE_OPTIONS}
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Select languages"
                    />
                  )}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Background</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Religion" error={form.formState.errors.religion?.message}>
              <Controller
                control={form.control}
                name="religion"
                render={({ field }) => (
                  <SelectWithOther
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={RELIGION_OPTIONS}
                    placeholder="Select religion"
                  />
                )}
              />
            </Field>
            <Field label="Caste" error={form.formState.errors.caste?.message}>
              <Controller
                control={form.control}
                name="caste"
                render={({ field }) => (
                  <SelectWithOther
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={CASTE_OPTIONS}
                    placeholder="Select caste"
                  />
                )}
              />
            </Field>
            <Field label="Marital status" error={form.formState.errors.maritalStatus?.message}>
              <Select
                {...form.register("maritalStatus", {
                  onChange: (e) => {
                    const next = e.target.value;
                    if (!isPastMarriageStatus(next)) {
                      form.setValue("hasChildren", "");
                      form.setValue("children", []);
                    }
                  },
                })}
              >
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
            {showChildrenQuestions && (
              <>
                <Field
                  label="Has children?"
                  error={form.formState.errors.hasChildren?.message}
                >
                  <Select
                    {...form.register("hasChildren", {
                      onChange: (e) => {
                        if (e.target.value === "yes" && childArray.fields.length === 0) {
                          childArray.append({
                            age: "",
                            gender: "",
                            stayingWithYou: "yes",
                          });
                        }
                        if (e.target.value !== "yes") {
                          form.setValue("children", []);
                        }
                      },
                    })}
                  >
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </Select>
                </Field>
                {hasChildren === "yes" && (
                  <div className="sm:col-span-2 space-y-3">
                    {childArray.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="rounded-xl border border-(--color-border) bg-(--color-surface-muted) p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Child {index + 1}</p>
                          {childArray.fields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => childArray.remove(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Field
                            label="Age"
                            error={form.formState.errors.children?.[index]?.age?.message}
                          >
                            <Input
                              type="number"
                              min={0}
                              max={50}
                              {...form.register(`children.${index}.age`)}
                            />
                          </Field>
                          <Field
                            label="Gender"
                            error={form.formState.errors.children?.[index]?.gender?.message}
                          >
                            <Select {...form.register(`children.${index}.gender`)}>
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </Select>
                          </Field>
                          <Field label="Staying with you?">
                            <Select {...form.register(`children.${index}.stayingWithYou`)}>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </Select>
                          </Field>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        childArray.append({
                          age: "",
                          gender: "",
                          stayingWithYou: "yes",
                        })
                      }
                    >
                      + Add more
                    </Button>
                  </div>
                )}
              </>
            )}
            <Field label="City" error={form.formState.errors.city?.message}>
              <Input placeholder="Letters only" {...registerCity("city")} />
            </Field>
            <Field label="State" error={form.formState.errors.state?.message}>
              <Controller
                control={form.control}
                name="state"
                render={({ field }) => (
                  <SelectWithOther
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={INDIA_STATE_OPTIONS}
                    placeholder="Select state"
                  />
                )}
              />
            </Field>
            <Field
              label="Last education university name"
              error={form.formState.errors.educationUniversity?.message}
            >
              <Controller
                control={form.control}
                name="educationUniversity"
                render={({ field }) => (
                  <AutocompleteInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    fetchOptions={fetchUniversities}
                    placeholder="Start typing to search universities"
                  />
                )}
              />
            </Field>
            <Field label="Occupation" error={form.formState.errors.occupation?.message}>
              <Controller
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <SelectWithOther
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={OCCUPATION_OPTIONS}
                    placeholder="Select occupation"
                  />
                )}
              />
            </Field>
            <Field label="Income" error={form.formState.errors.income?.message}>
              <Controller
                control={form.control}
                name="income"
                render={({ field }) => (
                  <SelectWithOther
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={INCOME_OPTIONS}
                    placeholder="Select income"
                  />
                )}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Education (select one or more)"
                error={form.formState.errors.education?.message}
              >
                <Controller
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <CheckboxGroup
                      options={EDUCATION_OPTIONS}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
            </div>
            <Field label="Home town" error={form.formState.errors.homeTown?.message}>
              <Input placeholder="Letters only" {...registerCity("homeTown")} />
            </Field>
            <Field label="Education city" error={form.formState.errors.educationCity?.message}>
              <Input placeholder="Letters only" {...registerCity("educationCity")} />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Caste requirement (select one or more)"
                error={form.formState.errors.castePreference?.message}
              >
                <Controller
                  control={form.control}
                  name="castePreference"
                  render={({ field }) => (
                    <CheckboxGroup
                      options={CASTE_PREFERENCE_OPTIONS}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Marriage preference (partner's marital status)"
                error={form.formState.errors.marriagePreference?.message}
              >
                <Controller
                  control={form.control}
                  name="marriagePreference"
                  render={({ field }) => (
                    <CheckboxGroup
                      options={MARRIAGE_PREFERENCE_OPTIONS}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Address</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="PIN code (auto-fills state, city & area)">
              <Input
                value={pincode}
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 110001"
                onChange={(e) => onPincodeChange(e.target.value)}
              />
              {pincodeStatus && (
                <p className="mt-1 text-xs text-(--color-muted-foreground)">
                  {pincodeStatus}
                </p>
              )}
            </Field>
            <Field label="Address city" error={form.formState.errors.addressCity?.message}>
              <Input {...form.register("addressCity")} />
            </Field>
            <Field label="Address area" error={form.formState.errors.addressArea?.message}>
              <Controller
                control={form.control}
                name="addressArea"
                render={({ field }) => (
                  <AutocompleteInput
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={areaOptions}
                    maxLength={25}
                    placeholder="Short area name only"
                  />
                )}
              />
              <p className="mt-1 text-xs text-(--color-muted-foreground)">
                Please do not fill complete address — only fill a short area name
                (max 25 characters).
              </p>
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Current address (private)"
                error={form.formState.errors.currentAddress?.message}
              >
                <Textarea rows={2} {...form.register("currentAddress")} />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Family</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Father name" error={form.formState.errors.fatherName?.message}>
              <div className="flex gap-2">
                <Select className="w-24 shrink-0" {...form.register("fatherTitle")}>
                  {FATHER_TITLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <Input className="min-w-0 flex-1" {...form.register("fatherName")} />
              </div>
              {form.formState.errors.fatherTitle?.message && (
                <p className="text-xs text-(--color-danger)">
                  {form.formState.errors.fatherTitle.message}
                </p>
              )}
            </Field>
            <Field
              label="Father occupation"
              error={form.formState.errors.fatherOccupation?.message}
            >
              <Controller
                control={form.control}
                name="fatherOccupation"
                render={({ field }) => (
                  <SelectWithOther
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={OCCUPATION_OPTIONS}
                    placeholder="Select occupation"
                  />
                )}
              />
            </Field>
            <Field label="Mother name" error={form.formState.errors.motherName?.message}>
              <div className="flex gap-2">
                <Select className="w-24 shrink-0" {...form.register("motherTitle")}>
                  {MOTHER_TITLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <Input className="min-w-0 flex-1" {...form.register("motherName")} />
              </div>
              {form.formState.errors.motherTitle?.message && (
                <p className="text-xs text-(--color-danger)">
                  {form.formState.errors.motherTitle.message}
                </p>
              )}
            </Field>
            <Field
              label="Mother occupation"
              error={form.formState.errors.motherOccupation?.message}
            >
              <Controller
                control={form.control}
                name="motherOccupation"
                render={({ field }) => (
                  <SelectWithOther
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={OCCUPATION_OPTIONS}
                    placeholder="Select occupation"
                  />
                )}
              />
            </Field>
            <div className="sm:col-span-2 space-y-3">
              <Field label="Number of siblings">
                <Select
                  value={String(siblingArray.fields.length)}
                  onChange={(e) => setSiblingCount(Number(e.target.value))}
                >
                  {Array.from({ length: 11 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </Select>
              </Field>
              {siblingArray.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-[var(--radius)] border border-(--color-input) p-3"
                >
                  <p className="sm:col-span-2 text-xs font-medium text-(--color-muted-foreground)">
                    Sibling {index + 1}
                  </p>
                  <Field label="Name">
                    <Input {...form.register(`siblings.${index}.name`)} />
                  </Field>
                  <Field label="Brother / Sister">
                    <Select {...form.register(`siblings.${index}.relation`)}>
                      <option value="">Select</option>
                      {SIBLING_RELATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Older / Younger">
                    <Select {...form.register(`siblings.${index}.ageRelation`)}>
                      <option value="">Select</option>
                      {SIBLING_AGE_RELATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Marital status">
                    <Select
                      {...form.register(`siblings.${index}.maritalStatus`)}
                    >
                      <option value="">Select</option>
                      {SIBLING_MARITAL_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Education">
                    <Controller
                      control={form.control}
                      name={`siblings.${index}.education`}
                      render={({ field }) => (
                        <SelectWithOther
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          options={EDUCATION_OPTIONS}
                          placeholder="Select education"
                        />
                      )}
                    />
                  </Field>
                  <Field label="Profession">
                    <Controller
                      control={form.control}
                      name={`siblings.${index}.profession`}
                      render={({ field }) => (
                        <SelectWithOther
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          options={OCCUPATION_OPTIONS}
                          placeholder="Select profession"
                        />
                      )}
                    />
                  </Field>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contact numbers (private)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={fatherIsLate ? "Father phone (optional)" : "Father phone"}
              error={form.formState.errors.fatherPhone?.message}
            >
              <Input placeholder="9876543210" {...registerNumeric("fatherPhone")} />
            </Field>
            <Field
              label={motherIsLate ? "Mother phone (optional)" : "Mother phone"}
              error={form.formState.errors.motherPhone?.message}
            >
              <Input placeholder="9876543210" {...registerNumeric("motherPhone")} />
            </Field>
            <Field label="Other phone (optional)" error={form.formState.errors.otherPhone?.message}>
              <Input {...form.register("otherPhone")} />
            </Field>
            <Field
              label="Coordinator number"
              error={form.formState.errors.coordinatorNumber?.message}
            >
              <Input placeholder="9876543210" {...registerNumeric("coordinatorNumber")} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">About &amp; interests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="About (20–1000 chars)" error={form.formState.errors.about?.message}>
              <Textarea rows={5} {...form.register("about")} />
            </Field>
            <Field
              label="Interests (comma separated, up to 10)"
              error={form.formState.errors.interests?.message}
            >
              <Input placeholder="reading, travel, music" {...form.register("interests")} />
            </Field>
            <Field label="Other details" error={form.formState.errors.otherDetails?.message}>
              <Textarea rows={3} {...form.register("otherDetails")} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/users")}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create profile
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-(--color-danger)">{error}</p>}
    </div>
  );
}
