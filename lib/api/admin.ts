import { api } from "./client";
import type { Paginated, PaginationParams } from "@/lib/types/common";
import type { AdminUser } from "@/lib/types/user";
import type {
  AdminProfile,
  BulkImportResult,
  CreateProfileInput,
  CreateProfileResult,
  ProfileCompletion,
  ProfileFilters,
  ProfileImage,
} from "@/lib/types/profile";
import type { DashboardKpis } from "@/lib/types/dashboard";
import type { ContactInquiry } from "@/lib/types/contact";
import type { AdminLog } from "@/lib/types/log";

function cleanParams(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}

export const adminApi = {
  dashboard: () => api.get<DashboardKpis>("/admin/dashboard").then((r) => r.data),

  users: (params: PaginationParams) =>
    api
      .get<
        Paginated<AdminUser>
      >("/admin/users", { params: cleanParams(params as Record<string, unknown>) })
      .then((r) => r.data),
  user: (id: string) => api.get<AdminUser>(`/admin/users/${id}`).then((r) => r.data),
  toggleBlock: (id: string) => api.patch<AdminUser>(`/admin/users/${id}/block`).then((r) => r.data),
  deleteUser: (id: string) => api.delete<void>(`/admin/users/${id}`).then((r) => r.data),
  impersonateUser: (id: string) =>
    api
      .post<{
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          role: string;
          isVerified?: boolean;
        };
      }>(`/admin/users/${id}/impersonate`)
      .then((r) => r.data),
  setUserPassword: (id: string, newPassword: string) =>
    api
      .patch<{ message: string }>(`/admin/users/${id}/password`, { newPassword })
      .then((r) => r.data),

  // Bulk import (BACKEND.md §10) — CSV template + multipart upload.
  bulkTemplate: () =>
    api.get<Blob>("/admin/users/bulk/template", { responseType: "blob" }).then((r) => r.data),
  bulkCreate: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<BulkImportResult>("/admin/users/bulk", fd).then((r) => r.data);
  },

  profiles: (params: PaginationParams & ProfileFilters) =>
    api
      .get<
        Paginated<AdminProfile>
      >("/admin/profiles", { params: cleanParams(params as Record<string, unknown>) })
      .then((r) => r.data),
  profile: (id: string) => api.get<AdminProfile>(`/admin/profiles/${id}`).then((r) => r.data),
  profileCompletion: (id: string) =>
    api.get<ProfileCompletion>(`/admin/profiles/${id}/completion`).then((r) => r.data),
  toggleVerify: (id: string) =>
    api.patch<AdminProfile>(`/admin/profiles/${id}/verify`).then((r) => r.data),
  togglePublish: (id: string) =>
    api.patch<AdminProfile>(`/admin/profiles/${id}/publish`).then((r) => r.data),
  toggleVip: (id: string) =>
    api.patch<{ message: string; isVip: boolean }>(`/admin/profiles/${id}/vip`).then((r) => r.data),
  togglePremium: (id: string) =>
    api
      .patch<{ message: string; isPremium: boolean }>(`/admin/profiles/${id}/premium`)
      .then((r) => r.data),
  updateProfile: (id: string, body: Partial<AdminProfile>) =>
    api.patch<AdminProfile>(`/admin/profiles/${id}`, body).then((r) => r.data),
  deleteProfile: (id: string) =>
    api.delete<{ message: string }>(`/admin/profiles/${id}`).then((r) => r.data),

  // India lookups — proxied to the backend /api/lookup/* endpoints.
  lookupPincode: (pincode: string) =>
    api
      .get<{
        pincode: string;
        state: string | null;
        district: string | null;
        areas: string[];
      }>(`/lookup/pincode/${pincode}`)
      .then((r) => r.data),
  searchUniversities: (q: string) =>
    api
      .get<{ universities: string[] }>("/lookup/universities", {
        params: { q },
      })
      .then((r) => r.data),
  // The backend has no admin create-profile endpoint; this hits a local route
  // that signs up the account and fills in the matrimony details server-side.
  createProfile: async (body: CreateProfileInput): Promise<CreateProfileResult> => {
    const res = await fetch("/api/admin/create-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        (Array.isArray(data?.details) && data.details[0]?.message) ||
        data?.message ||
        "Failed to create profile";
      throw new Error(message);
    }
    return data as CreateProfileResult;
  },
  toggleImagePrivacy: (imageId: string) =>
    api.patch<ProfileImage>(`/admin/profiles/images/${imageId}/private`).then((r) => r.data),

  // Profile images — backend scopes these to the logged-in user's profile (see API §6).
  uploadProfileImages: (files: File[], userId: string) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    return api
      .post<{ uploaded: ProfileImage[] }>(`/profiles/images/${userId}`, fd)
      .then((r) => r.data);
  },
  setPrimaryImage: (userId: string, imageId: string) =>
    api.patch<{ message: string }>(`/profiles/images/${userId}/primary/${imageId}`).then((r) => r.data),
  reorderImages: (userId: string, items: { id: string; sortOrder: number }[]) =>
    api
      .patch<{ message: string }>(`/profiles/images/${userId}/reorder`, { images: items })
      .then((r) => r.data),
  deleteProfileImage: (userId: string, imageId: string) =>
    api.delete<{ message: string }>(`/profiles/images/${userId}/${imageId}`).then((r) => r.data),

  inquiries: (params: PaginationParams) =>
    api
      .get<
        Paginated<ContactInquiry>
      >("/contact", { params: cleanParams(params as Record<string, unknown>) })
      .then((r) => r.data),
  inquiry: (id: string) => api.get<ContactInquiry>(`/contact/${id}`).then((r) => r.data),
  markInquiryRead: (id: string) =>
    api.patch<ContactInquiry>(`/contact/${id}/read`).then((r) => r.data),
  deleteInquiry: (id: string) => api.delete<void>(`/contact/${id}`).then((r) => r.data),

  logs: (params: PaginationParams) =>
    api
      .get<
        Paginated<AdminLog>
      >("/admin/logs", { params: cleanParams(params as Record<string, unknown>) })
      .then((r) => r.data),
};
