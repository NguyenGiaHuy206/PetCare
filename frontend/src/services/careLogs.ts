import apiClient from "./apiClient";
import type { CareLogResponse } from "./types";

export const careLogAPI = {
  getAll: (petId?: string, skip: number = 0, limit: number = 20): Promise<CareLogResponse[]> =>
    apiClient
      .get("/care-logs", { params: { pet_id: petId, skip, limit } })
      .then((res) => res.data),
  create: (data: {
    user_id?: string;
    pet_id: string;
    activity: string;
    timestamp: string;
    notes?: string;
    image_url?: string;
  }): Promise<CareLogResponse> => apiClient.post("/care-logs", data).then((res) => res.data),
  getById: (id: string): Promise<CareLogResponse> => apiClient.get(`/care-logs/${id}`).then((res) => res.data),
  update: (id: string, data: { user_id?: string; pet_id: string; activity: string; timestamp: string; notes?: string; image_url?: string }): Promise<CareLogResponse> =>
    apiClient.put(`/care-logs/${id}`, data).then((res) => res.data),
  delete: (id: string): Promise<void> => apiClient.delete(`/care-logs/${id}`).then(() => undefined),
};

export type { CareLogResponse };
