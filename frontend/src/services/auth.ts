import apiClient from "./apiClient";
import type { TokenResponse, UserResponse } from "./types";

export const authAPI = {
  login: (email: string, password: string): Promise<TokenResponse> =>
    apiClient.post("/auth/login", { email, password }).then((res) => res.data),
  register: (email: string, password: string, full_name: string): Promise<UserResponse> =>
    apiClient.post("/auth/register", { email, password, full_name }).then((res) => res.data),
  refresh: (refresh_token: string): Promise<TokenResponse> =>
    apiClient.post("/auth/refresh", { refresh_token }).then((res) => res.data),
  forgotPassword: (email: string): Promise<{ message: string; reset_url?: string; reset_token?: string }> =>
    apiClient.post("/auth/forgot-password", { email }).then((res) => res.data),
  resetPassword: (token: string, new_password: string, confirm_password: string): Promise<{ message: string }> =>
    apiClient.post("/auth/reset-password", { token, new_password, confirm_password }).then((res) => res.data),
};

export type { TokenResponse, UserResponse };
