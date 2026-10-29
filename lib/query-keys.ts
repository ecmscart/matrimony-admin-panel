import type { ProfileFilters } from "@/lib/types/profile";
import type { PaginationParams } from "@/lib/types/common";

export const qk = {
  dashboard: () => ["dashboard"] as const,

  users: (params: PaginationParams) => ["users", params] as const,
  user: (id: string) => ["users", id] as const,

  profiles: (params: PaginationParams & ProfileFilters) => ["profiles", params] as const,
  profile: (id: string) => ["profiles", id] as const,
  profileCompletion: (id: string) => ["profiles", id, "completion"] as const,

  inquiries: (params: PaginationParams) => ["inquiries", params] as const,
  inquiry: (id: string) => ["inquiries", id] as const,

  logs: (params: PaginationParams) => ["logs", params] as const,
};
