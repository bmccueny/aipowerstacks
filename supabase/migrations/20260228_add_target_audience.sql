-- Migration: Add target_audience to tools
-- Date: 2026-02-28

alter table public.tools add column if not exists target_audience text;
create index if not exists tools_target_audience_idx on public.tools (target_audience);
