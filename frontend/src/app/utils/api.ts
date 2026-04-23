import axios, { AxiosInstance, AxiosError } from 'axios';

// Interfaces for API responses
interface TokenResponse {
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

// ✅ Fixed: updated to match backend PetResponse schema
export interface PetResponse {
  id: string;
  owner_id: string;
  name: string;
  species: string;       // was: type: string
  breed: string;         // was: missing
  age?: string;          // was: age: number
  weight?: number;       // was: missing
  color?: string;        // was: missing
  gender?: string;       // was: missing
  microchip_id?: string; // was: missing
  notes?: string;        // was: missing
  photo_url?: string;    // was: image_url?: string
  created_at: string;
  updated_at: string;
}

interface BookingResponse {
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

interface CareLogResponse {
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
  price: number;
  stock: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface OrderItemResponse {
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

interface CheckoutResponse {
  order_id: string;
  checkout_url: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  file_url: string;
}

interface UserUpdateRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  address?: string;
}


// Token storage utilities
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (token: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and refresh token
let isRefreshing = false;
let failedQueue: Array<{
  onSuccess: (token: string) => void;
  onFailure: (error: AxiosError) => void;
}> = [];

const processQueue = (token: string | null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.onSuccess(token);
    } else {
      prom.onFailure(new AxiosError('Token refresh failed'));
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((onSuccess, onFailure) => {
          failedQueue.push({ onSuccess, onFailure });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(() => {
            tokenStorage.clearTokens();
            window.location.href = '/login';
            return Promise.reject(error);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = response.data;
        tokenStorage.setTokens(access_token, refresh_token);

        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(access_token);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (err) {
        processQueue(null);
        isRefreshing = false;
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string): Promise<TokenResponse> =>
    apiClient.post('/auth/login', { email, password }).then((res) => res.data),
  register: (email: string, password: string, full_name: string): Promise<UserResponse> =>
    apiClient.post('/auth/register', { email, password, full_name }).then((res) => res.data),
  refresh: (refresh_token: string): Promise<TokenResponse> =>
    apiClient.post('/auth/refresh', { refresh_token }).then((res) => res.data),
};

// ✅ Fixed: Pet API with correct field names and types
export const petAPI = {
  getAll: (): Promise<PetResponse[]> =>
    apiClient.get('/pets').then((res) => res.data),

  getById: (id: string): Promise<PetResponse> =>
    apiClient.get(`/pets/${id}`).then((res) => res.data),

  create: (data: {
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
  }): Promise<PetResponse> =>
    apiClient.post('/pets', data).then((res) => res.data),

  update: (id: string, data: Partial<{
    name: string;
    species: string;
    breed: string;
    age: string;
    weight: number;
    color: string;
    gender: string;
    microchip_id: string;
    notes: string;
    photo_url: string;
  }>): Promise<PetResponse> =>
    apiClient.put(`/pets/${id}`, data).then((res) => res.data),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/pets/${id}`).then(() => undefined),
};

// Booking API
export const bookingAPI = {
  getAll: (skip: number = 0, limit: number = 20): Promise<BookingResponse[]> =>
    apiClient.get('/bookings', { params: { skip, limit } }).then((res) => res.data),
  getById: (id: string): Promise<BookingResponse> =>
    apiClient.get(`/bookings/${id}`).then((res) => res.data),
  create: (data: {
    pet_id: string;
    service: string;
    booking_datetime: string;
    duration_minutes: number;
    notes?: string;
  }): Promise<BookingResponse> =>
    apiClient.post('/bookings', data).then((res) => res.data),
  updateStatus: (id: string, status: string): Promise<BookingResponse> =>
    apiClient.put(`/bookings/${id}/status`, { status }).then((res) => res.data),
  update: (id: string, data: { notes?: string }): Promise<BookingResponse> =>
    apiClient.put(`/bookings/${id}`, data).then((res) => res.data),
  delete: (id: string): Promise<void> =>
    apiClient.delete(`/bookings/${id}`).then(() => undefined),
};

// Care Log API
export const careLogAPI = {
  getAll: (petId?: string, skip: number = 0, limit: number = 20): Promise<CareLogResponse[]> =>
    apiClient
      .get('/care-logs', { params: { pet_id: petId, skip, limit } })
      .then((res) => res.data),
  create: (data: {
    pet_id: string;
    activity: string;
    timestamp: string;
    notes?: string;
    image_url?: string;
  }): Promise<CareLogResponse> =>
    apiClient.post('/care-logs', data).then((res) => res.data),
};

// Product API
export const productAPI = {
  getAll: (skip: number = 0, limit: number = 20, search?: string): Promise<ProductResponse[]> =>
    apiClient
      .get('/products', { params: { skip, limit, search } })
      .then((res) => res.data),
  getById: (id: string): Promise<ProductResponse> =>
    apiClient.get(`/products/${id}`).then((res) => res.data),
  create: (data: { name: string; description?: string; price: number; stock: number }): Promise<ProductResponse> =>
    apiClient.post('/products', data).then((res) => res.data),
  update: (
    id: string,
    data: Partial<{ name: string; description: string; price: number; stock: number; image_url: string }>
  ): Promise<ProductResponse> =>
    apiClient.put(`/products/${id}`, data).then((res) => res.data),
};

// Order API
export const orderAPI = {
  getAll: (skip: number = 0, limit: number = 20): Promise<OrderResponse[]> =>
    apiClient.get('/orders', { params: { skip, limit } }).then((res) => res.data),
  getById: (id: string): Promise<OrderResponse> =>
    apiClient.get(`/orders/${id}`).then((res) => res.data),
  create: (items: Array<{ product_id: string; quantity: number }>): Promise<CheckoutResponse> =>
    apiClient.post('/orders', { items }).then((res) => res.data),
};

// Storage API (for S3 presigned URLs)
export const storageAPI = {
  // filename must be a query param — backend uses FastAPI plain str (not Pydantic body)
  getPresignedUrl: (filename: string): Promise<PresignedUrlResponse> =>
    apiClient.post('/storage/presign', null, { params: { filename } }).then((res) => res.data),
  confirmUpload: (file_url: string): Promise<{ success: boolean }> =>
    apiClient.post('/storage/confirm', { file_url }).then((res) => res.data),
};

// Report API
export const reportAPI = {
  getRevenue: (): Promise<{ total_revenue: number; total_orders: number; period: string }> =>
    apiClient.get('/reports/revenue').then((res) => res.data),
  getBookings: (): Promise<{ total_bookings: number; pending: number; confirmed: number; completed: number }> =>
    apiClient.get('/reports/bookings').then((res) => res.data),
};

// User API
export const userAPI = {
  getMe: (): Promise<UserResponse> => apiClient.get('/users/me').then((res) => res.data),
  updateMe: (data: UserUpdateRequest): Promise<UserResponse> =>
    apiClient.put('/users/me', data).then((res) => res.data),
};

export default apiClient;