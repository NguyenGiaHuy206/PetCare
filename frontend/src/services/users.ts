import apiClient from "./apiClient";
import type { UserResponse, UserUpdateRequest } from "./types";

export const userAPI = {
  getMe: (): Promise<UserResponse> => apiClient.get("/users/me").then((res) => res.data),
  updateMe: (data: UserUpdateRequest): Promise<UserResponse> =>
    apiClient.put("/users/me", data).then((res) => res.data),
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> =>
    apiClient.post("/users/me/change-password", { current_password: currentPassword, new_password: newPassword, confirm_password: confirmPassword }).then((res) => res.data),
  deleteAccount: (password: string): Promise<{ message: string }> =>
    apiClient.delete("/users/me", { data: { password } }).then((res) => res.data),
};

export type { UserResponse, UserUpdateRequest };
