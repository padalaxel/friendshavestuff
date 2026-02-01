-- Run this in your Supabase SQL Editor

-- 1. Add user_id column
alter table public.allowed_users add column if not exists user_id uuid references auth.users;

-- 2. Backfill existing data (try to match emails)
update public.allowed_users
set user_id = auth.users.id
from auth.users
where public.allowed_users.email = auth.users.email;
