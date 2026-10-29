"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export function DashboardShell({
  email,
  role,
  children,
}: {
  email: string;
  role: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile sidebar on navigation by resetting during render
  // (avoids the cascading-render effect anti-pattern).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-(--color-surface-muted)">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar email={email} role={role} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
