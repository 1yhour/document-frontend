"use client";

import { useEffect, useState } from "react";
import adminApi from "@/lib/api/admin";
import { User } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Loader2, RefreshCw, Users, Shield, Key } from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    adminApi
      .getUsers()
      .then((data) => {
        if (isMounted) {
          setUsers(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const errorMsg =
            (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message || "Failed to fetch users list. Please verify your permissions.";
          setError(errorMsg);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to fetch users list. Please verify your permissions.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage users and inspect roles and Spatie permissions in the system.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Showing all accounts registered in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="flex min-h-[250px] flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading users...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div className="space-y-1">
                <p className="font-semibold text-destructive">Failed to Load Users</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && users.length === 0 && (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
              <Users className="h-10 w-10 text-muted-foreground/60" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">No Users Found</p>
                <p className="text-sm text-muted-foreground">
                  There are currently no registered users to display.
                </p>
              </div>
            </div>
          )}

          {/* Populated Table */}
          {!isLoading && !error && users.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3">ID</th>
                    <th scope="col" className="px-4 py-3">Name</th>
                    <th scope="col" className="px-4 py-3">Email</th>
                    <th scope="col" className="px-4 py-3">Roles</th>
                    <th scope="col" className="px-4 py-3">Permissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/25 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{u.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles && u.roles.length > 0 ? (
                            u.roles.map((r) => (
                              <span
                                key={r}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                                  r === "admin"
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                <Shield className="h-3 w-3" />
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.permissions && u.permissions.length > 0 ? (
                            u.permissions.map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground border"
                              >
                                <Key className="h-2.5 w-2.5" />
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}