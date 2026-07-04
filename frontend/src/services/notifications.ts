import apiClient from "./apiClient";
import type { NotificationResponse } from "./types";

export const notificationAPI = {
  getAll: (): Promise<NotificationResponse[]> =>
    apiClient.get("/notifications").then((res) => res.data),
  markRead: (id: string): Promise<NotificationResponse> =>
    apiClient.put(`/notifications/${id}/read`).then((res) => res.data),
  markAllRead: (): Promise<{ message: string }> =>
    apiClient.put("/notifications/read-all").then((res) => res.data),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/notifications/${id}`).then(() => undefined),
};

export type { NotificationResponse };
