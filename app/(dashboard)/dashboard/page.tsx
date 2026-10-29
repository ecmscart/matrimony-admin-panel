"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useDashboard } from "@/lib/hooks/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  Mail,
  MailOpen,
  MapPin,
  Sparkles,
  UserCheck,
  UserCircle2,
  Users as UsersIcon,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading, error } = useDashboard();

  useEffect(() => {
    if (!error) return;
    const status = error instanceof AxiosError ? error.response?.status : undefined;
    if (status === 401) router.replace("/login");
  }, [error, router]);

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-(--color-danger)">
          Failed to load dashboard. {(error as Error)?.message}
        </CardContent>
      </Card>
    );
  }

  const totalGender = (data.genderBreakdown?.Male ?? 0) + (data.genderBreakdown?.Female ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-(--color-muted-foreground)">Platform KPIs at a glance.</p>
      </div>

      <Section title="Users" href="/users">
        <Kpi title="Total users" value={data.totalUsers} icon={UsersIcon} />
        <Kpi title="New today" value={data.newUsersToday} icon={Sparkles} />
        <Kpi title="New this week" value={data.newUsersThisWeek} icon={Clock} />
        <Kpi title="Total profiles" value={data.totalProfiles} icon={UserCircle2} />
      </Section>

      <Section title="Profiles" href="/users">
        <Kpi title="Verified" value={data.verifiedProfiles} icon={CheckCircle2} />
        <Kpi title="Pending verification" value={data.pendingVerification} icon={UserCheck} />
        <Kpi title="Male" value={data.genderBreakdown?.Male} icon={UsersIcon} />
        <Kpi title="Female" value={data.genderBreakdown?.Female} icon={UsersIcon} />
      </Section>

      <Section title="Inquiries" href="/inquiries">
        <Kpi title="Total" value={data.totalInquiries} icon={Mail} />
        <Kpi title="Unread" value={data.unreadInquiries} icon={MailOpen} />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Gender breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["Male", "Female"] as const).map((g) => {
              const count = data.genderBreakdown?.[g] ?? 0;
              const pct = totalGender ? Math.round((count / totalGender) * 100) : 0;
              return (
                <div key={g} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-(--color-muted-foreground)">{g}</span>
                    <span className="font-medium">
                      {count.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-(--color-surface-muted)">
                    <div
                      className="h-2 rounded-full bg-(--color-primary)"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top cities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.topCities ?? []).length === 0 && (
              <p className="text-sm text-(--color-muted-foreground)">No data yet.</p>
            )}
            {(data.topCities ?? []).map((c) => (
              <div key={c.city} className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-(--color-muted-foreground)">
                  <MapPin className="h-3.5 w-3.5" /> {c.city}
                </span>
                <span className="font-medium">{c.count.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-(--color-muted-foreground) uppercase">
          {title}
        </h2>
        <Link href={href} className="text-xs text-(--color-primary) hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{children}</div>
    </div>
  );
}

function Kpi({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-(--color-muted-foreground)">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-(--color-muted-foreground)" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{(value ?? 0).toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((__, j) => (
              <Skeleton key={j} className="h-24" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
