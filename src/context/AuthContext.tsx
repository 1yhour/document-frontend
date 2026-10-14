"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import authApi from "@/lib/api/auth";
import {
  ApiValidationError,
  AppPermission,
  AppRole,
  AuthResponse,
  LoginCredential,
  RegisterCredential,
  User,
} from "@/types/auth";
import { can as checkCan, getHomeRouteForUser, hasRole as checkHasRole } from "@/lib/auth-utils";

export interface AuthContextType {
  user: User | null;
  roles: string[];
  permissions: string[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: Record<string, string[]> | null;
  forbiddenMessage: string | null;
  clearForbiddenMessage: () => void;
  can: (permission: AppPermission | string) => boolean;
  hasRole: (role: AppRole | string) => boolean;
  login: (
    credentials: LoginCredential
  ) => Promise<{ success: boolean; data?: AuthResponse; error?: unknown }>;
  register: (
    credentials: RegisterCredential
  ) => Promise<{ success: boolean; data?: AuthResponse; error?: unknown }>;
  logout: () => Promise<void>;
  checkUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);

  const router = useRouter();

  const clearForbiddenMessage = useCallback(() => {
    setForbiddenMessage(null);
  }, []);

  // Fetch current user from /api/user
  const checkUser = useCallback(async (): Promise<User | null> => {
    try {
      setIsLoading(true);
      const currentUser = await authApi.getUser();
      setUser(currentUser);
      return currentUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial user check on mount & listen to api client events
  useEffect(() => {
    let isMounted = true;

    authApi
      .getUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const handleUnauthorized = () => {
      setUser(null);
    };

    const handleForbidden = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      setForbiddenMessage(
        customEvent.detail?.message || "You do not have permission to perform this action."
      );
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("auth:forbidden", handleForbidden);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("auth:forbidden", handleForbidden);
    };
  }, []);

  const login = async (credentials: LoginCredential) => {
    setIsSubmitting(true);
    setError(null);
    setValidationErrors(null);

    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      const targetRoute = getHomeRouteForUser(response.user);
      router.push(targetRoute);
      return { success: true, data: response };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as ApiValidationError | undefined;
        if (err.response?.status === 422 && errorData?.errors) {
          setValidationErrors(errorData.errors);
          setError(errorData.message || "Invalid credentials provided.");
        } else {
          setError(errorData?.message || err.message || "Authentication failed.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      return { success: false, error: err };
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (credentials: RegisterCredential) => {
    setIsSubmitting(true);
    setError(null);
    setValidationErrors(null);

    try {
      const response = await authApi.register(credentials);
      setUser(response.user);
      router.push("/login");
      return { success: true, data: response };
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as ApiValidationError | undefined;
        if (err.response?.status === 422 && errorData?.errors) {
          setValidationErrors(errorData.errors);
          setError(errorData.message || "Invalid credentials provided.");
        } else {
          setError(errorData?.message || err.message || "Authentication failed.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      return { success: false, error: err };
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    setIsSubmitting(true);
    try {
      await authApi.logout();
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = useMemo(() => user?.roles || [], [user]);
  const permissions = useMemo(() => user?.permissions || [], [user]);

  const can = useCallback(
    (permission: AppPermission | string) => checkCan(user, permission),
    [user]
  );

  const hasRole = useCallback(
    (role: AppRole | string) => checkHasRole(user, role),
    [user]
  );

  const contextValue: AuthContextType = {
    user,
    roles,
    permissions,
    isLoading,
    isSubmitting,
    error,
    validationErrors,
    forbiddenMessage,
    clearForbiddenMessage,
    can,
    hasRole,
    login,
    register,
    logout,
    checkUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
