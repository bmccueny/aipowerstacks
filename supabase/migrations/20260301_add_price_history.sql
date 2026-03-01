-- Migration: Add Pricing History Tracking
-- Date: 2026-03-01

-- 1. Add numeric starting price for calculations
alter table public.tools add column if not exists starting_price numeric(10,2);
alter table public.tools add column if not exists price_currency text default 'USD';

-- 2. Create history table
create table if not exists public.tool_price_history (
  id            uuid primary key default gen_random_uuid(),
  tool_id       uuid not null references public.tools(id) on delete cascade,
  price         numeric(10,2) not null,
  created_at    timestamptz not null default now()
);

create index if not exists tool_price_history_tool_id_idx on public.tool_price_history(tool_id);
create index if not exists tool_price_history_created_at_idx on public.tool_price_history(created_at);

-- 3. Trigger to auto-log changes
create or replace function public.handle_tool_price_change()
returns trigger as $$
begin
  if (old.starting_price is distinct from new.starting_price) then
    insert into public.tool_price_history (tool_id, price)
    values (new.id, new.starting_price);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_tool_price_change on public.tools;
create trigger on_tool_price_change
  after update on public.tools
  for each row execute procedure public.handle_tool_price_change();

-- 4. Function to get price trend
create or replace function public.get_tool_price_trend(p_tool_id uuid, p_days int default 30)
returns table (
  current_price numeric,
  previous_price numeric,
  percent_change numeric
) as $$
declare
  curr numeric;
  prev numeric;
begin
  select starting_price into curr from public.tools where id = p_tool_id;
  
  select price into prev 
  from public.tool_price_history 
  where tool_id = p_tool_id 
    and created_at <= now() - (p_days || ' days')::interval
  order by created_at desc
  limit 1;

  if prev is null or prev = 0 or curr is null then
    return query select curr, prev, 0::numeric;
  else
    return query select curr, prev, round(((curr - prev) / prev) * 100, 2);
  end if;
end;
$$ language plpgsql stable;
