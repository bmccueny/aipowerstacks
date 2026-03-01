-- Migration: Add Direct Messages
-- Date: 2026-03-01

create table if not exists public.direct_messages (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  receiver_id   uuid not null references public.profiles(id) on delete cascade,
  content       text not null,
  is_read       boolean default false,
  created_at    timestamptz not null default now()
);

-- Enable RLS
alter table public.direct_messages enable row level security;

-- Policies
create policy "Users can view their own sent/received messages"
  on public.direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.direct_messages for insert
  with check (auth.uid() = sender_id);

create policy "Users can mark received messages as read"
  on public.direct_messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Indexes
create index if not exists dm_sender_idx on public.direct_messages(sender_id);
create index if not exists dm_receiver_idx on public.direct_messages(receiver_id);
create index if not exists dm_created_at_idx on public.direct_messages(created_at);

-- Trigger to create a notification when a DM is received
create or replace function public.handle_new_dm()
returns trigger as $$
begin
  insert into public.notifications (user_id, type, actor_id, resource_id, message)
  values (
    new.receiver_id,
    'message',
    new.sender_id,
    new.id,
    'You received a new message!'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_dm on public.direct_messages;
create trigger on_new_dm
  after insert on public.direct_messages
  for each row execute procedure public.handle_new_dm();
