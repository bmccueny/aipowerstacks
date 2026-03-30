create table if not exists pricing_reports (
  id               uuid        primary key default gen_random_uuid(),
  tool_id          uuid        not null references tools(id) on delete cascade,
  tier_name        text        not null,
  reported_price   numeric     not null,
  actual_price_url text,
  reporter_id      uuid        references auth.users(id) on delete set null,
  status           text        not null default 'pending',
  created_at       timestamptz not null default now(),
  resolved_at      timestamptz
);

alter table pricing_reports enable row level security;

-- Anyone (including anon) can submit a report
create policy "anyone can insert pricing_reports"
  on pricing_reports for insert
  to anon, authenticated
  with check (true);

-- Only service_role can read or update
create policy "service_role can select pricing_reports"
  on pricing_reports for select
  to service_role
  using (true);

create policy "service_role can update pricing_reports"
  on pricing_reports for update
  to service_role
  using (true);

create index if not exists pricing_reports_tool_status_idx
  on pricing_reports (tool_id, status);
