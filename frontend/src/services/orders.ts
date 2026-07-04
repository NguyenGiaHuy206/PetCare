import apiClient from "./apiClient";
import type { CheckoutResponse, OrderResponse, PaymentMethod } from "./types";

export const orderAPI = {
  getAll: (skip: number = 0, limit: number = 20): Promise<OrderResponse[]> =>
    apiClient.get("/orders", { params: { skip, limit } }).then((res) => res.data),
  getAllAdmin: (skip: number = 0, limit: number = 20, status?: string): Promise<OrderResponse[]> =>
    apiClient.get("/orders/admin/all", { params: { skip, limit, status } }).then((res) => res.data),
  getById: (id: string): Promise<OrderResponse> =>
    apiClient.get(`/orders/${id}`).then((res) => res.data),
  pay: (id: string): Promise<CheckoutResponse> =>
    apiClient.post(`/orders/${id}/pay`).then((res) => res.data),
  updateStatusAdmin: (id: string, status: string): Promise<OrderResponse> =>
    apiClient.put(`/orders/admin/${id}/status`, { status }).then((res) => res.data),
  create: (
    items: Array<{ product_id: string; quantity: number }>,
    vat_amount: number = 0,
    shipping_fee: number = 0,
    payment_method: PaymentMethod = "vnpay"
  ): Promise<CheckoutResponse> =>
    apiClient.post("/orders", { items, vat_amount, shipping_fee, payment_method }).then((res) => res.data),
};

export type { CheckoutResponse, OrderResponse };
