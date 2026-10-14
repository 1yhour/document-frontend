"use client";

import React from "react";

interface ProgressBarProps {
  /** Value from 0 to 100 */
  value: number;
  label?: string;
}

/**
 * Accessible progress bar.
 * The CSS transition on `width` provides smooth interpolation between server-reported values.
 * Progress is NEVER faked beyond the server's reported value.
 */
export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Conversion progress"}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-in-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
