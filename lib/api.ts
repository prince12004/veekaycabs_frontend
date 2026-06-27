import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("vk_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("vk_token");
      localStorage.removeItem("vk_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// Separate axios instance + token storage for the admin panel, so an admin
// login on the same browser never overwrites a logged-in customer session
// (and vice versa).
export const adminApi = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("vk_admin_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("vk_admin_token");
      localStorage.removeItem("vk_admin_user");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  sendOtp: (mobile: string) =>
    api.post("/api/auth/send-otp", { mobile }),
  verifyOtp: (mobile: string, otp: string) =>
    api.post("/api/auth/verify-otp", { mobile, otp }),
  logout: () => api.post("/api/auth/logout"),
};

export const adminAuthAPI = {
  login: (email: string, password: string) =>
    adminApi.post("/api/auth/admin-login", { email, password }),
};

export const adminAdminsAPI = {
  getAll: () => adminApi.get("/api/admin/admins"),
  create: (data: { name: string; email: string; password: string }) =>
    adminApi.post("/api/admin/admins", data),
  update: (id: string, data: { name?: string; email?: string; password?: string }) =>
    adminApi.put(`/api/admin/admins/${id}`, data),
  remove: (id: string) => adminApi.delete(`/api/admin/admins/${id}`),
};

export const carsAPI = {
  getAvailable: (params: Record<string, string>) =>
    api.get("/api/cars/available", { params }),
  getPopular: (city: string, limit = 8) =>
    api.get("/api/cars/popular", { params: { city, limit } }),
  getById: (id: string) => api.get(`/api/cars/${id}`),
};

export const bookingsAPI = {
  create: (data: Record<string, unknown>) =>
    api.post("/api/bookings/create", data),
  getMy: (params?: Record<string, string>) =>
    api.get("/api/bookings/my", { params }),
  getById: (id: string) => api.get(`/api/bookings/${id}`),
  extend: (id: string, data: Record<string, unknown>) =>
    api.post(`/api/bookings/${id}/extend`, data),
  cancel: (id: string, reason: string) =>
    api.post(`/api/bookings/${id}/cancel`, { reason }),
};

export const paymentsAPI = {
  createOrder: (data: Record<string, unknown>) =>
    api.post("/api/payments/create-order", data),
  verify: (data: Record<string, unknown>) =>
    api.post("/api/payments/verify", data),
};

export const documentsAPI = {
  getMy: () => api.get("/api/documents/my"),
  upload: (formData: FormData) =>
    api.post("/api/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const couponsAPI = {
  validate: (code: string, bookingId: string) =>
    api.post("/api/coupons/validate", { code, bookingId }),
};

export const blogsAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get("/api/blogs", { params }),
  getBySlug: (slug: string) => api.get(`/api/blogs/${slug}`),
};

export const contactAPI = {
  submit: (data: Record<string, unknown>) => api.post("/api/contact", data),
};

export const citiesAPI = {
  getAll: () => api.get("/api/cities"),
};

export const usersAPI = {
  getProfile: () => api.get("/api/users/profile"),
  updateProfile: (data: Record<string, unknown>) =>
    api.put("/api/users/profile", data),
};

// Public tempo traveller APIs
export const tempoAPI = {
  getAvailable: (params?: Record<string, string>) =>
    api.get("/api/tempo/available", { params }),
  getBySlug: (slug: string) => api.get(`/api/tempo/${slug}`),
  getSeoBySlug: (slug: string) => api.get(`/api/tempo/seo/${slug}`),
  createBooking: (data: Record<string, unknown>) =>
    api.post("/api/tempo/bookings", data),
  getMyBookings: () => api.get("/api/tempo/bookings/my"),
  getBookingById: (id: string) => api.get(`/api/tempo/bookings/${id}`),
  cancelBooking: (id: string, reason: string) =>
    api.post(`/api/tempo/bookings/${id}/cancel`, { reason }),
};

// Admin tempo APIs
export const adminTempoAPI = {
  getAll: () => adminApi.get("/api/admin/tempo"),
  getById: (id: string) => adminApi.get(`/api/admin/tempo/${id}`),
  create: (formData: FormData) =>
    adminApi.post("/api/admin/tempo", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: string, formData: FormData) =>
    adminApi.put(`/api/admin/tempo/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id: string) => adminApi.delete(`/api/admin/tempo/${id}`),
  toggle: (id: string) => adminApi.patch(`/api/admin/tempo/${id}/toggle`),
};

export const adminTempoBookingsAPI = {
  getAll: (params?: Record<string, string>) =>
    adminApi.get("/api/admin/tempo-bookings", { params }),
  getById: (id: string) => adminApi.get(`/api/admin/tempo-bookings/${id}`),
  createOffline: (data: Record<string, unknown>) =>
    adminApi.post("/api/admin/tempo-bookings/offline", data),
  update: (id: string, data: Record<string, unknown>) =>
    adminApi.put(`/api/admin/tempo-bookings/${id}`, data),
  remove: (id: string) => adminApi.delete(`/api/admin/tempo-bookings/${id}`),
  markReceived: (id: string) =>
    adminApi.patch(`/api/admin/tempo-bookings/${id}/car-received`),
};

export const adminTempoSeoAPI = {
  getAll: () => adminApi.get("/api/admin/tempo-seo"),
  getById: (id: string) => adminApi.get(`/api/admin/tempo-seo/${id}`),
  create: (data: Record<string, unknown>) =>
    adminApi.post("/api/admin/tempo-seo", data),
  update: (id: string, data: Record<string, unknown>) =>
    adminApi.put(`/api/admin/tempo-seo/${id}`, data),
  remove: (id: string) => adminApi.delete(`/api/admin/tempo-seo/${id}`),
};
