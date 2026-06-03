import apiClient from "./apiClient";
import type { BookingReportResponse, RevenueReportResponse } from "./types";

export const reportAPI = {
  getRevenue: (): Promise<RevenueReportResponse> =>
    apiClient.get("/reports/revenue").then((res) => res.data),
  getBookings: (): Promise<BookingReportResponse> =>
    apiClient.get("/reports/bookings").then((res) => res.data),
};

export type { BookingReportResponse, RevenueReportResponse };
