import apiClient from "./client";
import { User } from "@/types/auth";

export interface AdminUsersResponse {
  status: boolean;
  data: User[];
}

export const adminApi = {
  /**
   * Fetches all registered users from the backend.
   * Protected on backend by 'permission:view all users'.
   */
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<AdminUsersResponse>("/api/admin/users");
    return response.data.data;
  },
};

export default adminApi;
