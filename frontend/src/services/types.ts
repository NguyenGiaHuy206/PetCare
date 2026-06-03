export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  is_email_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PetResponse {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string;
  age?: string;
  weight?: number;
  color?: string;
  gender?: string;
  microchip_id?: string;
  notes?: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingResponse {
  id: string;
  user_id: string;
  pet_id: string;
  pet_name?: string;
  service: string;
  booking_datetime: string;
  duration_minutes: number;
  status: string;
  notes?: string;
  order_id?: string;
  checkout_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CareLogResponse {
  id: string;
  user_id: string;
  pet_id: string;
  activity: string;
  timestamp: string;
  notes?: string;
  image_url?: string;
  created_at: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  description?: string;
  kind: "shop" | "service";
  category_id?: string;
  price: number;
  stock: number;
  duration_minutes?: number;
  package_weight_gram?: number;
  package_length_cm?: number;
  package_width_cm?: number;
  package_height_cm?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryResponse {
  id: string;
  name: string;
  scope: "shop" | "service" | "carelog";
  created_at: string;
  updated_at: string;
}

export interface OrderItemResponse {
  id: string;
  product_id: string;
  product_name?: string;
  product_kind?: "shop" | "service";
  product_image_url?: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
}

export type PaymentMethod = "vnpay" | "cod";

export interface BookingSlotResponse {
  time: string;
  available: boolean;
}

export interface BookingAvailabilityResponse {
  date: string;
  service: string;
  duration_minutes: number;
  slots: BookingSlotResponse[];
}

export interface OrderResponse {
  id: string;
  user_id: string;
  total: number;
  status: string;
  payment_method: PaymentMethod;
  payment_status: string;
  items: OrderItemResponse[];
  created_at: string;
  updated_at: string;
}

export interface CheckoutResponse {
  order_id: string;
  checkout_url: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  file_url: string;
  content_type: string;
}

export interface RevenueReportResponse {
  total_revenue: number;
  total_orders: number;
  period: string;
}

export interface BookingReportResponse {
  total_bookings: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled?: number;
}

export interface UserUpdateRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ShippingQuoteResponse {
  carrier: string;
  service_fee: number;
  total_weight_gram: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
}
