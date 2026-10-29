"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { ChangePasswordDialog } from "@/components/forms/ChangePasswordDialog";
import {
  useDeleteUser,
  useImpersonateUser,
  useSetUserPassword,
  useToggleBlock,
  useUser,
} from "@/lib/hooks/admin";
import { formatDate } from "@/lib/utils";

const CUSTOMER_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: user, isLoading, error } = useUser(id);
  const toggleBlock = useToggleBlock();
  const deleteUser = useDeleteUser();
  const impersonate = useImpersonateUser();
  const setPassword = useSetUserPassword();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }
  if (error || !user) {
    return (
      <div className="space-y-4">
        <Back />
        <p className="text-sm text-(--color-danger)">User not found.</p>
      </div>
    );
  }

  async function handleLoginAs() {
    // Open synchronously so the browser doesn't treat it as a blocked popup.
    const popup = window.open("about:blank", "_blank");
    try {
      const session = await impersonate.mutateAsync(user!.id);
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify(session))));
      const url = `${CUSTOMER_URL}/auth/login-as#${payload}`;
      if (popup) {
        popup.location.href = url;
      } else {
        window.location.href = url;
      }
      toast.success(`Opened website as ${user!.firstName} ${user!.lastName}`);
    } catch {
      popup?.close();
      // toast handled by mutation
    }
  }

  return (
    <div className="space-y-6">
      <Back />
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-start gap-4 space-y-0">
          <div className="h-16 w-16 shrink-0 rounded-full bg-(--color-surface-muted) grid place-items-center text-lg font-semibold">
            {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl break-words">
              {user.firstName} {user.lastName}
            </CardTitle>
            <div className="text-sm text-(--color-muted-foreground) break-words">
              {user.email} · {user.phone}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={user.isActive ? "success" : "danger"}>
                {user.isActive ? "Active" : "Blocked"}
              </Badge>
              <Badge variant={user.isVerified ? "success" : "outline"}>
                {user.isVerified ? "Verified" : "Unverified"}
              </Badge>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleLoginAs}
              disabled={!user.isActive || impersonate.isPending}
              title={
                user.isActive
                  ? "Open the customer website logged in as this user"
                  : "Unblock the user before logging in as them"
              }
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              {impersonate.isPending ? "Opening…" : "Login as user"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setChangePasswordOpen(true)}
            >
              <KeyRound className="h-4 w-4 mr-1.5" />
              Change password
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleBlock.mutate(user.id)}
              disabled={toggleBlock.isPending}
            >
              {user.isActive ? "Block" : "Unblock"}
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Row k="User ID" v={user.id} />
          <Row k="Gender" v={user.gender} />
          <Row k="Date of birth" v={user.dateOfBirth ? formatDate(user.dateOfBirth) : "—"} />
          <Row k="Created" v={formatDate(user.createdAt)} />
          <Row k="Updated" v={user.updatedAt ? formatDate(user.updatedAt) : "—"} />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete user?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await deleteUser.mutateAsync(user.id);
          router.push("/users");
        }}
      />

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        userName={`${user.firstName} ${user.lastName}`}
        onSubmit={async (newPassword) => {
          await setPassword.mutateAsync({ id: user.id, newPassword });
        }}
      />
    </div>
  );
}

function Back() {
  return (
    <Link
      href="/users"
      className="text-sm text-(--color-muted-foreground) inline-flex items-center gap-1 hover:text-(--color-foreground)"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to users
    </Link>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-(--color-border) pb-2 last:border-0">
      <span className="text-(--color-muted-foreground)">{k}</span>
      <span className="font-medium truncate">{v}</span>
    </div>
  );
}
