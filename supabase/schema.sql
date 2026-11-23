-- Bayner (باينر) PostgreSQL Schema for Supabase Free Tier
-- Paste this file in Supabase SQL Editor to deploy production persistence.

create extension if not exists "pgcrypto";

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  owner_name text not null,
  whatsapp_number text not null,
  city text not null default 'الرياض',
  iban text,
  bank_name text,
  daily_capacity integer not null default 4,
  default_deposit_percent integer not null default 40,
  instagram_handle text,
  pickup_address text,
  created_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  category text not null check (category in ('مقادير', 'تغليف', 'إضافات')),
  pack_price numeric(10, 2) not null check (pack_price >= 0),
  pack_quantity numeric(10, 2) not null check (pack_quantity > 0),
  unit text not null check (unit in ('جم', 'مل', 'حبة')),
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  category text not null check (category in ('كيك مناسبات', 'حلى وبوكسات', 'ميني كيك')),
  description text not null default '',
  servings integer not null default 8,
  items jsonb not null default '[]'::jsonb,
  labor_hours numeric(6, 2) not null default 1.5,
  hourly_rate numeric(8, 2) not null default 35,
  overhead_percent numeric(5, 2) not null default 8,
  waste_percent numeric(5, 2) not null default 7,
  platform_fee_percent numeric(5, 2) not null default 0,
  target_margin_percent numeric(5, 2) not null default 45,
  custom_selling_price numeric(10, 2),
  published_in_menu boolean not null default true,
  accent_color text not null default '#4F46E5',
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  order_number text not null,
  customer_name text not null,
  customer_phone text not null,
  delivery_date date not null,
  delivery_type text not null check (delivery_type in ('استلام', 'توصيل')),
  product_name text not null,
  is_custom_cake boolean not null default false,
  cake_size text,
  cake_flavor text,
  cake_filling text,
  cake_text text,
  inspiration_note text,
  total_price numeric(10, 2) not null,
  estimated_cost numeric(10, 2) not null default 0,
  estimated_waste numeric(10, 2) not null default 0,
  deposit_amount numeric(10, 2) not null default 0,
  deposit_paid boolean not null default false,
  status text not null default 'new' check (status in ('new', 'awaiting_deposit', 'preparing', 'ready', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  blocked_date date not null,
  unique (store_id, blocked_date)
);

create table if not exists public.whatsapp_rules (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  keywords text[] not null default '{}',
  response_template text not null,
  enabled boolean not null default true,
  attach_menu_link boolean not null default true
);

create table if not exists public.whatsapp_configs (
  store_id uuid primary key references public.stores(id) on delete cascade,
  mode text not null default 'smart_bridge' check (mode in ('smart_bridge', 'cloud_api')),
  phone_number_id text,
  waba_id text,
  access_token_encrypted text,
  verify_token text,
  auto_reply_enabled boolean not null default true,
  welcome_message text not null default ''
);

-- Enable Row Level Security (RLS)
alter table public.stores enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.orders enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.whatsapp_rules enable row level security;
alter table public.whatsapp_configs enable row level security;

-- Owner policies
create policy "store_owner_all" on public.stores
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "public_read_stores_by_slug" on public.stores
  for select using (true);

create policy "ingredients_owner_all" on public.ingredients
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "recipes_owner_all" on public.recipes
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "public_read_published_recipes" on public.recipes
  for select using (published_in_menu = true);

create policy "orders_owner_all" on public.orders
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "public_create_orders" on public.orders
  for insert with check (true);

create policy "blocked_dates_owner_all" on public.blocked_dates
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "public_read_blocked_dates" on public.blocked_dates
  for select using (true);

create policy "whatsapp_rules_owner_all" on public.whatsapp_rules
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );

create policy "whatsapp_configs_owner_all" on public.whatsapp_configs
  for all using (
    exists (select 1 from public.stores s where s.id = store_id and s.owner_id = auth.uid())
  );
