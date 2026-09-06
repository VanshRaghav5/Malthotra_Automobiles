import axios from 'axios';
import type { BusinessSettings } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 -> clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export function getToken() {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearToken() {
  localStorage.removeItem('auth_token');
}

// Products
export const getProducts = (params?: { category?: string; brand?: string; search?: string }) =>
  api.get('/products', { params });

export const getProduct = (slug: string) => api.get(`/products/${slug}`);

export const getCategories = () => api.get('/products/categories');

// Services
export const getServices = () => api.get('/services');

export const getService = (slug: string) => api.get(`/services/${slug}`);

export const getServiceAvailability = (slug: string, startDate: string, endDate: string) =>
  api.get(`/services/${slug}/availability`, { params: { startDate, endDate } });

// Requests
export const submitRequest = (data: {
  customer_name: string;
  customer_phone?: string;
  customer_email: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_registration?: string;
  notes?: string;
  items?: { product_id: string; quantity: number }[];
  services?: { service_id: string; slot_id: string }[];
}) => api.post('/requests', data);

export const getRequest = (number: string) => api.get(`/requests/${number}`);

export const getMyRequests = () => api.get('/requests/my-requests');

// Chat
export const getConversations = () => api.get('/chat/conversations');

export const createConversation = () => api.post('/chat/conversations');

export const getMessages = (conversationId: string) =>
  api.get(`/chat/conversations/${conversationId}/messages`);

export const sendMessage = (conversationId: string, content: string) =>
  api.post(`/chat/conversations/${conversationId}/messages`, { content });

// AI
export const aiChat = (message: string, context?: any) =>
  api.post('/ai/chat', { message, customer_context: context });

// Auth
export const signup = (data: { email: string; password: string; name: string; phone?: string }) =>
  api.post('/auth/signup', data);

export const signin = (data: { email: string; password: string }) =>
  api.post('/auth/signin', data);

export const signout = () => api.post('/auth/signout');

export const getMe = () => api.get('/auth/me');

// Business settings
export const getSettings = () => api.get('/settings');
export const getAdminSettings = () => api.get('/settings/admin');
export const updateSettings = (data: BusinessSettings) => api.put('/settings', data);

// Admin
export const getDashboard = () => api.get('/admin/dashboard');
export const getAdminRequests = (params?: { status?: string; page?: string; limit?: string }) =>
  api.get('/admin/requests', { params });
export const updateRequestStatus = (id: string, status: string) =>
  api.patch(`/admin/requests/${id}/status`, { status });
export const getAdminCustomers = (params?: { search?: string }) =>
  api.get('/admin/customers', { params });

export const createProduct = (data: Record<string, any>) => api.post('/products', data);

export const updateProduct = (id: string, data: Record<string, any>) =>
  api.patch(`/products/${id}`, data);

export const deleteProduct = (id: string) => api.delete(`/products/${id}`);

// Image upload (base64)
export const uploadProductImage = (productId: string, base64Image: string) =>
  api.post(`/products/${productId}/images`, { image: base64Image });

export const deleteProductImage = (productId: string, imageId: string) =>
  api.delete(`/products/${productId}/images/${imageId}`);

export const createService = (data: Record<string, any>) => api.post('/services', data);

export const updateService = (id: string, data: Record<string, any>) =>
  api.patch(`/services/${id}`, data);

export const createSlot = (serviceId: string, data: Record<string, any>) =>
  api.post(`/services/${serviceId}/slots`, data);

export const deleteSlot = (serviceId: string, slotId: string) =>
  api.delete(`/services/${serviceId}/slots/${slotId}`);

export const deleteService = (id: string) => api.delete(`/services/${id}`);

export default api;
