"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { CheckboxGroup } from "@/components/forms/CheckboxGroup";
import { AutocompleteInput } from "@/components/forms/AutocompleteInput";
import { SelectWithOther } from "@/components/forms/SelectWithOther";
import { MultiSelectDropdown } from "@/components/forms/MultiSelectDropdown";
import { PhotoCropModal } from "@/components/forms/PhotoCropModal";
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
  ensureOption,
  formatParentName,
  isLateTitle,
  isPastMarriageStatus,
  parseParentName,
  sanitizeCityText,
  sanitizeFamilyTypeOther,
} from "@/lib/constants/profile-options";
import {
  useDeleteProfileImage,
  useProfile,
  useReorderImages,
  useSetPrimaryImage,
  useToggleImagePrivacy,
  useUpdateProfile,
  useUploadProfileImages,
} from "@/lib/hooks/admin";
import type { AdminProfile, ProfileImage } from "@/lib/types/profile";
import { buildImageUrl, toDisplayImageSrc } from "@/lib/utils";
import { adminApi } from "@/lib/api/admin";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Upload constraints mirror the backend storage driver (BACKEND.md §8):
// JPEG/PNG/WebP only, <= 15 MB each, max 5 images per profile.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGES = 5;

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const CITY_MSG = "Letters and spaces only (max 20)";
const cityField = z
  .string()
  .min(1, "Required")
  .max(20, CITY_MSG)
  .regex(CITY_TEXT_REGEX, CITY_MSG);

const schema = z
  .object({
    gender: z.enum(["Male", "Female"]),
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

export default function EditProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { data: p, isLoading, error } = useProfile(id ?? "");
  const update = useUpdateProfile();
  const uploadImages = useUploadProfileImages();
  const setPrimary = useSetPrimaryImage();
  const reorder = useReorderImages();
  const deleteImage = useDeleteProfileImage();
  const togglePrivacy = useToggleImagePrivacy();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toDelete, setToDelete] = useState<ProfileImage | null>(null);
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const [pincode, setPincode] = useState("");
  const [areaOptions, setAreaOptions] = useState<string[]>([]);
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [croppedBatch, setCroppedBatch] = useState<File[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<
    { id: string; file: File; previewUrl: string }[]
  >([]);

  const clearPendingPhotos = useCallback(() => {
    setPendingPhotos((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.previewUrl);
      return [];
    });
  }, []);

  useEffect(() => {
    return () => {
      pendingPhotos.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerNumeric = (
    name: "fatherPhone" | "motherPhone" | "coordinatorNumber",
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

  const fetchUniversities = useCallback(
    (q: string) => adminApi.searchUniversities(q).then((r) => r.universities),
    [],
  );

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

  useEffect(() => {
    if (p) {
      const splitList = (value?: string | null) =>
        value
          ? value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const father = parseParentName(p.fatherName);
      const mother = parseParentName(p.motherName);
      form.reset({
        gender: p.gender === "Female" ? "Female" : "Male",
        height: p.height,
        maritalStatus: p.maritalStatus,
        motherTongue: splitList(p.motherTongue),
        familyType: p.familyType,
        religion: p.religion,
        caste: p.caste,
        city: p.city ?? "",
        state: p.state,
        education: splitList(p.education),
        educationUniversity: p.educationUniversity ?? "",
        occupation: p.occupation,
        income: p.income,
        about: p.about,
        interests: p.interests?.join(", ") ?? "",
        complexion: p.complexion ?? "",
        homeTown: p.homeTown ?? "",
        educationCity: p.educationCity ?? "",
        castePreference: splitList(p.castePreference),
        marriagePreference: splitList(p.marriagePreference),
        languagesKnown: p.languagesKnown ?? [],
        currentAddress: p.currentAddress ?? "",
        addressCity: p.addressCity ?? "",
        addressArea: p.addressArea ?? "",
        fatherTitle: father.title || "Mr.",
        fatherName: father.name,
        fatherOccupation: p.fatherOccupation ?? "",
        motherTitle: mother.title || "Mrs.",
        motherName: mother.name,
        motherOccupation: p.motherOccupation ?? "",
        totalSiblings: p.totalSiblings ?? "",
        siblings: (p.siblings ?? []).map((s) => ({
          name: s.name ?? "",
          relation: s.relation ?? "",
          ageRelation: s.ageRelation ?? "",
          maritalStatus: s.maritalStatus ?? "",
          education: s.education ?? "",
          profession: s.profession ?? "",
        })),
        hasChildren:
          typeof p.hasChildren === "boolean"
            ? p.hasChildren
              ? "yes"
              : "no"
            : "",
        children: (p.children ?? []).map((c) => ({
          age: c.age ?? "",
          gender: c.gender ?? "",
          stayingWithYou: c.stayingWithYou ? "yes" : "no",
        })),
        fatherPhone: p.fatherPhone ?? "",
        motherPhone: p.motherPhone ?? "",
        otherPhone: p.otherPhone ?? "",
        coordinatorNumber: p.coordinatorNumber ?? "",
        otherDetails: p.otherDetails ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  if (isLoading) return <Skeleton className="h-96" />;
  if (error || !p) {
    return (
      <div className="space-y-4">
        <Back id={id ?? ""} />
        <p className="text-sm text-(--color-danger)">Profile not found.</p>
      </div>
    );
  }

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
    if ((p?.images?.length ?? 0) < 1) {
      toast.error("At least one photo is required. Please upload a photo before saving.");
      return;
    }
    const toList = (s?: string) =>
      s
        ? s
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [];
    const {
      fatherTitle,
      motherTitle,
      fatherName,
      motherName,
      ...rest
    } = values;
    const body: Partial<AdminProfile> = {
      ...rest,
      gender: values.gender,
      motherTongue: values.motherTongue.join(", "),
      education: values.education.join(", "),
      educationUniversity: values.educationUniversity?.trim() || undefined,
      complexion: values.complexion,
      homeTown: values.homeTown.trim(),
      educationCity: values.educationCity.trim(),
      castePreference: values.castePreference.join(", "),
      marriagePreference: values.marriagePreference.join(", "),
      fatherName: formatParentName(fatherTitle, fatherName),
      fatherOccupation: values.fatherOccupation,
      motherName: formatParentName(motherTitle, motherName),
      motherOccupation: values.motherOccupation,
      siblings: values.siblings?.length
        ? values.siblings.map((s) => ({
            name: s.name?.trim() ?? "",
            relation: s.relation?.trim() ?? "",
            ageRelation: s.ageRelation?.trim() ?? "",
            maritalStatus: s.maritalStatus?.trim() ?? "",
            education: s.education?.trim() ?? "",
            profession: s.profession?.trim() ?? "",
          }))
        : [],
      totalSiblings: values.siblings?.length
        ? String(values.siblings.length)
        : undefined,
      hasChildren: isPastMarriageStatus(values.maritalStatus)
        ? values.hasChildren === "yes"
        : null,
      children:
        isPastMarriageStatus(values.maritalStatus) && values.hasChildren === "yes"
          ? (values.children ?? []).map((c) => ({
              age: c.age?.trim() ?? "",
              gender: c.gender ?? "",
              stayingWithYou: c.stayingWithYou !== "no",
            }))
          : [],
      interests: toList(values.interests),
      languagesKnown: values.languagesKnown ?? [],
      fatherPhone: values.fatherPhone?.trim() || undefined,
      motherPhone: values.motherPhone?.trim() || undefined,
      otherPhone: values.otherPhone?.trim() || undefined,
    };
    await update.mutateAsync({ id: id!, body });
    router.push(`/users/${id}`);
  }

  const sortedImages = (p.images ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder);

  async function move(img: ProfileImage, direction: -1 | 1) {
    const index = sortedImages.findIndex((i) => i.id === img.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sortedImages.length) return;
    const next = sortedImages.slice();
    [next[index], next[target]] = [next[target], next[index]];
    const items = next.map((i, idx) => ({ id: i.id, sortOrder: idx }));
    await reorder.mutateAsync({ items, profileId: id });
  }

  return (
    <div className="space-y-6">
      <Back id={id ?? ""} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit profile</h1>
        <p className="text-sm text-(--color-muted-foreground)">{p.id}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Photos *</CardTitle>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  if (picked.length === 0 || !id) return;

                  const valid = picked.filter(
                    (f) => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES,
                  );
                  if (valid.length < picked.length) {
                    toast.error(
                      "Some files were skipped — only JPEG/PNG/WEBP up to 15 MB are allowed.",
                    );
                  }
                  if (valid.length === 0) return;

                  const remaining =
                    MAX_IMAGES - (p.images?.length ?? 0) - pendingPhotos.length;
                  if (remaining <= 0) {
                    toast.error(`This profile already has the maximum of ${MAX_IMAGES} photos.`);
                    return;
                  }
                  const files = valid.slice(0, remaining);
                  if (files.length < valid.length) {
                    toast.warning(
                      `Only ${remaining} more photo(s) can be added (max ${MAX_IMAGES}).`,
                    );
                  }
                  const pending = files.map((file) => ({
                    id: `${file.name}-${file.lastModified}-${file.size}-${Math.random()}`,
                    file,
                    previewUrl: URL.createObjectURL(file),
                  }));
                  setPendingPhotos((prev) => [...prev, ...pending]);
                  setCroppedBatch([]);
                  setCropQueue((prev) => [...prev, ...files]);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadImages.isPending || cropQueue.length > 0}
              >
                {uploadImages.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-(--color-muted-foreground) mb-3">
              JPEG / PNG / WEBP, max 15 MB each, up to 5 total. A live preview
              appears as soon as you pick a file. Each photo is cropped to a
              3:4 portrait frame before upload. You can delete any saved photo
              (including primary) and re-upload.
            </p>
            {sortedImages.length === 0 && pendingPhotos.length === 0 ? (
              <p className="text-sm text-amber-700">
                No photos on this profile. Upload at least one photo when ready.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortedImages.map((img, idx) => {
                  const src = buildImageUrl(API_BASE, img.url);
                  return (
                    <div key={img.id} className="relative group">
                      <ProfileImageThumb src={src} />
                      {img.isPrimary && (
                        <Badge variant="default" className="absolute top-1 left-1 text-[10px] z-10">
                          Primary
                        </Badge>
                      )}
                      {img.isPrivate && (
                        <Badge variant="secondary" className="absolute top-7 left-1 text-[10px] z-10">
                          Private
                        </Badge>
                      )}
                      <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 bg-white/90"
                          onClick={() => move(img, -1)}
                          disabled={idx === 0 || reorder.isPending}
                          aria-label="Move left"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 bg-white/90"
                          onClick={() => move(img, 1)}
                          disabled={idx === sortedImages.length - 1 || reorder.isPending}
                          aria-label="Move right"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="absolute top-1 right-1 z-20 flex gap-1">
                        {!img.isPrimary && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-white/90"
                            onClick={() => setPrimary.mutate({ imageId: img.id, profileId: id })}
                            disabled={setPrimary.isPending}
                            aria-label="Set as primary"
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setToDelete(img)}
                          disabled={deleteImage.isPending}
                          title="Delete image"
                          aria-label="Delete image"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="absolute inset-x-1 top-1 z-10 flex justify-center pointer-events-none">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="pointer-events-auto h-7 text-[11px] px-2 bg-white/90 mt-8"
                          onClick={() => togglePrivacy.mutate({ imageId: img.id, profileId: id })}
                          disabled={togglePrivacy.isPending}
                        >
                          {img.isPrivate ? "Make Public" : "Make Private"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {pendingPhotos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <ProfileImageThumb src={photo.previewUrl} />
                    <Badge variant="secondary" className="absolute top-1 left-1 text-[10px] z-10">
                      Preview
                    </Badge>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 z-20 h-7 w-7"
                      onClick={() => {
                        URL.revokeObjectURL(photo.previewUrl);
                        setPendingPhotos((prev) => prev.filter((item) => item.id !== photo.id));
                        setCropQueue((q) => q.filter((f) => f !== photo.file));
                        setCroppedBatch((b) => b.filter((f) => f !== photo.file));
                      }}
                      aria-label="Remove selected photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Personal</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Gender" error={form.formState.errors.gender?.message}>
              <Select {...form.register("gender")}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
            </Field>
            <Field label="Height" error={form.formState.errors.height?.message}>
              <Select {...form.register("height")}>
                {ensureOption(HEIGHT_OPTIONS, p.height).map((opt) => (
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
                    options={ensureOption(CASTE_OPTIONS, p.caste)}
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
            <Field label="Home town" error={form.formState.errors.homeTown?.message}>
              <Input placeholder="Letters only" {...registerCity("homeTown")} />
            </Field>
            <Field label="Education city" error={form.formState.errors.educationCity?.message}>
              <Input placeholder="Letters only" {...registerCity("educationCity")} />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Caste preference (select one or more)"
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
            <CardTitle className="text-sm">About & interests</CardTitle>
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
          <Button type="button" variant="outline" onClick={() => router.push(`/users/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete image?"
        description={
          toDelete?.isPrimary
            ? "This is the primary photo. Another photo will become primary if one remains, or you can upload a replacement after deleting."
            : "This removes only this image from the profile. Other photos are kept. If the file is already missing on the server, the record is still deleted so you can re-upload."
        }
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!toDelete || !id) {
            setToDelete(null);
            return;
          }
          await deleteImage.mutateAsync({ imageId: toDelete.id, profileId: id });
          setToDelete(null);
        }}
      />

      {cropQueue[0] && id && (
        <PhotoCropModal
          key={`${cropQueue[0].name}-${cropQueue[0].lastModified}-${cropQueue.length}`}
          file={cropQueue[0]}
          queueIndex={croppedBatch.length + 1}
          queueTotal={croppedBatch.length + cropQueue.length}
          onCancel={() => {
            clearPendingPhotos();
            setCropQueue([]);
            setCroppedBatch([]);
          }}
          onConfirm={(cropped) => {
            const current = cropQueue[0];
            setPendingPhotos((prev) =>
              prev.map((p) => {
                if (p.file !== current) return p;
                URL.revokeObjectURL(p.previewUrl);
                return { ...p, file: cropped, previewUrl: URL.createObjectURL(cropped) };
              }),
            );
            const remaining = cropQueue.slice(1);
            const nextBatch = [...croppedBatch, cropped];
            setCroppedBatch(nextBatch);
            setCropQueue(remaining);
            if (remaining.length === 0) {
              setCroppedBatch([]);
              void uploadImages
                .mutateAsync({ files: nextBatch, profileId: id })
                .then(() => clearPendingPhotos())
                .catch(() => {});
            }
          }}
        />
      )}
    </div>
  );
}

function ProfileImageThumb({ src }: { src: string | null }) {
  const display = toDisplayImageSrc(src);
  const [broken, setBroken] = useState(!display);
  useEffect(() => {
    setBroken(!display);
  }, [display]);

  if (!display || broken) {
    return (
      <div className="aspect-[3/4] w-full rounded bg-(--color-surface-muted) flex items-center justify-center px-2 text-center text-[11px] text-(--color-muted-foreground)">
        File missing
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={display}
      alt=""
      className="aspect-[3/4] w-full rounded object-cover bg-(--color-surface-muted)"
      onError={() => setBroken(true)}
    />
  );
}

function Back({ id }: { id: string }) {
  return (
    <Link
      href={`/users/${id}`}
      className="text-sm text-(--color-muted-foreground) inline-flex items-center gap-1 hover:text-(--color-foreground)"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
    </Link>
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
