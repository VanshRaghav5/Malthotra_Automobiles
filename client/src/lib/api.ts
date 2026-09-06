import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

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
  customer_phone: string;
  customer_email: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_registration?: string;
  notes?: string;
  items?: { product_id: string; quantity: number }[];
  services?: { service_id: string; slot_id: string }[];
}) => api.post('/requests', data);

export const getRequest = (number: string) => api.get(`/requests/${number}`);

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

export const getMe = () => api.get('/auth/me');

// Admin
export const getDashboard = () => api.get('/admin/dashboard');
export const getAdminRequests = (params?: { status?: string; page?: string; limit?: string }) =>
  api.get('/admin/requests', { params });
export const updateRequestStatus = (id: string, status: string) =>
  api.patch(`/admin/requests/${id}/status`, { status });
export const getAdminCustomers = (params?: { search?: string }) =>
  api.get('/admin/customers', { params });

export default api;
