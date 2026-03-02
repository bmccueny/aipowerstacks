import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

const sql = `
create or replace function public.is_staff()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'editor')
  );
$$;

drop policy if exists "blog_posts_admin_manage" on public.blog_posts;
drop policy if exists "blog_posts_staff_manage" on public.blog_posts;
create policy "blog_posts_staff_manage" on public.blog_posts for all using (public.is_staff());

drop policy if exists "blog_cats_admin_manage" on public.blog_categories;
drop policy if exists "blog_cats_staff_manage" on public.blog_categories;
create policy "blog_cats_staff_manage" on public.blog_categories for all using (public.is_staff());
`;

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Successfully updated RLS policies to allow staff (admins + editors) to manage blogs.');
  } catch (err) {
    console.error('Error updating RLS policies:', err);
  } finally {
    await client.end();
  }
}

main();
