"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { useDeleteInquiry, useInquiry, useMarkInquiryRead } from "@/lib/hooks/admin";
import { formatDate } from "@/lib/utils";

export default function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: q, isLoading, error } = useInquiry(id);
  const markRead = useMarkInquiryRead();
  const del = useDeleteInquiry();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const autoMarked = useRef(false);

  useEffect(() => {
    if (q && !q.isRead && !autoMarked.current) {
      autoMarked.current = true;
      markRead.mutate(q.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id, q?.isRead]);

  if (isLoading) return <Skeleton className="h-64" />;
  if (error || !q) {
    return (
      <div className="space-y-4">
        <Back />
        <p className="text-sm text-(--color-danger)">Inquiry not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Back />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight break-words">{q.subject}</h1>
          <div className="text-sm text-(--color-muted-foreground) mt-1 break-words">
            From <strong>{q.name}</strong> ·{" "}
            <a className="hover:underline" href={`mailto:${q.email}`}>
              {q.email}
            </a>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant={q.isRead ? "secondary" : "warning"}>
              {q.isRead ? "Read" : "Unread"}
            </Badge>
            <Badge variant="outline">{formatDate(q.createdAt)}</Badge>
            {q.respondedAt && (
              <Badge variant="success">Responded {formatDate(q.respondedAt)}</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={`mailto:${q.email}?subject=Re: ${encodeURIComponent(q.subject)}`}>Reply</a>
          </Button>
          <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Message</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 whitespace-pre-wrap">{q.message}</CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete inquiry?"
        description="This message will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await del.mutateAsync(q.id);
          router.push("/inquiries");
        }}
      />
    </div>
  );
}

function Back() {
  return (
    <Link
      href="/inquiries"
      className="text-sm text-(--color-muted-foreground) inline-flex items-center gap-1 hover:text-(--color-foreground)"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to inquiries
    </Link>
  );
}
