"use client";

import React, { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { Operation } from "@/types/conversion";

interface DropZoneProps {
  operation: Operation | null;
  onFile: (file: File) => void;
  currentFile: File | null;
  validationError: string | null;
  disabled?: boolean;
}

/**
 * Accessible drag-and-drop / click file picker.
 * Performs CLIENT-SIDE extension and size validation as a UX aid only.
 * The backend always re-validates – these checks do not provide security.
 */
export function DropZone({
  operation,
  onFile,
  currentFile,
  validationError,
  disabled = false,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);


  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [disabled, onFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset so the same file can be re-picked after clearing
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const accept = operation
    ? operation.allowed_extensions.map((ext) => `.${ext}`).join(",")
    : undefined;

  return (
    <div className="space-y-2">
      {/* Hidden native file input — accessible via click or keyboard */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={
          currentFile
            ? `Selected file: ${currentFile.name}. Press Enter to change.`
            : "Drop a file or press Enter to browse"
        }
        aria-disabled={disabled}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={handleKeyDown}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center
          transition-colors duration-200 outline-none
          focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary/50 hover:bg-muted/30"}
          ${isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
          ${validationError ? "border-destructive/60 bg-destructive/5" : ""}
          ${currentFile && !validationError ? "border-primary/50 bg-primary/5" : ""}
        `}
      >
        {currentFile ? (
          <>
            <FileText className="h-10 w-10 text-primary" />
            <div>
              <p className="max-w-xs truncate text-sm font-medium text-foreground">
                {currentFile.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Click to change file</p>
          </>
        ) : (
          <>
            <UploadCloud
              className={`h-10 w-10 transition-colors ${isDragOver ? "text-primary" : "text-muted-foreground/60"}`}
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragOver ? "Drop the file here" : "Drag & drop or click to browse"}
              </p>
              {operation ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {operation.allowed_extensions.map((e) => `.${e}`).join(", ")} &bull; max{" "}
                  {(operation.max_file_size_kb / 1024).toFixed(0)} MB
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Select an operation first
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {validationError && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
          <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {validationError}
        </div>
      )}
    </div>
  );
}

export default DropZone;
