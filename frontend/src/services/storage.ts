import apiClient from "./apiClient";
import type { PresignedUrlResponse } from "./types";

export const storageAPI = {
  getPresignedUrl: (filename: string, content_type: string): Promise<PresignedUrlResponse> =>
    apiClient.post("/storage/presign", null, { params: { filename, content_type } }).then((res) => res.data),
  confirmUpload: (file_url: string): Promise<{ file_url: string; message: string }> =>
    apiClient.post("/storage/confirm", { file_url }).then((res) => res.data),
  uploadImage: async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please choose an image file.");
    }

    const { upload_url, file_url, content_type } = await storageAPI.getPresignedUrl(file.name, file.type);
    const uploadResponse = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": content_type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed with status ${uploadResponse.status}.`);
    }

    const confirmed = await storageAPI.confirmUpload(file_url);
    return confirmed.file_url;
  },
};

export type { PresignedUrlResponse };
