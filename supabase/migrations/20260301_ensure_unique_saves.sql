-- Migration: Ensure unique saves per user
-- Date: 2026-03-01

-- Prevent a user from saving (cloning) the same source stack more than once.
-- We only apply this where source_collection_id is NOT NULL (i.e., it's a saved stack).
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_source_collection 
ON public.collections (user_id, source_collection_id) 
WHERE (source_collection_id IS NOT NULL);
