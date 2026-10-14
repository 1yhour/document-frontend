"use client";

import React, { useCallback, useState } from "react";
import conversionApi from "@/lib/api/conversions";
import { useConversionPoller } from "@/hooks/useConversionPoller";
import { useAuth } from "@/hooks/useAuth";
import { Operation } from "@/types/conversion";
import { DropZone } from "./DropZone";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

interface ConversionPanelProps {
  operations: Operation[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Queued",
  uploading: "Uploading…",
  processing: "Converting…",
  completed: "Done!",
  failed: "Failed",
};

/**
 * Self-contained conversion workflow:
 * 1. Pick operation
 * 2. Pick & validate file
 * 3. Submit → poll status → show progress
 * 4. Download or retry
 */
export function ConversionPanel({ operations }: ConversionPanelProps) {
  const { can } = useAuth();

  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(
    operations[0] ?? null
  );
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const { conversion, isPolling, pollError, startPolling, clearConversion } =
    useConversionPoller();

  // Resume polling if conversion_id is in URL on refresh/direct link
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("conversion_id") || params.get("id");
      if (id) {
        startPolling(id);
      }
    }
  }, [startPolling]);

  // Derived: compute validation error without setState in useEffect
  const fileValidationError: string | null = (() => {
    if (!file) return null;
    if (!selectedOperation) return "Please select an operation.";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!selectedOperation.allowed_extensions.includes(ext)) {
      return `Invalid file type ".${ext}". Expected: ${selectedOperation.allowed_extensions.map((e) => `.${e}`).join(", ")}.`;
    }
    const maxBytes = selectedOperation.max_file_size_kb * 1024;
    if (file.size > maxBytes) {
      const maxMb = (selectedOperation.max_file_size_kb / 1024).toFixed(0);
      return `File is too large. Maximum is ${maxMb} MB.`;
    }
    return null;
  })();

  const handleFileChange = (f: File) => {
    setFile(f);
  };

  const handleOperationChange = (key: string) => {
    const op = operations.find((o) => o.operation === key) ?? null;
    setSelectedOperation(op);
    // Reset file when switching operation
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!file || !selectedOperation || fileValidationError) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors(null);
    clearConversion();

    try {
      const created = await conversionApi.store(file, selectedOperation.operation);
      // Begin polling immediately after the 202 response
      startPolling(created.id);
      // Save ID to URL query param so refresh will resume polling
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("conversion_id", created.id);
        window.history.replaceState({}, "", url.toString());
      }
      // Reset the form
      setFile(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as {
          message?: string;
          errors?: Record<string, string[]>;
        };
        if (status === 422 && data?.errors) {
          setFieldErrors(data.errors);
          setSubmitError(data.message ?? "Validation failed. Check your file and operation.");
        } else if (status === 429) {
          setSubmitError("You are submitting too fast. Please wait a moment and try again.");
        } else if (status === 403) {
          setSubmitError("You do not have permission to convert documents.");
        } else {
          setSubmitError(data?.message ?? err.message ?? "An error occurred while submitting.");
        }
      } else {
        setSubmitError("A network error occurred. Check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = useCallback(async () => {
    if (!conversion || conversion.status !== "completed") return;
    setIsDownloading(true);
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
      if (axios.isAxiosError(err)) {
        setSubmitError(
          (err.response?.data as { message?: string })?.message ??
            "Download failed. Please try again."
        );
      } else {
        setSubmitError("Download failed. Please try again.");
      }
    } finally {
      setIsDownloading(false);
    }
  }, [conversion]);

  const handleTryAgain = () => {
    clearConversion();
    setSubmitError(null);
    setFieldErrors(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("conversion_id");
      url.searchParams.delete("id");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const isActive = conversion !== null;
  const isTerminal =
    conversion?.status === "completed" || conversion?.status === "failed";
  const canSubmit =
    can("convert documents") &&
    !!file &&
    !!selectedOperation &&
    !fileValidationError &&
    !isSubmitting &&
    !isPolling;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Convert New Document
        </CardTitle>
        <CardDescription>
          Upload a file and select a conversion operation. Progress is tracked in real time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* --- Error banners --- */}
        {submitError && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
        {fieldErrors &&
          Object.entries(fieldErrors).map(([field, messages]) => (
            <div
              key={field}
              className="rounded-md border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive"
            >
              <strong className="capitalize">{field}:</strong> {messages.join(" ")}
            </div>
          ))}
        {pollError && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{pollError}</span>
          </div>
        )}

        {/* --- Active conversion progress --- */}
        {isActive && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate text-sm font-medium text-foreground max-w-[200px]">
                  {conversion.original_name}
                </span>
                <StatusBadge status={conversion.status} />
              </div>
              {isPolling && (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              )}
            </div>

            <ProgressBar
              value={conversion.progress}
              label={STATUS_LABEL[conversion.status] ?? conversion.status}
            />

            {/* Completed */}
            {conversion.status === "completed" && (
              <div className="flex items-center gap-3 pt-1">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span className="flex-1 text-sm text-muted-foreground">
                  Conversion complete.
                </span>
                {can("download converted files") && (
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Download
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleTryAgain}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  New
                </Button>
              </div>
            )}

            {/* Failed */}
            {conversion.status === "failed" && (
              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {conversion.error_message ?? "Conversion failed. Please try again."}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleTryAgain}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* --- Upload form (hidden while a conversion is in progress) --- */}
        {(!isActive || isTerminal) && can("convert documents") && (
          <div className="space-y-4">
            {/* Operation selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="operation-select"
                className="block text-sm font-medium text-foreground"
              >
                Conversion Type
              </label>
              <select
                id="operation-select"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
                value={selectedOperation?.operation ?? ""}
                onChange={(e) => handleOperationChange(e.target.value)}
                disabled={isSubmitting || isPolling}
              >
                {operations.map((op) => (
                  <option key={op.operation} value={op.operation}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File picker */}
            <DropZone
              operation={selectedOperation}
              onFile={handleFileChange}
              currentFile={isTerminal ? null : file}
              validationError={fileValidationError}
              disabled={isSubmitting || isPolling}
            />

            {/* Submit button */}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                "Convert"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConversionPanel;
