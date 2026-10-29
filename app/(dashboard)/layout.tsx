import { requireAdmin } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <DashboardShell email={user.email} role={user.role}>
      {children}
    </DashboardShell>
  );
}
