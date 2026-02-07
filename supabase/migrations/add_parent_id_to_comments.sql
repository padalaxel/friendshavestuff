-- Add parent_id to comments table for nested replies
ALTER TABLE comments 
ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
