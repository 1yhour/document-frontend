"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AppPermission, AppRole } from "@/types/auth";
import { getHomeRouteForUser } from "@/lib/auth-utils";
import { Loader2 } from "lucide-react";

/**
 * Frontend checks are a UX convenience only, not security.
 * The Laravel backend enforces permissions. Do not add any logic that assumes hiding a button protects data.
 */

interface RequireAuthProps {
  children: React.ReactNode;
  permission?: AppPermission | string;
  role?: AppRole | string;
  redirectTo?: string;
}

export function RequireAuth({
  children,
  permission,
  role,
  redirectTo,
}: RequireAuthProps) {
  const { user, isLoading, can, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Never make routing decisions while auth state is loading
    if (isLoading) return;

    // 1. Unauthenticated users are redirected to login
    if (!user) {
      router.replace("/login");
      return;
    }

    // 2. Permission check: if a required permission is not held by the user
    if (permission && !can(permission)) {
      const fallback = redirectTo || getHomeRouteForUser(user);
      router.replace(fallback);
      return;
    }

    // 3. Role check: if a specific role is required and missing
    if (role && !hasRole(role)) {
      const fallback = redirectTo || getHomeRouteForUser(user);
      router.replace(fallback);
      return;
    }
  }, [user, isLoading, permission, role, redirectTo, can, hasRole, router]);

  // Loading state: prevent flashing unauthorized UI or premature redirects
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Checking authorization...</p>
      </div>
    );
  }

  // Not logged in or unauthorized: do not render guarded children
  if (!user) {
    return null;
  }

  if (permission && !can(permission)) {
    return null;
  }

  if (role && !hasRole(role)) {
    return null;
  }

  return <>{children}</>;
}

export default RequireAuth;
