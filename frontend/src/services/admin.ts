import apiClient from "./apiClient";
import type { UserResponse } from "./types";

export const adminAPI = {
  getUsers: (): Promise<UserResponse[]> => apiClient.get("/admin/users").then((res) => res.data),
  updateUserRole: (userId: string, role: "admin" | "user"): Promise<UserResponse> =>
    apiClient.put(`/admin/users/${userId}/role`, { role }).then((res) => res.data),
  deleteUser: (userId: string): Promise<void> =>
    apiClient.delete(`/admin/users/${userId}`).then(() => undefined),
};

export type { UserResponse };
