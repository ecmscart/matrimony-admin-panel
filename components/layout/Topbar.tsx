"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function titleize(seg: string) {
  return seg.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function Topbar({
  email,
  role,
  onMenuClick,
}: {
  email: string;
  role: string;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = pathname.split("/").filter(Boolean);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-20 h-14 flex items-center justify-between gap-2 px-3 sm:px-6 border-b border-(--color-border) bg-(--color-surface)/80 backdrop-blur">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 rounded-md hover:bg-(--color-surface-muted) text-(--color-foreground)"
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
          {crumbs.length === 0 ? (
            <span className="text-(--color-muted-foreground)">Home</span>
          ) : (
            crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5 truncate">
                {i > 0 && <span className="text-(--color-muted-foreground)">/</span>}
                <span
                  className={
                    i === crumbs.length - 1
                      ? "font-medium truncate"
                      : "text-(--color-muted-foreground) truncate"
                  }
                >
                  {titleize(c)}
                </span>
              </span>
            ))
          )}
        </nav>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:block text-right leading-tight max-w-[200px]">
          <div className="text-sm font-medium truncate">{email}</div>
          <Badge variant="secondary" className="text-[10px] py-0">
            {role}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
