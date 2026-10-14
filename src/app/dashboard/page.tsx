"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import conversionApi from "@/lib/api/conversions";
import { Conversion } from "@/types/conversion";
import { StatusBadge } from "@/components/conversion/StatusBadge";
import { ProgressBar } from "@/components/conversion/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";

const TERMINAL = new Set(["completed", "failed"]);
const POLL_INTERVAL_MS = 2500;

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default function DashboardPage() {
  const { can } = useAuth();

  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Fetch a page from GET /api/conversions
  const fetchPage = useCallback(
    async (page: number, silent = false) => {
      if (!silent) setIsLoading(true);
      setLoadError(null);
      try {
        const result = await conversionApi.getList(page);
        if (!isMountedRef.current) return;
        setConversions(result.data);
        setCurrentPage(result.current_page);
        setLastPage(result.last_page);
        setTotal(result.total);
      } catch (err: unknown) {
        if (!isMountedRef.current) return;
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          if (status === 429) {
            setLoadError("You are being rate-limited. Please wait a moment.");
          } else if (status === 403) {
            setLoadError("You do not have permission to view conversions.");
          } else {
            setLoadError(
              (err.response?.data as { message?: string })?.message ??
                "Could not load conversions. Check your connection."
            );
          }
        } else {
          setLoadError("Network error. Please check your connection and try again.");
        }
      } finally {
        if (!isMountedRef.current) return;
        setIsLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    let ignore = false;

    conversionApi
      .getList(1)
      .then((result) => {
        if (!ignore && isMountedRef.current) {
          setConversions(result.data);
          setCurrentPage(result.current_page);
          setLastPage(result.last_page);
          setTotal(result.total);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore && isMountedRef.current) {
          if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            if (status === 429) {
              setLoadError("You are being rate-limited. Please wait a moment.");
            } else if (status === 403) {
              setLoadError("You do not have permission to view conversions.");
            } else {
              setLoadError(
                (err.response?.data as { message?: string })?.message ??
                  "Could not load conversions. Check your connection."
              );
            }
          } else {
            setLoadError("Network error. Please check your connection and try again.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
      isMountedRef.current = false;
    };
  }, []);

  // Poll while any row is in-progress (status != completed/failed)
  useEffect(() => {
    const hasActive = conversions.some((c) => !TERMINAL.has(c.status));

    if (hasActive) {
      if (pollTimerRef.current === null) {
        pollTimerRef.current = setInterval(() => {
          // Silent re-fetch to update active rows without showing the loading spinner
          fetchPage(currentPage, true);
        }, POLL_INTERVAL_MS);
      }
    } else {
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    return () => {
      if (pollTimerRef.current !== null) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [conversions, currentPage, fetchPage]);

  const handleDownload = async (conversion: Conversion) => {
    if (conversion.status !== "completed" || !can("download converted files")) return;
    setDownloadingId(conversion.id);
    setDownloadError(null);
    try {
      const { blob, filename } = await conversionApi.download(conversion.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setDownloadError(
        (axios.isAxiosError(err)
          ? (err.response?.data as { message?: string })?.message
          : undefined) ?? "Download failed. Please try again."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    fetchPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            My Conversions
          </h1>
          <p className="text-sm text-muted-foreground">
            {total > 0 ? `${total} total conversion${total > 1 ? "s" : ""}` : "Track your document conversions."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPage(currentPage)}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Download error */}
      {downloadError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {downloadError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conversion History</CardTitle>
          <CardDescription>
            In-progress conversions update automatically every few seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading state */}
          {isLoading && (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading conversions…</p>
            </div>
          )}

          {/* Error state */}
          {!isLoading && loadError && (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div className="space-y-1">
                <p className="font-semibold text-destructive">Failed to Load</p>
                <p className="text-sm text-muted-foreground">{loadError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchPage(currentPage)}>
                Try Again
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !loadError && conversions.length === 0 && (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/60" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">No Conversions Yet</p>
                <p className="text-sm text-muted-foreground">
                  Head to the Documents page to convert your first file.
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          {!isLoading && !loadError && conversions.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">File</th>
                    <th scope="col" className="px-4 py-3 text-left">Operation</th>
                    <th scope="col" className="px-4 py-3 text-left">Status</th>
                    <th scope="col" className="px-4 py-3 text-left hidden sm:table-cell">Date</th>
                    <th scope="col" className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {conversions.map((c) => {
                    const isActive = !TERMINAL.has(c.status);
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-muted/25 transition-colors"
                      >
                        <td className="max-w-[200px] truncate px-4 py-3 font-medium text-foreground">
                          {c.original_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {c.operation}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1.5">
                            <StatusBadge status={c.status} />
                            {isActive && (
                              <ProgressBar value={c.progress} />
                            )}
                            {c.status === "failed" && c.error_message && (
                              <p className="text-xs text-destructive">{c.error_message}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell whitespace-nowrap">
                          {formatDate(c.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {c.status === "completed" && can("download converted files") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(c)}
                              disabled={downloadingId === c.id}
                            >
                              {downloadingId === c.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              <span className="ml-1.5 hidden sm:inline">Download</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !loadError && lastPage > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {currentPage} of {lastPage}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= lastPage || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
