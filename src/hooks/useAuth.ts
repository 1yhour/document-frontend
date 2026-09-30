"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import authApi from "@/lib/api/auth";
import { ApiValidationError, LoginCredential, User } from "@/types/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]> | null>(null);
  const router = useRouter();

  // Check if session is already authenticated on mount
  const checkUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentUser = await authApi.getUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // Login handler
  const login = async (credentials: LoginCredential) => {
    setIsSubmitting(true);
    setError(null);
    setValidationErrors(null);

    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      router.push("/");
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

  // Logout handler
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

  return {
    user,
    isLoading,
    isSubmitting,
    error,
    validationErrors,
    login,
    logout,
    checkUser,
  };
}
