"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { ArrowLeft, Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { adminApi } from "@/lib/api/admin";
import { useBulkImportUsers } from "@/lib/hooks/admin";
import type { BulkImportResult } from "@/lib/types/profile";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB (backend limit)
const MAX_ROWS = 500; // backend limit
const PREVIEW_ROWS = 5;

export default function BulkImportPage() {
  const importUsers = useBulkImportUsers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  function reset() {
    setFile(null);
    setPreviewRows([]);
    setHeaders([]);
    setRowCount(0);
    setParseError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const blob = await adminApi.bulkTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "maher-bulk-import-template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download template");
    } finally {
      setDownloading(false);
    }
  }

  function onFileSelected(selected: File | undefined) {
    setResult(null);
    setParseError(null);
    if (!selected) return;

    if (
      !selected.name.toLowerCase().endsWith(".csv") &&
      selected.type !== "text/csv" &&
      selected.type !== "application/vnd.ms-excel" &&
      selected.type !== "text/plain" &&
      selected.type !== "application/csv"
    ) {
      setParseError("Please select a .csv file (save Excel as CSV if needed).");
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setParseError("File is larger than 2 MB.");
      return;
    }

    setFile(selected);
    Papa.parse<Record<string, string>>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setHeaders(res.meta.fields ?? []);
        setRowCount(res.data.length);
        setPreviewRows(res.data.slice(0, PREVIEW_ROWS));
        if (res.data.length === 0) setParseError("The file has no data rows.");
        else if (res.data.length > MAX_ROWS)
          setParseError(`The file has ${res.data.length} rows — the limit is ${MAX_ROWS}.`);
      },
      error: () => setParseError("Could not parse the CSV file."),
    });
  }

  async function onImport() {
    if (!file) return;
    const res = await importUsers.mutateAsync(file);
    setResult(res);
  }

  const canImport = !!file && !parseError && rowCount > 0 && rowCount <= MAX_ROWS;

  return (
    <div className="space-y-6">
      <Link
        href="/users"
        className="text-sm text-(--color-muted-foreground) inline-flex items-center gap-1 hover:text-(--color-foreground)"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to profiles
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bulk import</h1>
          <p className="text-sm text-(--color-muted-foreground)">
            Create users &amp; profiles from a CSV file (up to {MAX_ROWS} rows).
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate} disabled={downloading}>
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">CSV file</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => onFileSelected(e.target.files?.[0])}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-(--color-border) bg-(--color-surface) px-6 py-10 text-center transition-colors hover:bg-(--color-surface-muted)"
            >
              <Upload className="h-6 w-6 text-(--color-muted-foreground)" />
              <span className="text-sm font-medium">Choose a CSV file</span>
              <span className="text-xs text-(--color-muted-foreground)">
                Header row must match the template columns. Max 2 MB / {MAX_ROWS} rows.
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-[var(--radius)] border border-(--color-border) px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="h-4 w-4 shrink-0 text-(--color-muted-foreground)" />
                <span className="truncate text-sm font-medium">{file.name}</span>
                <span className="shrink-0 text-xs text-(--color-muted-foreground)">
                  {rowCount} row{rowCount === 1 ? "" : "s"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={reset}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {parseError && <p className="text-sm text-(--color-danger)">{parseError}</p>}

          {file && !parseError && previewRows.length > 0 && (
            <div className="rounded-[var(--radius)] border border-(--color-border) overflow-hidden">
              <Table>
                <THead>
                  <TR>
                    {headers.map((h) => (
                      <TH key={h} className="whitespace-nowrap">
                        {h}
                      </TH>
                    ))}
                  </TR>
                </THead>
                <TBody>
                  {previewRows.map((row, i) => (
                    <TR key={i}>
                      {headers.map((h) => (
                        <TD key={h} className="whitespace-nowrap max-w-[200px] truncate">
                          {row[h]}
                        </TD>
                      ))}
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
          {file && !parseError && rowCount > PREVIEW_ROWS && (
            <p className="text-xs text-(--color-muted-foreground)">
              Showing first {PREVIEW_ROWS} of {rowCount} rows.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset} disabled={!file || importUsers.isPending}>
              Clear
            </Button>
            <Button onClick={onImport} disabled={!canImport || importUsers.isPending}>
              {importUsers.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {importUsers.isPending
                ? "Importing…"
                : `Import ${rowCount || ""} row${rowCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Import result</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Total {result.total}</Badge>
              <Badge variant="success">Created {result.created}</Badge>
              {result.failed > 0 && <Badge variant="danger">Failed {result.failed}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.createdUsers.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-(--color-muted-foreground) uppercase tracking-wide">
                  Created
                </p>
                <div className="rounded-[var(--radius)] border border-(--color-border) overflow-hidden">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Row</TH>
                        <TH>Email</TH>
                        <TH>Profile No.</TH>
                        <TH>Generated password</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {result.createdUsers.map((u) => (
                        <TR key={u.id}>
                          <TD>{u.row}</TD>
                          <TD>{u.email}</TD>
                          <TD>{u.profileNumber ?? "—"}</TD>
                          <TD>
                            {u.generatedPassword ? (
                              <code className="rounded bg-(--color-surface-muted) px-1.5 py-0.5 text-xs">
                                {u.generatedPassword}
                              </code>
                            ) : (
                              <span className="text-(--color-muted-foreground)">—</span>
                            )}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
                {result.createdUsers.some((u) => u.generatedPassword) && (
                  <p className="mt-2 text-xs text-(--color-muted-foreground)">
                    Generated passwords are shown only once — copy and share them now.
                  </p>
                )}
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-(--color-muted-foreground) uppercase tracking-wide">
                  Errors
                </p>
                <div className="rounded-[var(--radius)] border border-(--color-border) overflow-hidden">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Row</TH>
                        <TH>Email</TH>
                        <TH>Reason</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {result.errors.map((e, i) => (
                        <TR key={i}>
                          <TD>{e.row}</TD>
                          <TD>{e.email ?? "—"}</TD>
                          <TD className="text-(--color-danger)">{e.message}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={reset}>
                Import another file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
