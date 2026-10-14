"use client";

import React from "react";
import RequireAuth from "./RequireAuth";
import { AppPermission } from "@/types/auth";

/**
 * Frontend checks are a UX convenience only, not security.
 * The Laravel backend enforces permissions. Do not add any logic that assumes hiding a button protects data.
 */
export function RequirePermission({
  permission,
  redirectTo,
  children,
}: {
  permission: AppPermission | string;
  redirectTo?: string;
  children: React.ReactNode;
}) {
  return (
    <RequireAuth permission={permission} redirectTo={redirectTo}>
      {children}
    </RequireAuth>
  );
}

export default RequirePermission;
