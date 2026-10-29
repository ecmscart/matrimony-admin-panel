// Shape returned by GET /api/admin/dashboard (BACKEND.md §10).
export interface DashboardKpis {
  totalUsers: number;
  totalProfiles: number;
  verifiedProfiles: number;
  pendingVerification: number;
  totalInquiries: number;
  unreadInquiries: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  genderBreakdown: { Male: number; Female: number };
  topCities: { city: string; count: number }[];
}
