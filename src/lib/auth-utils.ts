import { AppPermission, AppRole, User } from "@/types/auth";

/**
 * Determines the primary home route for a user based on their assigned role.
 * - Admin users are routed to /admin
 * - Standard users are routed to /documents
 * - Unauthenticated users (null) are routed to /login
 */
export function getHomeRouteForUser(user: User | null | undefined): string {
  if (!user) {
    return "/login";
  }

  if (hasRole(user, "admin")) {
    return "/admin";
  }

  return "/documents";
}

/**
 * Checks whether the user has a specific permission.
 */
export function can(user: User | null | undefined, permission: AppPermission | string): boolean {
  if (!user || !Array.isArray(user.permissions)) {
    return false;
  }
  return user.permissions.includes(permission);
}

/**
 * Checks whether the user has a specific role.
 */
export function hasRole(user: User | null | undefined, role: AppRole | string): boolean {
  if (!user || !Array.isArray(user.roles)) {
    return false;
  }
  return user.roles.includes(role);
}
