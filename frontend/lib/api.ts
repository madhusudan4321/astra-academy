import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const getBaseURL = () => {
  if (!API_BASE || API_BASE === '/api') return '/api';
  if (API_BASE.endsWith('/api')) return API_BASE;
  return `${API_BASE}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Send HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints that should never trigger a token refresh retry
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/auth/forgot-password'];

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor to handle 401 gracefully
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // Never retry auth endpoints — prevents infinite refresh loops
    const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => requestUrl.includes(ep));
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // If 401 and not a retry, attempt refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;
      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Don't redirect here — let AuthContext handle navigation
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth endpoints
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

// Course endpoints
export const courseAPI = {
  getAll: () => api.get('/courses'),
  getMy: () => api.get('/courses/my'),
  getById: (id: string) => api.get(`/courses/${id}`),
};

// Video endpoints
export const videoAPI = {
  getStream: (courseId: string, lessonId: string) =>
    api.get(`/videos/${courseId}/${lessonId}/stream`),
  getNotes: (courseId: string, lessonId: string) =>
    api.get(`/videos/${courseId}/${lessonId}/notes`),
};

// Progress endpoints
export const progressAPI = {
  get: (courseId: string) => api.get(`/progress/${courseId}`),
  markComplete: (courseId: string, lessonId: string) =>
    api.post(`/progress/${courseId}/lesson/${lessonId}/complete`),
};

// Purchase endpoints
export const purchaseAPI = {
  createOrder: (courseId: string) =>
    api.post('/purchases/create-order', { courseId }),
  verify: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post('/purchases/verify', data),
};

// User endpoints
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: { name: string }) => api.put('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/change-password', data),
};

// Admin endpoints
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getCourses: () => api.get('/admin/courses'),
  createCourse: (formData: FormData) =>
    api.post('/admin/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCourse: (id: string, formData: FormData) =>
    api.put(`/admin/courses/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addChapter: (courseId: string, data: { title: string; description?: string }) =>
    api.post(`/admin/courses/${courseId}/chapters`, data),
  uploadLesson: (courseId: string, chapterId: string, formData: FormData) =>
    api.post(`/admin/courses/${courseId}/chapters/${chapterId}/lessons`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadNotes: (courseId: string, chapterId: string, lessonId: string, formData: FormData) =>
    api.post(
      `/admin/courses/${courseId}/chapters/${chapterId}/lessons/${lessonId}/notes`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ),
  getStudents: () => api.get('/admin/students'),
  grantAccess: (userId: string, courseId: string) =>
    api.post('/admin/purchases/grant', { userId, courseId }),
};
