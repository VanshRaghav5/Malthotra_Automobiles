// Core type definitions for Malhotra Automobiles
export interface Profile {
  id: string;
  auth_user_id: string;
  role: 'customer' | 'admin';
  name: string;
  phone: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  make: string;
  model: string;
  year: number | null;
  registration_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  brand: string | null;
  sku: string | null;
  price: number;
  discount_price: number | null;
  description: string | null;
  specifications: Record<string, any> | null;
  compatibility: Record<string, any> | null;
  availability_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  featured: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  image: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type SlotStatus = 'available' | 'held' | 'booked' | 'blocked' | 'cancelled';

export interface AvailabilitySlot {
  id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  capacity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type RequestStatus = 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'ready_for_visit' | 'completed' | 'cancelled';

export interface Request {
  id: string;
  request_number: string;
  customer_id: string | null;
  vehicle_id: string | null;
  status: RequestStatus;
  notes: string | null;
  estimated_total: number | null;
  created_at: string;
  updated_at: string;
}

export interface RequestItem {
  id: string;
  request_id: string;
  product_id: string | null;
  quantity: number;
  unit_price_snapshot: number;
  created_at: string;
}

export interface RequestService {
  id: string;
  request_id: string;
  service_id: string | null;
  slot_id: string | null;
  price_snapshot: number;
  duration_snapshot: number;
  created_at: string;
}

export type ConversationStatus = 'open' | 'closed' | 'archived';

export interface Conversation {
  id: string;
  customer_id: string;
  status: ConversationStatus;
  assigned_admin_id: string | null;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'admin' | 'ai';
  sender_id: string | null;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface Notification {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

// API Request/Response types
export interface CreateProductInput {
  name: string;
  slug: string;
  brand?: string;
  sku?: string;
  price: number;
  discount_price?: number;
  description?: string;
  specifications?: Record<string, any>;
  compatibility?: Record<string, any>;
  availability_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  category_id?: string;
  featured?: boolean;
  published?: boolean;
}

export interface CreateServiceInput {
  name: string;
  slug: string;
  description?: string;
  duration_minutes: number;
  price: number;
  active?: boolean;
}

export interface CreateSlotInput {
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity?: number;
  notes?: string;
}

export interface SubmitRequestInput {
  customer_id?: string;
  vehicle_id?: string;
  notes?: string;
  items?: Array<{ product_id: string; quantity: number }>;
  services?: Array<{ service_id: string; slot_id: string }>;
}

export interface CreateMessageInput {
  conversation_id: string;
  content: string;
  sender_type: 'customer' | 'admin' | 'ai';
  sender_id?: string;
}

export interface ChatQuery {
  message: string;
  conversation_id?: string;
  customer_context?: Record<string, any>;
}
