"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, X } from "lucide-react";

export function ForbiddenAlert() {
  const { forbiddenMessage, clearForbiddenMessage } = useAuth();

  if (!forbiddenMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-md items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <div className="flex-1 text-sm font-medium">{forbiddenMessage}</div>
      <button
        onClick={clearForbiddenMessage}
        className="rounded-md p-1 hover:bg-destructive/15 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default ForbiddenAlert;
