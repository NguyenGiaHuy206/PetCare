import apiClient from "./apiClient";
import type { CheckoutResponse, OrderResponse } from "./types";

export const orderAPI = {
  getAll: (skip: number = 0, limit: number = 20): Promise<OrderResponse[]> =>
    apiClient.get("/orders", { params: { skip, limit } }).then((res) => res.data),
  getAllAdmin: (skip: number = 0, limit: number = 20, status?: string): Promise<OrderResponse[]> =>
    apiClient.get("/orders/admin/all", { params: { skip, limit, status } }).then((res) => res.data),
  getById: (id: string): Promise<OrderResponse> =>
    apiClient.get(`/orders/${id}`).then((res) => res.data),
  create: (items: Array<{ product_id: string; quantity: number }>): Promise<CheckoutResponse> =>
    apiClient.post("/orders", { items }).then((res) => res.data),
};

export type { CheckoutResponse, OrderResponse };
