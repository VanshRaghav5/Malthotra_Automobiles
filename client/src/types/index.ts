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

export interface BusinessSettings {
  business_name: string;
  address: string;
  phone: string;
  email: string;
  weekday_hours: string;
  sunday_hours: string;
  weekday_start: string;
  weekday_end: string;
  sunday_start: string;
  sunday_end: string;
  sunday_closed: 'true' | 'false';
  owner_email: string;
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

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  sort_order: number;
  created_at: string;
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
  product_images?: ProductImage[];
  created_at: string;
  updated_at: string;
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
  availability_slots?: AvailabilitySlot[];
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

export interface Conversation {
  id: string;
  customer_id: string;
  status: 'open' | 'closed' | 'archived';
  messages?: Message[];
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
