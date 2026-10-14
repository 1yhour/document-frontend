"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import conversionApi from "@/lib/api/conversions";
import { Operation } from "@/types/conversion";
import { ConversionPanel } from "@/components/conversion/ConversionPanel";
import { AlertCircle, Lock, Loader2 } from "lucide-react";

export default function DocumentsPage() {
  const { can } = useAuth();

  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoadingOps, setIsLoadingOps] = useState(true);
  const [opsError, setOpsError] = useState<string | null>(null);

  // Fetch available operations on mount
  useEffect(() => {
    let isMounted = true;
    conversionApi
      .getOperations()
      .then((data) => {
        if (isMounted) setOperations(data);
      })
      .catch(() => {
        if (isMounted)
          setOpsError("Could not load conversion types. Please refresh the page.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingOps(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Document Converter
        </h1>
        <p className="text-sm text-muted-foreground">
          Convert your documents securely between formats. All conversions go through
          our backend — your files never leave our servers directly.
        </p>
      </div>

      {/* Operations loading / error state */}
      {isLoadingOps && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading conversion types…
        </div>
      )}

      {opsError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {opsError}
        </div>
      )}

      {/* Conversion UI — only when operations are loaded */}
      {!isLoadingOps && !opsError && (
        <>
          {can("convert documents") ? (
            <ConversionPanel operations={operations} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/20 p-12 text-center">
              <Lock className="h-10 w-10 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">Conversion Disabled</p>
              <p className="text-xs text-muted-foreground">
                Your account does not hold the &quot;convert documents&quot; permission.
                Contact an administrator.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
