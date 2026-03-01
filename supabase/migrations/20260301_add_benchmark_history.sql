-- Migration: Add Benchmark History
-- Date: 2026-03-01

create table if not exists public.tool_benchmarks (
  id            uuid primary key default gen_random_uuid(),
  tool_id       uuid not null references public.tools(id) on delete cascade,
  latency       integer not null, -- in ms
  is_up         boolean not null,
  created_at    timestamptz not null default now()
);

create index if not exists tool_benchmarks_tool_id_idx on public.tool_benchmarks(tool_id);
create index if not exists tool_benchmarks_created_at_idx on public.tool_benchmarks(created_at);

-- Function to calculate rolling uptime percentage
create or replace function public.get_tool_uptime(p_tool_id uuid, p_days int default 30)
returns numeric as $$
declare
  total_checks int;
  up_checks int;
begin
  select count(*), count(*) filter (where is_up = true)
  into total_checks, up_checks
  from public.tool_benchmarks
  where tool_id = p_tool_id
    and created_at > now() - (p_days || ' days')::interval;

  if total_checks = 0 then
    return 100.00;
  end if;

  return round((up_checks::numeric / total_checks::numeric) * 100, 2);
end;
$$ language plpgsql stable;
