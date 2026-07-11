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

export const bookingsApi = {
  getAll: (params?: Record<string, string | number>) =>
    adminApi.get("/api/admin/bookings", { params }),
  getById: (id: string) => adminApi.get(`/api/admin/bookings/${id}`),
  updateStatus: (id: string, data: { status?: string; amountPaid?: number; notes?: string }) =>
    adminApi.patch(`/api/admin/bookings/${id}/status`, data),
  updateVerification: (id: string, stage: "pickup" | "return", condition: Record<string, unknown>) =>
    adminApi.patch(`/api/admin/bookings/${id}/verification`, { stage, condition }),
  closeBooking: (id: string, data: Record<string, unknown>) =>
    adminApi.patch(`/api/admin/bookings/${id}/close`, data),
  markRefundPaid: (id: string) =>
    adminApi.patch(`/api/admin/bookings/${id}/refund-paid`),
  update: (id: string, data: Record<string, unknown>) =>
    adminApi.put(`/api/admin/bookings/${id}`, data),
  exportCsv: (params?: Record<string, string>) =>
    adminApi.get("/api/admin/bookings/export", { params, responseType: "blob" }),
  createOffline: (data: Record<string, unknown>) =>
    adminApi.post("/api/admin/bookings/offline", data),
  // Media
  getMedia: (id: string) => adminApi.get(`/api/admin/bookings/${id}/media`),
  uploadMedia: (id: string, formData: FormData) =>
    adminApi.post(`/api/admin/bookings/${id}/media`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  analyzeDamage: (id: string) => adminApi.post(`/api/admin/bookings/${id}/analyze-damage`, {}),
  runDentDetection: (id: string, force?: boolean) =>
    adminApi.post(`/api/admin/bookings/${id}/dent-detection`, force ? { force: true } : {}, { timeout: 90000 }),
  deleteMedia: (id: string, mediaId: string, url: string) =>
    adminApi.delete(`/api/admin/bookings/${id}/media/${mediaId}`, { data: { url } }),
  // User KYC documents for this booking's customer
  getUserDocs: (id: string) => adminApi.get(`/api/admin/bookings/${id}/user-docs`),
  // Send car documents to customer via WhatsApp
  sendCarDocs: (id: string, overrideMobile?: string) =>
    adminApi.post(`/api/admin/bookings/${id}/send-car-docs`, overrideMobile ? { overrideMobile } : {}),
  // Upload invoice PDF + send to customer via WhatsApp
  sendInvoiceWhatsApp: (id: string, file: Blob) => {
    const formData = new FormData();
    formData.append("file", file, "invoice.pdf");
    return adminApi.post(`/api/admin/bookings/${id}/invoice/send-whatsapp`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  // Upload closing/final-settlement bill PDF + send to customer via WhatsApp
  sendClosingBillWhatsApp: (id: string, file: Blob) => {
    const formData = new FormData();
    formData.append("file", file, "final-bill.pdf");
    return adminApi.post(`/api/admin/bookings/${id}/closing-bill/send-whatsapp`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
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
  getPopular: (city: string, limit = 8, startTime?: string, endTime?: string) =>
    api.get("/api/cars/popular", { params: { city, limit, ...(startTime && endTime ? { startTime, endTime } : {}) } }),
  getById: (id: string) => api.get(`/api/cars/${id}`),
};

export const adminCarsApi = {
  getAll: (params?: Record<string, string | number>) =>
    adminApi.get("/api/admin/cars", { params }),
  getStats: () => adminApi.get("/api/admin/cars/stats"),
  create: (data: FormData) =>
    adminApi.post("/api/admin/cars", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getOne: (id: string) => adminApi.get(`/api/admin/cars/${id}`),
  update: (id: string, data: FormData | Record<string, unknown>) =>
    adminApi.put(`/api/admin/cars/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id: string) => adminApi.delete(`/api/admin/cars/${id}`),
  toggleStatus: (id: string) => adminApi.patch(`/api/admin/cars/${id}/toggle`),
  getExpiryAlerts: () => adminApi.get("/api/admin/cars/expiry-alerts"),
  uploadDocument: (id: string, docType: string, formData: FormData) =>
    adminApi.patch(`/api/admin/cars/${id}/documents/${docType}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const adminMaintenanceApi = {
  getAll: (params?: Record<string, string | number>) =>
    adminApi.get("/api/admin/maintenance", { params }),
  getTotalsByCar: (params?: Record<string, string>) => adminApi.get("/api/admin/maintenance/by-car", { params }),
  create: (data: Record<string, unknown>) => adminApi.post("/api/admin/maintenance", data),
  update: (id: string, data: Record<string, unknown>) => adminApi.put(`/api/admin/maintenance/${id}`, data),
  remove: (id: string) => adminApi.delete(`/api/admin/maintenance/${id}`),
};

// RC verification / Challan check for ANY registration number — fleet car or
// not. Results are cached server-side by registration number; pass force to
// bypass the cache and re-run.
export const adminGpsApi = {
  getLive: () => adminApi.get("/api/admin/gps/live"),
};

export const vehicleVerificationApi = {
  verifyRC: (registrationNo: string, chassisNumber: string, engineNumber: string, force?: boolean) =>
    adminApi.post("/api/admin/vehicle-verification/rc", { registrationNo, chassisNumber, engineNumber, force }, { timeout: 60000 }),
  checkChallan: (registrationNo: string, force?: boolean) =>
    adminApi.post("/api/admin/vehicle-verification/challan", { registrationNo, force }, { timeout: 60000 }),
  list: (params?: { page?: number; limit?: number }) =>
    adminApi.get("/api/admin/vehicle-verification", { params }),
};

export const bookingsAPI = {
  create: (data: Record<string, unknown>) =>
    api.post("/api/bookings/create", data),
  getMy: (params?: Record<string, string>) =>
    api.get("/api/bookings/my", { params }),
  getById: (id: string) => api.get(`/api/bookings/${id}`),
  getMedia: (id: string) => api.get(`/api/bookings/${id}/media`),
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
  submit: () => api.patch("/api/documents/submit"),
  sendAadhaarOtp: (aadhaarNumber: string) =>
    api.post("/api/documents/aadhaar/send-otp", { aadhaarNumber }, { timeout: 30000 }),
  verifyAadhaarOtp: (otp: string) =>
    api.post("/api/documents/aadhaar/verify-otp", { otp }, { timeout: 30000 }),
  verifyPan: (panNumber: string) =>
    api.post("/api/documents/pan/verify", { panNumber }, { timeout: 30000 }),
  verifyDL: (licenseNumber: string, dob?: string) =>
    api.post("/api/documents/dl/verify", { licenseNumber, dob }, { timeout: 30000 }),
};

export const adminDocumentsApi = {
  getAll: (params?: Record<string, string>) =>
    adminApi.get("/api/admin/documents", { params }),
  review: (userId: string, decisions: Record<string, { status: string; reason?: string }>) =>
    adminApi.patch(`/api/admin/documents/${userId}`, { decisions }),
};

export const adminUsersApi = {
  getAll: (params?: Record<string, string>) =>
    adminApi.get("/api/admin/users", { params }),
  getOne: (id: string) => adminApi.get(`/api/admin/users/${id}`),
  toggleBlock: (id: string) => adminApi.patch(`/api/admin/users/${id}/block`, {}),
  update: (id: string, data: { name?: string; email?: string; mobile?: string; address?: string }) =>
    adminApi.put(`/api/admin/users/${id}`, data),
  exportCsv: () => adminApi.get("/api/admin/users/export", { responseType: "blob" }),
};

export const couponsAPI = {
  validate: (code: string, bookingId: string) =>
    api.post("/api/coupons/validate", { code, bookingId }),
};

export const adminCouponsApi = {
  getAll: (params?: Record<string, string>) =>
    adminApi.get("/api/admin/coupons", { params }),
  create: (data: Record<string, unknown>) =>
    adminApi.post("/api/admin/coupons", data),
  update: (id: string, data: Record<string, unknown>) =>
    adminApi.put(`/api/admin/coupons/${id}`, data),
  remove: (id: string) => adminApi.delete(`/api/admin/coupons/${id}`),
  toggle: (id: string) => adminApi.patch(`/api/admin/coupons/${id}/toggle`),
};

export const blogsAPI = {
  getAll: (params?: Record<string, string>) =>
    api.get("/api/blogs", { params }),
  getBySlug: (slug: string) => api.get(`/api/blogs/${slug}`),
};

export const adminBlogsApi = {
  getAll: (params?: Record<string, string | number>) =>
    adminApi.get("/api/admin/blogs", { params }),
  getOne: (id: string) => adminApi.get(`/api/admin/blogs/${id}`),
  create: (data: FormData) =>
    adminApi.post("/api/admin/blogs", data, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id: string, data: FormData) =>
    adminApi.put(`/api/admin/blogs/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id: string) => adminApi.delete(`/api/admin/blogs/${id}`),
  togglePublish: (id: string) => adminApi.patch(`/api/admin/blogs/${id}/publish`),
};

export const contactAPI = {
  submit: (data: Record<string, unknown>) => api.post("/api/contact", data),
};

export const adminContactsAPI = {
  getAll: (params?: Record<string, string | number>) =>
    adminApi.get("/api/admin/contact-requests", { params }),
  updateStatus: (id: string, data: { status: string; adminNotes?: string }) =>
    adminApi.patch(`/api/admin/contact-requests/${id}`, data),
  exportCsv: () => adminApi.get("/api/admin/contact-requests/export", { responseType: "blob" }),
};

export const adminReportsApi = {
  getRevenue: (params: { from?: string; to?: string; groupBy?: string }) =>
    adminApi.get("/api/admin/reports/revenue", { params }),
  getBookingStats: (params: { from?: string; to?: string }) =>
    adminApi.get("/api/admin/reports/bookings", { params }),
};

export const adminDashboardAPI = {
  getSidebarCounts: () => adminApi.get("/api/admin/dashboard/sidebar-counts"),
  getStats: () => adminApi.get("/api/admin/dashboard/stats"),
};

export const citiesAPI = {
  getAll: () => api.get("/api/cities"),
};

export const adminCitiesApi = {
  getAll: () => adminApi.get("/api/admin/cities"),
  create: (data: { name: string; slug?: string; state?: string }) =>
    adminApi.post("/api/admin/cities", data),
  update: (id: string, data: Record<string, unknown>) =>
    adminApi.put(`/api/admin/cities/${id}`, data),
  remove: (id: string) => adminApi.delete(`/api/admin/cities/${id}`),
};

export const usersAPI = {
  getProfile: () => api.get("/api/users/profile"),
  updateProfile: (data: Record<string, unknown>) =>
    api.put("/api/users/profile", data),
  addMobile: (mobile: string, otp: string) =>
    api.post("/api/users/add-mobile", { mobile, otp }),
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

export const settingsApi = {
  get: () => adminApi.get("/api/admin/settings"),
  update: (data: Record<string, unknown>) =>
    adminApi.put("/api/admin/settings", data),
};

export const sliderApi = {
  getAll: () => adminApi.get("/api/admin/slider"),
  create: (formData: FormData) =>
    adminApi.post("/api/admin/slider", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, formData: FormData) =>
    adminApi.put(`/api/admin/slider/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id: string) => adminApi.delete(`/api/admin/slider/${id}`),
};

export const testimonialsApi = {
  getAll: () => adminApi.get("/api/admin/testimonials"),
  create: (formData: FormData) =>
    adminApi.post("/api/admin/testimonials", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, formData: FormData) =>
    adminApi.put(`/api/admin/testimonials/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id: string) => adminApi.delete(`/api/admin/testimonials/${id}`),
};

export const offersApi = {
  getAll: () => adminApi.get("/api/admin/offers"),
  create: (formData: FormData) =>
    adminApi.post("/api/admin/offers", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, formData: FormData) =>
    adminApi.put(`/api/admin/offers/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id: string) => adminApi.delete(`/api/admin/offers/${id}`),
};

export const policyApi = {
  getAll: () => adminApi.get("/api/admin/policy"),
  getPage: (key: string) => adminApi.get(`/api/admin/policy/${key}`),
  upsert: (key: string, data: Record<string, unknown>) =>
    adminApi.put(`/api/admin/policy/${key}`, data),
};

export const favoritesApi = {
  getMyFavorites: () => api.get("/api/favorites/my"),
  toggle: (carId: string) => api.post("/api/favorites/toggle", { carId }),
};
