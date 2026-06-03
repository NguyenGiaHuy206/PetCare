import { API_BASE_URL } from "../services/apiClient";

const isS3Url = (url: URL) =>
  (url.hostname.includes(".s3.") && url.hostname.endsWith(".amazonaws.com")) ||
  url.hostname.endsWith(".s3.amazonaws.com");

export function getImageSrc(imageUrl?: string | null): string {
  if (!imageUrl) {
    return "";
  }

  if (
    imageUrl.startsWith("blob:") ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith(`${API_BASE_URL}/storage/image`)
  ) {
    return imageUrl;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    if (isS3Url(parsedUrl)) {
      return `${API_BASE_URL}/storage/image?file_url=${encodeURIComponent(imageUrl)}`;
    }
  } catch {
    return imageUrl;
  }

  return imageUrl;
}
