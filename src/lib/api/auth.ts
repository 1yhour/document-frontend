import apiClient from "./client";
import { AuthResponse, LoginCredential, User } from "@/types/auth";

export const authApi = {
  /**
   * Fetches the CSRF cookie from Laravel Sanctum.
   * This sets the XSRF-TOKEN cookie in the browser.
   */
  async getCsrfCookie(): Promise<void> {
    await apiClient.get("/sanctum/csrf-cookie");
  },

  /**
   * Logs the user in with session cookie.
   * 1. Fetches CSRF cookie first.
   * 2. Submits credentials to Laravel.
   */
  async login(credentials: LoginCredential): Promise<AuthResponse> {
    await this.getCsrfCookie();
    const response = await apiClient.post<AuthResponse>("/api/auth/login", credentials);
    return response.data;
  },

  /**
   * Terminates the session on the backend.
   */
  async logout(): Promise<void> {
    await apiClient.post("/api/auth/logout");
  },

  /**
   * Retrieves the currently authenticated user from Laravel.
   */
  async getUser(): Promise<User> {
    const response = await apiClient.get<User>("/api/user");
    return response.data;
  },
};

export default authApi;
