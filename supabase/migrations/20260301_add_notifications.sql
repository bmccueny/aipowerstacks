-- Migration: Add Notifications and Remix Tracking
-- Date: 2026-03-01

-- 1. Create notifications table
create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text not null, -- 'remix', 'follow', 'review_helpful'
  actor_id      uuid references auth.users(id) on delete set null,
  resource_id   uuid, -- ID of the stack, tool, etc.
  message       text not null,
  is_read       boolean default false,
  created_at    timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_created_at_idx on public.notifications(created_at);

-- 2. Function to handle remix notification
create or replace function public.handle_stack_remix()
returns trigger as $$
declare
  source_owner_id uuid;
  source_name text;
  remix_count int;
begin
  if (new.source_collection_id is not null) then
    -- Get the owner and name of the original stack
    select user_id, name into source_owner_id, source_name 
    from public.collections 
    where id = new.source_collection_id;

    if (source_owner_id is not null and source_owner_id != new.user_id) then
      -- Get total remix count
      select count(*) into remix_count 
      from public.collections 
      where source_collection_id = new.source_collection_id;

      -- Insert notification
      insert into public.notifications (user_id, type, actor_id, resource_id, message)
      values (
        source_owner_id,
        'remix',
        new.user_id,
        new.source_collection_id,
        'Your stack "' || source_name || '" has been remixed ' || remix_count || ' times!'
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Trigger for remix notification
drop trigger if exists on_stack_remix on public.collections;
create trigger on_stack_remix
  after insert on public.collections
  for each row execute procedure public.handle_stack_remix();
