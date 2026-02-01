-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. allowed_users
create table public.allowed_users (
  email text primary key,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. items
create table public.items (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  name text not null,
  description text,
  category text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. borrow_requests
create type public.request_status as enum ('pending', 'approved', 'declined', 'returned');

create table public.borrow_requests (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items not null on delete cascade, -- Cascade delete if item is deleted
  requester_id uuid references auth.users not null,
  owner_id uuid references auth.users not null,
  status public.request_status default 'pending' not null,
  start_date date, -- New Field
  end_date date,   -- New Field
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.allowed_users enable row level security;
alter table public.items enable row level security;
alter table public.borrow_requests enable row level security;

-- Policies --

-- Allowed Users
create policy "Allow read access for authenticated users" 
  on public.allowed_users for select to authenticated using (true);

-- Items
create policy "Allowed users can view items"
  on public.items for select
  to authenticated
  using (exists (select 1 from public.allowed_users where email = auth.jwt() ->> 'email'));

create policy "Users can create their own items"
  on public.items for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Owners can update own items"
  on public.items for update
  to authenticated
  using (auth.uid() = owner_id);

create policy "Owners can delete own items"
  on public.items for delete
  to authenticated
  using (auth.uid() = owner_id);

-- Borrow Requests
create policy "Users can view their own requests"
  on public.borrow_requests for select
  to authenticated
  using (
    auth.uid() = requester_id or 
    auth.uid() = owner_id
  );

create policy "Allowed users can create requests"
  on public.borrow_requests for insert
  to authenticated
  with check (
    auth.uid() = requester_id and
    exists (select 1 from public.allowed_users where email = auth.jwt() ->> 'email')
  );

create policy "Owners and Requesters can update requests"
  on public.borrow_requests for update
  to authenticated
  using (
    auth.uid() = owner_id or
    auth.uid() = requester_id
  );
