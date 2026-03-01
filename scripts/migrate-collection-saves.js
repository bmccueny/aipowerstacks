const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database. Adding collection_saves table...');

    const sql = `
      create table if not exists public.collection_saves (
        user_id       uuid not null references auth.users(id) on delete cascade,
        collection_id uuid not null references public.collections(id) on delete cascade,
        created_at    timestamptz not null default now(),
        primary key (user_id, collection_id)
      );

      alter table public.collection_saves enable row level security;

      -- Use DO blocks to avoid errors if policies exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view all collection saves') THEN
          create policy "Users can view all collection saves" on public.collection_saves for select using (true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can save collections') THEN
          create policy "Users can save collections" on public.collection_saves for insert with check (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can unsave collections') THEN
          create policy "Users can unsave collections" on public.collection_saves for delete using (auth.uid() = user_id);
        END IF;
      END $$;

      create index if not exists collection_saves_user_id_idx on public.collection_saves(user_id);
      create index if not exists collection_saves_collection_id_idx on public.collection_saves(collection_id);
    `;

    await client.query(sql);
    console.log('Migration completed successfully! Linked saves table is ready.');

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
