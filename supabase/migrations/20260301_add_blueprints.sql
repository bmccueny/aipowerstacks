-- Migration: Add Project Blueprints
-- Date: 2026-03-01

create table if not exists public.blueprints (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text not null,
  category      text not null, -- 'Marketing', 'Development', 'Sales', etc.
  difficulty    text default 'Beginner', -- 'Beginner', 'Intermediate', 'Advanced'
  estimated_time text, -- '15 mins', '1 hour', etc.
  created_at    timestamptz not null default now()
);

create table if not exists public.blueprint_tools (
  blueprint_id  uuid not null references public.blueprints(id) on delete cascade,
  tool_id       uuid not null references public.tools(id) on delete cascade,
  role          text not null, -- 'Logic', 'Intelligence', 'Output', etc.
  sort_order    integer not null default 0,
  primary key (blueprint_id, tool_id)
);

create index if not exists blueprints_category_idx on public.blueprints(category);
