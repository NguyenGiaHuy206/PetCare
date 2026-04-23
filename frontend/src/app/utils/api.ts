type ApiResponse<T = unknown> = Promise<{ data: T }>;

function mockResponse<T = unknown>(data: T): ApiResponse<T> {
  return Promise.resolve({ data });
}

function placeholderCall(path: string, payload?: unknown): ApiResponse {
  // UI-only mode: API methods are intentionally mocked until backend wiring is ready.
  console.info(`[UI placeholder API] ${path}`, payload ?? null);
  return mockResponse(null);
}

export const authAPI = {
  login: (email: string, password: string) =>
    placeholderCall('/auth/login', { email, password }),
  register: (data: any) =>
    placeholderCall('/auth/register', data),
  forgotPassword: (email: string) =>
    placeholderCall('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    placeholderCall('/auth/reset-password', { token, password }),
};

export const petAPI = {
  getAll: () => placeholderCall('/pets'),
  getById: (id: string) => placeholderCall(`/pets/${id}`),
  create: (data: FormData) => placeholderCall('/pets', data),
  update: (id: string, data: FormData) => placeholderCall(`/pets/${id}`, data),
  delete: (id: string) => placeholderCall(`/pets/${id}`),
};

export const serviceAPI = {
  getAll: () => placeholderCall('/services'),
  getById: (id: string) => placeholderCall(`/services/${id}`),
  create: (data: any) => placeholderCall('/services', data),
  update: (id: string, data: any) => placeholderCall(`/services/${id}`, data),
  delete: (id: string) => placeholderCall(`/services/${id}`),
};

export const bookingAPI = {
  getAll: () => placeholderCall('/bookings'),
  getById: (id: string) => placeholderCall(`/bookings/${id}`),
  create: (data: any) => placeholderCall('/bookings', data),
  update: (id: string, data: any) => placeholderCall(`/bookings/${id}`, data),
  cancel: (id: string) => placeholderCall(`/bookings/${id}`),
};

export const careLogAPI = {
  getAll: (petId?: string) => placeholderCall('/care-logs', { petId }),
  create: (data: FormData) => placeholderCall('/care-logs', data),
};

export const productAPI = {
  getAll: (params?: any) => placeholderCall('/products', params),
  getById: (id: string) => placeholderCall(`/products/${id}`),
};

export const cartAPI = {
  get: () => placeholderCall('/cart'),
  addItem: (productId: string, quantity: number) =>
    placeholderCall('/cart/items', { productId, quantity }),
  updateItem: (itemId: string, quantity: number) =>
    placeholderCall(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) => placeholderCall(`/cart/items/${itemId}`),
};

export const orderAPI = {
  getAll: () => placeholderCall('/orders'),
  getById: (id: string) => placeholderCall(`/orders/${id}`),
  create: (data: any) => placeholderCall('/orders', data),
};

export const paymentAPI = {
  createIntent: (orderId: string) => placeholderCall('/payments/intent', { orderId }),
  confirmPayment: (paymentId: string) => placeholderCall(`/payments/${paymentId}/confirm`),
};

export const reportAPI = {
  getRevenue: (params: any) => placeholderCall('/reports/revenue', params),
  getBookings: (params: any) => placeholderCall('/reports/bookings', params),
  getTopProducts: (params: any) => placeholderCall('/reports/top-products', params),
};

export const notificationAPI = {
  getAll: () => placeholderCall('/notifications'),
  markAsRead: (id: string) => placeholderCall(`/notifications/${id}/read`),
  markAllAsRead: () => placeholderCall('/notifications/read-all'),
  delete: (id: string) => placeholderCall(`/notifications/${id}`),
};

const api = {
  get: (path: string, params?: unknown) => placeholderCall(path, params),
  post: (path: string, data?: unknown) => placeholderCall(path, data),
  put: (path: string, data?: unknown) => placeholderCall(path, data),
  delete: (path: string) => placeholderCall(path),
};

export default api;
