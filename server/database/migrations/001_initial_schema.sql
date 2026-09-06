server/database/migrations/001_initial_schema.sql
-- Malhotra Automobiles - Initial Database Schema
-- Run this against your Supabase project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users / Profiles
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  name text not null,
  phone text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Vehicles
create table if not exists vehicles (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references profiles(id) on delete cascade not null,
  make text not null,
  model text not null,
  year integer,
  registration_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categories
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Products
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  brand text,
  sku text unique,
  price numeric(10,2) not null,
  discount_price numeric(10,2),
  description text,
  specifications jsonb,
  compatibility jsonb,
  availability_status text not null default 'in_stock' check (availability_status in ('in_stock', 'low_stock', 'out_of_stock')),
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Product Images
create table if not exists product_images (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade not null,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Services
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  duration_minutes integer not null,
  price numeric(10,2) not null,
  image text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Availability Slots
create table if not exists availability_slots (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid references services(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'available' check (status in ('available', 'held', 'booked', 'blocked', 'cancelled')),
  capacity integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Requests
create table if not exists requests (
  id uuid primary key default uuid_generate_v4(),
  request_number text not null unique,
  customer_id uuid references profiles(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'accepted', 'rejected', 'ready_for_visit', 'completed', 'cancelled')),
  notes text,
  estimated_total numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Request Items (Product Line Items)
create table if not exists request_items (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references requests(id) on delete cascade not null,
  product_id uuid references products(id) on delete restrict,
  quantity integer not null default 1,
  unit_price_snapshot numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- Request Services (Service Line Items)
create table if not exists request_services (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references requests(id) on delete cascade not null,
  service_id uuid references services(id) on delete restrict,
  slot_id uuid references availability_slots(id) on delete restrict,
  price_snapshot numeric(10,2) not null,
  duration_snapshot integer not null,
  created_at timestamptz not null default now()
);

-- Conversations
create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references profiles(id) on delete cascade not null,
  status text not null default 'open' check (status in ('open', 'closed', 'archived')),
  assigned_admin_id uuid references profiles(id) on delete set null,
  ai_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Messages
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_type text not null check (sender_type in ('customer', 'admin', 'ai')),
  sender_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- Notifications
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid references profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Audit Logs
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Business Settings
create table if not exists business_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_published on products(published, featured);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_services_slug on services(slug);
create index if not exists idx_slots_service_date on availability_slots(service_id, date);
create index if not exists idx_slots_status on availability_slots(status);
create index if not exists idx_requests_customer on requests(customer_id);
create index if not exists idx_requests_status on requests(status);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_conversations_customer on conversations(customer_id);
create index if not exists idx_vehicles_customer on vehicles(customer_id);
create index if not exists idx_notifications_recipient on notifications(recipient_id, read_at);
create index if not exists idx_audit_logs_admin on audit_logs(admin_id);

-- Row Level Security
alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table services enable row level security;
alter table availability_slots enable row level security;
alter table requests enable row level security;
alter table request_items enable row level security;
alter table request_services enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table business_settings enable row level security;

-- Profiles RLS
create policy "Profiles are viewable by authenticated users" on profiles for select to authenticated using (true);
create policy "Users can update their own profile" on profiles for update to authenticated using (auth.uid() = auth_user_id);

-- Vehicles RLS
create policy "Customers can view their own vehicles" on vehicles for select to authenticated using (auth.uid() = (select auth_user_id from profiles where id = customer_id));
create policy "Customers can manage their own vehicles" on vehicles for all to authenticated using (auth.uid() = (select auth_user_id from profiles where id = customer_id)) with check (auth.uid() = (select auth_user_id from profiles where id = customer_id));
create policy "Admins can view all vehicles" on vehicles for select to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Categories RLS
create policy "Categories are public" on categories for select using (active = true);

-- Products RLS
create policy "Published products are public" on products for select using (published = true);
create policy "Admins can manage all products" on products for all to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Product Images RLS
create policy "Product images are public" on product_images for select using (true);
create policy "Admins can manage product images" on product_images for all to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Services RLS
create policy "Active services are public" on services for select using (active = true);
create policy "Admins can manage all services" on services for all to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Availability Slots RLS
create policy "Available slots are public" on availability_slots for select using (status in ('available', 'held'));
create policy "Admins can manage all slots" on availability_slots for all to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Requests RLS
create policy "Customers can view their own requests" on requests for select to authenticated using (auth.uid() = (select auth_user_id from profiles where id = customer_id));
create policy "Customers can create their own requests" on requests for insert to authenticated with check (auth.uid() = (select auth_user_id from profiles where id = customer_id));
create policy "Admins can view all requests" on requests for select to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));
create policy "Admins can update all requests" on requests for update to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Request Items RLS
create policy "Customers can view their own request items" on request_items for select to authenticated using (auth.uid() = (select auth_user_id from profiles where id = (select customer_id from requests where id = request_id)));
create policy "Admins can view all request items" on request_items for select to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));
create policy "Request items are managed by system" on request_items for all to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Request Services RLS
create policy "Customers can view their own request services" on request_services for select to authenticated using (auth.uid() = (select auth_user_id from profiles where id = (select customer_id from requests where id = request_id)));
create policy "Admins can view all request services" on request_services for select to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));
create policy "Request services are managed by system" on request_services for all to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Conversations RLS
create policy "Customers can view their own conversations" on conversations for select to authenticated using (auth.uid() = (select auth_user_id from profiles where id = customer_id));
create policy "Admins can view all conversations" on conversations for select to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));
create policy "Customers can create their own conversations" on conversations for insert to authenticated with check (auth.uid() = (select auth_user_id from profiles where id = customer_id));
create policy "Admins can update conversations" on conversations for update to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Messages RLS
create policy "Customers can view messages in their conversations" on messages for select to authenticated using (auth.uid() = (select auth_user_id from profiles where id = (select customer_id from conversations where id = conversation_id)));
create policy "Admins can view all messages" on messages for select to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));
create policy "Customers can send messages" on messages for insert to authenticated with check (auth.uid() = (select auth_user_id from profiles where id = customer_id));
create policy "Admins can send messages" on messages for insert to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Notifications RLS
create policy "Users can view their own notifications" on notifications for select to authenticated using (auth.uid() = (select auth_user_id from profiles where id = recipient_id));
create policy "Admins can view all notifications" on notifications for select to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Audit Logs RLS
create policy "Admins can view all audit logs" on audit_logs for select to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));
create policy "System inserts audit logs" on audit_logs for insert to authenticated with check (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Business Settings RLS
create policy "Business settings are public" on business_settings for select using (true);
create policy "Admins can update business settings" on business_settings for all to authenticated using (exists (select 1 from profiles where auth_user_id = auth.uid() and role = 'admin'));

-- Trigger: update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on profiles for each row execute function update_updated_at_column();
create trigger update_vehicles_updated_at before update on vehicles for each row execute function update_updated_at_column();
create trigger update_categories_updated_at before update on categories for each row execute function update_updated_at_column();
create trigger update_products_updated_at before update on products for each row execute function update_updated_at_column();
create trigger update_services_updated_at before update on services for each row execute function update_updated_at_column();
create trigger update_slots_updated_at before update on availability_slots for each row execute function update_updated_at_column();
create trigger update_requests_updated_at before update on requests for each row execute function update_updated_at_column();
create trigger update_conversations_updated_at before update on conversations for each row execute function update_updated_at_column();

-- Trigger: generate request number
create or replace function generate_request_number()
returns trigger as $$
begin
  new.request_number := 'MA-' || to_char(new.created_at, 'YYYY') || '-' || lpad(floor(random() * 99999)::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_request_number before insert on requests for each row execute function generate_request_number();

-- Storage: Product Images Bucket
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict do nothing;

create policy "Product images are publicly accessible" on storage.objects for select using (bucket_id = 'product-images');
create policy "Admins can upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and exists (select 1 from profiles where auth.uid()::uuid = auth_user_id and role = 'admin'));
create policy "Admins can delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and exists (select 1 from profiles where auth.uid()::uuid = auth_user_id and role = 'admin'));

-- Realtime for conversations and messages
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
