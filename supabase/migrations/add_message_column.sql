-- Run this in your Supabase SQL Editor

-- Add message column to borrow_requests
alter table public.borrow_requests add column if not exists message text;
