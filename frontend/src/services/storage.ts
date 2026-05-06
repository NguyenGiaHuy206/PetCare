import apiClient from "./apiClient";
import type { PresignedUrlResponse } from "./types";

export const storageAPI = {
  getPresignedUrl: (filename: string): Promise<PresignedUrlResponse> =>
    apiClient.post("/storage/presign", null, { params: { filename } }).then((res) => res.data),
  confirmUpload: (file_url: string): Promise<{ success: boolean; file_url: string }> =>
    apiClient.post("/storage/confirm", { file_url }).then((res) => res.data),
};

export type { PresignedUrlResponse };
