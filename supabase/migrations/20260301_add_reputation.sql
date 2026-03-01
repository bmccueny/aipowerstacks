-- Migration: Add Curator Reputation and Badges
-- Date: 2026-03-01

alter table public.profiles add column if not exists reputation_score integer default 0;
alter table public.profiles add column if not exists curator_tier text default 'Standard'; -- Standard, Emerging, Pro, Top

-- Function to calculate and update curator reputation
create or replace function public.update_curator_reputation(p_user_id uuid)
returns void as $$
declare
  total_stack_views int;
  total_stack_saves int;
  total_followers int;
  new_score int;
  new_tier text;
begin
  -- 1. Calculate raw score
  -- Each view = 1pt, Each save = 10pts, Each follower = 25pts
  select coalesce(sum(view_count), 0), coalesce(sum(save_count), 0)
  into total_stack_views, total_stack_saves
  from public.collections
  where user_id = p_user_id;

  select count(*) into total_followers
  from public.profile_follows
  where following_id = p_user_id;

  new_score := total_stack_views + (total_stack_saves * 10) + (total_followers * 25);

  -- 2. Determine Tier
  if new_score >= 1000 then
    new_tier := 'Top Curator';
  elsif new_score >= 500 then
    new_tier := 'Pro Curator';
  elsif new_score >= 100 then
    new_tier := 'Emerging Curator';
  else
    new_tier := 'Standard';
  end if;

  -- 3. Update Profile
  update public.profiles
  set 
    reputation_score = new_score,
    curator_tier = new_tier
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- Trigger to update reputation when a stack is viewed or saved
create or replace function public.handle_stack_engagement_change()
returns trigger as $$
begin
  perform public.update_curator_reputation(new.user_id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_stack_engagement on public.collections;
create trigger on_stack_engagement
  after update of view_count, save_count on public.collections
  for each row execute procedure public.handle_stack_engagement_change();

-- Trigger to update reputation when followed
create or replace function public.handle_follow_change()
returns trigger as $$
begin
  -- For both Insert (follow) and Delete (unfollow), we update the person BEING followed
  if (TG_OP = 'INSERT') then
    perform public.update_curator_reputation(new.following_id);
    return new;
  else
    perform public.update_curator_reputation(old.following_id);
    return old;
  end if;
end;
$$ language plpgsql security definer;

drop trigger if exists on_follow_change on public.profile_follows;
create trigger on_follow_change
  after insert or delete on public.profile_follows
  for each row execute procedure public.handle_follow_change();
