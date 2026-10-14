"use client";

import React from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Navigation from "@/components/Navigation";

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}
