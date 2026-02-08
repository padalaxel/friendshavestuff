-- Handle existing table by renaming columns to match desired schema
DO $$
BEGIN
    -- Rename user_id -> author_user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'user_id') THEN
        ALTER TABLE public.comments RENAME COLUMN user_id TO author_user_id;
    END IF;

    -- Rename text -> body
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'text') THEN
        ALTER TABLE public.comments RENAME COLUMN text TO body;
    END IF;

    -- Rename parent_id -> parent_comment_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'parent_id') THEN
        ALTER TABLE public.comments RENAME COLUMN parent_id TO parent_comment_id;
    END IF;
END $$;

-- Add updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'updated_at') THEN
        ALTER TABLE public.comments ADD COLUMN updated_at timestamp with time zone default timezone('utc'::text, now()) not null;
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh (avoids conflicts/duplicates)
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
-- Also drop potential old policy names if they exist
DROP POLICY IF EXISTS "Allow read access for all users" ON public.comments;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.comments;

-- Re-create Policies

-- SELECT: Authenticated users can view
CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Authenticated users can comment
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_user_id);

-- UPDATE: Authors can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_user_id);

-- DELETE: Authors can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_user_id);

-- Create Indexes (IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS comments_item_id_idx ON public.comments(item_id, created_at);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments(parent_comment_id);
