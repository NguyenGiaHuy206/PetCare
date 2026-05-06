import apiClient from "./apiClient";
import type { UserResponse } from "./types";

export const adminAPI = {
  getUsers: (): Promise<UserResponse[]> => apiClient.get("/admin/users").then((res) => res.data),
  updateUserRole: (userId: string, role: "admin" | "user"): Promise<UserResponse> =>
    apiClient.put(`/admin/users/${userId}/role`, { role }).then((res) => res.data),
};

export type { UserResponse };