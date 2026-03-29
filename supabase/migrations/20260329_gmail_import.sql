-- user_gmail_tokens: one row per user, stores encrypted OAuth tokens
create table if not exists public.user_gmail_tokens (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  access_token  text not null,
  refresh_token text not null,
  expires_at   timestamptz not null,
  connected_at timestamptz not null default now()
);

alter table public.user_gmail_tokens enable row level security;

create policy "Users can read their own gmail tokens"
  on public.user_gmail_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert their own gmail tokens"
  on public.user_gmail_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own gmail tokens"
  on public.user_gmail_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete their own gmail tokens"
  on public.user_gmail_tokens for delete
  using (auth.uid() = user_id);

-- gmail_import_logs: audit trail of what was detected and imported from Gmail
create table if not exists public.gmail_import_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  tool_id         uuid references public.tools(id) on delete set null,
  email_subject   text,
  email_from      text,
  amount_detected numeric(10, 2),
  imported_at     timestamptz not null default now()
);

alter table public.gmail_import_logs enable row level security;

create policy "Users can read their own import logs"
  on public.gmail_import_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own import logs"
  on public.gmail_import_logs for insert
  with check (auth.uid() = user_id);

create index if not exists gmail_import_logs_user_id_idx on public.gmail_import_logs(user_id);
create index if not exists gmail_import_logs_imported_at_idx on public.gmail_import_logs(imported_at desc);
