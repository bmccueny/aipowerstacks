-- Migration: Add Verified Identity Fields
-- Date: 2026-03-01

alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists github_url text;
alter table public.profiles add column if not exists is_identity_verified boolean default false;

-- Index for verified status
create index if not exists profiles_is_identity_verified_idx on public.profiles(is_identity_verified);
