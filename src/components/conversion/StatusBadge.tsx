"use client";

import React from "react";
import { ConversionStatus } from "@/types/conversion";

const STATUS_CONFIG: Record<
  ConversionStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-muted text-muted-foreground border border-border",
  },
  uploading: {
    label: "Uploading",
    className:
      "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  processing: {
    label: "Converting",
    className:
      "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  completed: {
    label: "Done",
    className:
      "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  },
};

export function StatusBadge({ status }: { status: ConversionStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
