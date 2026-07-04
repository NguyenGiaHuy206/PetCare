import apiClient from "./apiClient";
import type { BookingAvailabilityResponse, BookingResponse, PaymentMethod } from "./types";

export const bookingAPI = {
  getAll: (skip: number = 0, limit: number = 20): Promise<BookingResponse[]> =>
    apiClient.get("/bookings", { params: { skip, limit } }).then((res) => res.data),
  getAllAdmin: (skip: number = 0, limit: number = 20, status?: string): Promise<BookingResponse[]> =>
    apiClient.get("/bookings/admin/all", { params: { skip, limit, status } }).then((res) => res.data),
  getById: (id: string): Promise<BookingResponse> =>
    apiClient.get(`/bookings/${id}`).then((res) => res.data),
  getAvailability: (service: string, date: string, durationMinutes: number): Promise<BookingAvailabilityResponse> =>
    apiClient
      .get("/bookings/availability", { params: { service, date, duration_minutes: durationMinutes } })
      .then((res) => res.data),
  create: (data: {
    pet_id: string;
    service: string;
    booking_datetime: string;
    duration_minutes: number;
    notes?: string;
    payment_method?: PaymentMethod;
  }): Promise<BookingResponse> => apiClient.post("/bookings", data).then((res) => res.data),
  updateStatus: (id: string, status: string): Promise<BookingResponse> =>
    apiClient.put(`/bookings/${id}/status`, { status }).then((res) => res.data),
  update: (id: string, data: { notes?: string }): Promise<BookingResponse> =>
    apiClient.put(`/bookings/${id}`, data).then((res) => res.data),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/bookings/${id}`).then(() => undefined),
};

export type { BookingResponse };
