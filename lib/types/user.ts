export type Gender = "Male" | "Female";
export type Role = "user" | "admin";

// Profile summary embedded in each GET /api/admin/users item (BACKEND.md §10).
export interface AdminUserProfileSummary {
  id: string;
  profileNumber: string | null;
  isPublished: boolean;
  isVerified: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth?: string;
  role?: Role;
  isVerified: boolean;
  isActive: boolean;
  hasProfile?: boolean;
  profile?: AdminUserProfileSummary | null;
  createdAt: string;
  updatedAt?: string;
}
