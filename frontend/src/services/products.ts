import apiClient from "./apiClient";
import type { ProductResponse } from "./types";

export type ProductKind = "shop" | "service";

export const productAPI = {
  getAll: (
    skip: number = 0,
    limit: number = 20,
    search?: string,
    kind?: ProductKind,
    category_id?: string
  ): Promise<ProductResponse[]> =>
    apiClient.get("/products", { params: { skip, limit, search, kind, category_id } }).then((res) => res.data),
  getById: (id: string): Promise<ProductResponse> =>
    apiClient.get(`/products/${id}`).then((res) => res.data),
  create: (data: { name: string; description?: string; price: number; stock: number; kind: ProductKind; category_id?: string; image_url?: string; duration_minutes?: number; package_weight_gram?: number; package_length_cm?: number; package_width_cm?: number; package_height_cm?: number }): Promise<ProductResponse> =>
    apiClient.post("/products", data).then((res) => res.data),
  update: (
    id: string,
    data: Partial<{ name: string; description: string; price: number; stock: number; image_url: string; duration_minutes: number; kind: ProductKind; category_id: string | null; package_weight_gram: number; package_length_cm: number; package_width_cm: number; package_height_cm: number }>
  ): Promise<ProductResponse> => apiClient.put(`/products/${id}`, data).then((res) => res.data),
  delete: (id: string): Promise<void> => apiClient.delete(`/products/${id}`).then(() => undefined),
};

export type { ProductResponse };
