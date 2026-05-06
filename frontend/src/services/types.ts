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
  service: string;
  booking_datetime: string;
  duration_minutes: number;
  status: string;
  notes?: string;
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
  quantity: number;
  price_at_purchase: number;
  created_at: string;
}

export interface OrderResponse {
  id: string;
  user_id: string;
  total: number;
  status: string;
  stripe_session_id?: string;
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
}
