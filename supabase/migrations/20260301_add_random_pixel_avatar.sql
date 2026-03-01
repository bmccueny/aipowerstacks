-- Migration: Improve handle_new_user for OAuth and add random avatars
-- Date: 2026-03-01

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pixel_avatars text[] := array[
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Felix',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Aneka',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Boo',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Jasper',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Lucky',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Milo',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Oliver',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Oscar',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Simba',
    'https://api.dicebear.com/9.x/pixel-art/svg?seed=Toby'
  ];
  random_avatar text;
  base_username text;
  final_username text;
  counter int := 0;
begin
  -- 1. Pick a random avatar
  random_avatar := pixel_avatars[1 + floor(random() * array_length(pixel_avatars, 1))::int];

  -- 2. Determine base username
  -- Try username from metadata, then full_name, then email local part
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'user'
  );

  -- Clean username: lower case, remove non-alphanumeric
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure it's not too long and not empty
  if length(base_username) > 15 then
    base_username := left(base_username, 15);
  end if;
  if base_username = '' then
    base_username := 'user';
  end if;

  -- 3. Ensure uniqueness
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;

  -- 4. Insert profile
  insert into public.profiles (id, display_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', final_username),
    final_username,
    coalesce(new.raw_user_meta_data->>'avatar_url', random_avatar)
  );
  return new;
end;
$$;
