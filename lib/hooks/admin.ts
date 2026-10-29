"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin";
import { qk } from "@/lib/query-keys";
import type {
  AdminProfile,
  BulkImportResult,
  CreateProfileInput,
  ProfileFilters,
} from "@/lib/types/profile";
import type { PaginationParams } from "@/lib/types/common";

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard(), queryFn: adminApi.dashboard });
}

export function useUsers(params: PaginationParams, enabled = true) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: () => adminApi.users(params),
    placeholderData: (prev) => prev,
    enabled,
  });
}

export function useUser(id: string) {
  return useQuery({ queryKey: qk.user(id), queryFn: () => adminApi.user(id), enabled: !!id });
}

export function useToggleBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.toggleBlock(id),
    onSuccess: (_d, id) => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: qk.user(id) });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Delete failed"),
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: (id: string) => adminApi.impersonateUser(id),
    onError: (e: Error) => toast.error(e.message ?? "Login as user failed"),
  });
}

export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      adminApi.setUserPassword(id, newPassword),
    onSuccess: () => {
      toast.success("Password updated");
    },
    onError: (e: Error) => toast.error(e.message ?? "Password update failed"),
  });
}

export function useProfiles(params: PaginationParams & ProfileFilters, enabled = true) {
  return useQuery({
    queryKey: qk.profiles(params),
    queryFn: () => adminApi.profiles(params),
    placeholderData: (prev) => prev,
    enabled,
  });
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: qk.profile(id),
    queryFn: () => adminApi.profile(id),
    enabled: !!id,
  });
}

export function useProfileCompletion(id: string) {
  return useQuery({
    queryKey: qk.profileCompletion(id),
    queryFn: () => adminApi.profileCompletion(id),
    enabled: !!id,
  });
}

export function useToggleVerify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.toggleVerify(id),
    onSuccess: (_d, id) => {
      toast.success("Verification toggled");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: qk.profile(id) });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useTogglePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.togglePublish(id),
    onSuccess: (_d, id) => {
      toast.success("Publication toggled");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: qk.profile(id) });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useToggleVip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.toggleVip(id),
    onSuccess: (d, id) => {
      toast.success(d.message || "VIP toggled");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: qk.profile(id) });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useTogglePremium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.togglePremium(id),
    onSuccess: (d, id) => {
      toast.success(d.message || "Premium toggled");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: qk.profile(id) });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteProfile(id),
    onSuccess: () => {
      toast.success("Profile deleted");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: qk.dashboard() });
    },
    onError: (e: Error) => toast.error(e.message ?? "Delete failed"),
  });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProfileInput) => adminApi.createProfile(body),
    onSuccess: () => {
      toast.success("Profile created");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: qk.dashboard() });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to create profile"),
  });
}

export function useBulkImportUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File): Promise<BulkImportResult> => adminApi.bulkCreate(file),
    onSuccess: (res) => {
      if (res.failed > 0) {
        toast.warning(`Imported ${res.created} of ${res.total} — ${res.failed} failed`);
      } else {
        toast.success(`Imported ${res.created} of ${res.total}`);
      }
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: qk.dashboard() });
    },
    onError: (e: Error) => toast.error(e.message ?? "Import failed"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<AdminProfile> }) =>
      adminApi.updateProfile(id, body),
    onSuccess: (_d, { id }) => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      qc.invalidateQueries({ queryKey: qk.profile(id) });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useUploadProfileImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ files, profileId }: { files: File[]; profileId: string }) =>
      adminApi.uploadProfileImages(files, profileId),
    onSuccess: (_d, { profileId }) => {
      toast.success("Images uploaded");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      if (profileId) qc.invalidateQueries({ queryKey: qk.profile(profileId) });
    },
    onError: (e: Error) => toast.error(e.message ?? "Upload failed"),
  });
}

export function useSetPrimaryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, profileId }: { imageId: string; profileId: string }) =>
      adminApi.setPrimaryImage(profileId, imageId),
    onSuccess: (_d, { profileId }) => {
      toast.success("Primary image updated");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      if (profileId) qc.invalidateQueries({ queryKey: qk.profile(profileId) });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useReorderImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ items, profileId }: { items: { id: string; sortOrder: number }[]; profileId: string }) =>
      adminApi.reorderImages(profileId, items),
    onSuccess: (_d, { profileId }) => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      if (profileId) qc.invalidateQueries({ queryKey: qk.profile(profileId) });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useDeleteProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, profileId }: { imageId: string; profileId: string }) =>
      adminApi.deleteProfileImage(profileId, imageId),
    onSuccess: (_d, { profileId }) => {
      toast.success("Image deleted");
      qc.invalidateQueries({ queryKey: ["profiles"] });
      if (profileId) qc.invalidateQueries({ queryKey: qk.profile(profileId) });
    },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string | string[] } }; message?: string };
      const raw = ax.response?.data?.message;
      const message = Array.isArray(raw)
        ? raw[0]
        : typeof raw === "string"
          ? raw
          : ax.message;
      toast.error(message || "Delete failed");
    },
  });
}

export function useToggleImagePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId }: { imageId: string; profileId?: string }) =>
      adminApi.toggleImagePrivacy(imageId),
    onMutate: async ({ imageId, profileId }) => {
      if (!profileId) return {};
      await qc.cancelQueries({ queryKey: qk.profile(profileId) });
      const previous = qc.getQueryData<AdminProfile>(qk.profile(profileId));
      if (previous?.images) {
        qc.setQueryData<AdminProfile>(qk.profile(profileId), {
          ...previous,
          images: previous.images.map((img) =>
            img.id === imageId ? { ...img, isPrivate: !img.isPrivate } : img,
          ),
        });
      }
      return { previous, profileId };
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.previous && ctx.profileId) {
        qc.setQueryData(qk.profile(ctx.profileId), ctx.previous);
      }
      toast.error(e.message ?? "Update failed");
    },
    onSuccess: () => {
      toast.success("Image privacy updated");
    },
    onSettled: (_d, _e, { profileId }) => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      if (profileId) qc.invalidateQueries({ queryKey: qk.profile(profileId) });
    },
  });
}

export function useInquiries(params: PaginationParams) {
  return useQuery({
    queryKey: qk.inquiries(params),
    queryFn: () => adminApi.inquiries(params),
    placeholderData: (prev) => prev,
  });
}

export function useInquiry(id: string) {
  return useQuery({
    queryKey: qk.inquiry(id),
    queryFn: () => adminApi.inquiry(id),
    enabled: !!id,
  });
}

export function useMarkInquiryRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.markInquiryRead(id),
    onSuccess: (_d, id) => {
      toast.success("Marked as read");
      qc.invalidateQueries({ queryKey: ["inquiries"] });
      qc.invalidateQueries({ queryKey: qk.inquiry(id) });
      qc.invalidateQueries({ queryKey: qk.dashboard() });
    },
    onError: (e: Error) => toast.error(e.message ?? "Update failed"),
  });
}

export function useDeleteInquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteInquiry(id),
    onSuccess: () => {
      toast.success("Inquiry deleted");
      qc.invalidateQueries({ queryKey: ["inquiries"] });
      qc.invalidateQueries({ queryKey: qk.dashboard() });
    },
    onError: (e: Error) => toast.error(e.message ?? "Delete failed"),
  });
}

export function useLogs(params: PaginationParams) {
  return useQuery({
    queryKey: qk.logs(params),
    queryFn: () => adminApi.logs(params),
    placeholderData: (prev) => prev,
  });
}
