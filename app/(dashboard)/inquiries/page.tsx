"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/forms/ConfirmDialog";
import { PaginationBar } from "@/components/data-table/Pagination";
import { useDeleteInquiry, useInquiries, useMarkInquiryRead } from "@/lib/hooks/admin";
import { relativeTime } from "@/lib/utils";
import type { ContactInquiry } from "@/lib/types/contact";

export default function InquiriesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error } = useInquiries({ page, limit, sortBy: "createdAt", order });
  const markRead = useMarkInquiryRead();
  const del = useDeleteInquiry();
  const [toDelete, setToDelete] = useState<ContactInquiry | null>(null);

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contact inquiries</h1>
        <p className="text-sm text-(--color-muted-foreground)">
          Messages received from the public contact form.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={order}
          onChange={(e) => {
            setOrder(e.target.value as "asc" | "desc");
            setPage(1);
          }}
          className="w-44"
        >
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </Select>
        <Select
          value={String(limit)}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="w-28"
        >
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
        </Select>
      </div>

      <div className="rounded-[var(--radius)] border border-(--color-border) bg-(--color-card) overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Subject</TH>
              <TH>Status</TH>
              <TH>Received</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TR key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TD key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TD>
                  ))}
                </TR>
              ))}
            {!isLoading && rows.length === 0 && (
              <TR>
                <TD colSpan={6} className="text-center text-(--color-muted-foreground) py-8">
                  No inquiries yet.
                </TD>
              </TR>
            )}
            {!isLoading &&
              rows.map((q) => (
                <TR key={q.id}>
                  <TD>
                    <Link
                      href={`/inquiries/${q.id}`}
                      className={q.isRead ? "hover:underline" : "font-semibold hover:underline"}
                    >
                      {q.name}
                    </Link>
                  </TD>
                  <TD className="text-(--color-muted-foreground)">{q.email}</TD>
                  <TD className="max-w-xs truncate">{q.subject}</TD>
                  <TD>
                    {q.isRead ? (
                      <Badge variant="secondary">Read</Badge>
                    ) : (
                      <Badge variant="warning">Unread</Badge>
                    )}
                  </TD>
                  <TD className="text-(--color-muted-foreground)">{relativeTime(q.createdAt)}</TD>
                  <TD className="text-right">
                    <div className="inline-flex items-center gap-1">
                      {!q.isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markRead.mutate(q.id)}
                          disabled={markRead.isPending}
                        >
                          Mark read
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => setToDelete(q)}>
                        Delete
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
          </TBody>
        </Table>
      </div>

      {error && <p className="text-sm text-(--color-danger)">{(error as Error).message}</p>}

      <PaginationBar
        page={data?.meta?.page ?? page}
        limit={data?.meta?.limit ?? limit}
        total={data?.meta?.total ?? 0}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete inquiry?"
        description="This message will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (toDelete) await del.mutateAsync(toDelete.id);
        }}
      />
    </div>
  );
}
