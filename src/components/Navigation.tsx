"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FileText, LogOut, ShieldCheck, Users } from "lucide-react";

export function Navigation() {
  const { user, can, logout, isSubmitting } = useAuth();
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  const isDocumentsActive = pathname.startsWith("/document");
  const isAdminActive = pathname.startsWith("/admin");

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href={can("view all users") ? "/admin" : "/documents"} className="flex items-center gap-2 font-bold text-lg text-primary">
            <FileText className="h-6 w-6" />
            <span>DocuConvert</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              href="/documents"
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isDocumentsActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              Documents
            </Link>

            {/* Admin-only navigation link gated strictly by permission */}
            {can("view all users") && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isAdminActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-foreground">{user.name}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
              {user.roles?.includes("admin") && <ShieldCheck className="h-3 w-3" />}
              {user.roles?.[0] || "user"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="mr-1 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Navigation;
