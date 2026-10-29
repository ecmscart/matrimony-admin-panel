// Shape returned by GET /api/admin/logs (BACKEND.md §10).
export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  admin?: { id: string; email: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt?: string;
}
