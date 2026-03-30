-- Migration: Add pricing staleness tracking to tool_pricing_tiers
-- Date: 2026-03-30

-- 1. Add staleness columns
alter table public.tool_pricing_tiers
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_verified_at timestamptz;

-- 2. Index for staleness queries (sort by oldest verified first)
create index if not exists tool_pricing_tiers_last_verified_at_idx
  on public.tool_pricing_tiers(last_verified_at nulls first);

create index if not exists tool_pricing_tiers_updated_at_idx
  on public.tool_pricing_tiers(updated_at);

-- 3. Auto-update trigger function
create or replace function public.handle_pricing_tier_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- 4. Attach trigger to table
drop trigger if exists on_pricing_tier_updated on public.tool_pricing_tiers;
create trigger on_pricing_tier_updated
  before update on public.tool_pricing_tiers
  for each row execute procedure public.handle_pricing_tier_updated_at();
