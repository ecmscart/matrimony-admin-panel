"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, Mail, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/inquiries", label: "Inquiries", icon: Mail },
  { href: "/logs", label: "Logs", icon: ClipboardList },
];

export function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="md:hidden fixed inset-0 z-30 bg-black/40"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-(--color-border) bg-(--color-surface) transition-transform duration-200 ease-out",
          "md:static md:translate-x-0 md:shrink-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="h-14 flex items-center gap-2 px-5 border-b border-(--color-border)">
          <Image
            src="/logo.png"
            alt="Maher Admin"
            width={961}
            height={734}
            className="h-8 w-auto"
            priority
          />
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">Maher Admin</div>
            <div className="text-[10px] uppercase tracking-wider text-(--color-muted-foreground)">
              Admin panel
            </div>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-md hover:bg-(--color-surface-muted) text-(--color-muted-foreground)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + "/");
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-(--color-primary) text-(--color-primary-foreground)"
                    : "text-(--color-foreground) hover:bg-(--color-surface-muted)",
                )}
              >
                <Icon className="h-4 w-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
