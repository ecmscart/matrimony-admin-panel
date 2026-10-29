"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PaginationBar } from "@/components/data-table/Pagination";
import { useLogs } from "@/lib/hooks/admin";
import { formatDate } from "@/lib/utils";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error } = useLogs({ page, limit, sortBy: "createdAt", order });
  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin logs</h1>
        <p className="text-sm text-(--color-muted-foreground)">
          Audit trail of admin panel actions.
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
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </Select>
      </div>

      <div className="rounded-[var(--radius)] border border-(--color-border) bg-(--color-card) overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>When</TH>
              <TH>Admin</TH>
              <TH>Action</TH>
              <TH>Entity</TH>
              <TH>Entity ID</TH>
              <TH>Details</TH>
            </TR>
          </THead>
          <TBody>
            {isLoading &&
              Array.from({ length: 10 }).map((_, i) => (
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
                  No log entries.
                </TD>
              </TR>
            )}
            {!isLoading &&
              rows.map((log) => (
                <TR key={log.id}>
                  <TD className="text-(--color-muted-foreground) whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </TD>
                  <TD>
                    {log.admin ? (
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {log.admin.firstName} {log.admin.lastName}
                        </span>
                        <span className="text-xs text-(--color-muted-foreground)">
                          {log.admin.email}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-(--color-muted-foreground)">
                        {log.adminId}
                      </span>
                    )}
                  </TD>
                  <TD>
                    <Badge variant="secondary">{log.action}</Badge>
                  </TD>
                  <TD>
                    {log.entityType ? (
                      <Badge variant="outline">{log.entityType}</Badge>
                    ) : (
                      <span className="text-(--color-muted-foreground)">—</span>
                    )}
                  </TD>
                  <TD className="font-mono text-xs text-(--color-muted-foreground)">
                    {log.entityId ?? "—"}
                  </TD>
                  <TD className="max-w-md">
                    {log.details ? (
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-(--color-muted-foreground)">
                        {JSON.stringify(log.details, null, 0)}
                      </pre>
                    ) : (
                      <span className="text-(--color-muted-foreground)">—</span>
                    )}
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
    </div>
  );
}
