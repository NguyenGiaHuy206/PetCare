import apiClient from "./apiClient";
import type { CategoryResponse } from "./types";

export type CategoryScope = "shop" | "service" | "carelog";

export const categoryAPI = {
  getAll: (scope?: CategoryScope): Promise<CategoryResponse[]> =>
    apiClient.get("/categories", { params: { scope } }).then((res) => res.data),
  create: (data: { name: string; scope: CategoryScope }): Promise<CategoryResponse> =>
    apiClient.post("/categories", data).then((res) => res.data),
  update: (id: string, data: { name: string }): Promise<CategoryResponse> =>
    apiClient.put(`/categories/${id}`, data).then((res) => res.data),
  delete: (id: string): Promise<void> => apiClient.delete(`/categories/${id}`).then(() => undefined),
};

export type { CategoryResponse };