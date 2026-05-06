export { authAPI } from "./auth";
export { adminAPI } from "./admin";
export { categoryAPI } from "./categories";
export { bookingAPI } from "./bookings";
export { careLogAPI } from "./careLogs";
export { orderAPI } from "./orders";
export { petAPI } from "./pets";
export { productAPI } from "./products";
export { reportAPI } from "./reports";
export { storageAPI } from "./storage";
export { userAPI } from "./users";
export { tokenStorage } from "./tokenStorage";
export { default as apiClient } from "./apiClient";

export type {
  BookingResponse,
  BookingReportResponse,
  CareLogResponse,
  CheckoutResponse,
  CategoryResponse,
  OrderResponse,
  PetResponse,
  PresignedUrlResponse,
  ProductResponse,
  RevenueReportResponse,
  TokenResponse,
  UserResponse,
  UserUpdateRequest,
} from "./types";
