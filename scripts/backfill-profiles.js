const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function backfill() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL not found in .env.local');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database. Backfilling missing profiles...');

    // 1. Find users in auth.users who don't have a profile in public.profiles
    const findMissingSql = `
      SELECT id, email, raw_user_meta_data 
      FROM auth.users 
      WHERE id NOT IN (SELECT id FROM public.profiles)
    `;
    const missingRes = await client.query(findMissingSql);
    const missingUsers = missingRes.rows;

    console.log(`Found ${missingUsers.length} users with missing profiles.`);

    const pixel_avatars = [
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

    for (const user of missingUsers) {
      const random_avatar = pixel_avatars[Math.floor(Math.random() * pixel_avatars.length)];
      
      let base_username = (
        user.raw_user_meta_data?.username || 
        user.raw_user_meta_data?.full_name || 
        user.raw_user_meta_data?.name || 
        user.email.split('@')[0]
      ).toLowerCase().replace(/[^a-z0-9]/g, '');

      if (base_username.length > 15) base_username = base_username.substring(0, 15);
      if (!base_username) base_username = 'user';

      // Find unique username
      let final_username = base_username;
      let counter = 0;
      while (true) {
        const checkRes = await client.query('SELECT 1 FROM public.profiles WHERE username = $1', [final_username]);
        if (checkRes.rows.length === 0) break;
        counter++;
        final_username = base_username + counter;
      }

      const displayName = user.raw_user_meta_data?.full_name || user.raw_user_meta_data?.name || final_username;
      const avatarUrl = user.raw_user_meta_data?.avatar_url || random_avatar;

      await client.query(
        'INSERT INTO public.profiles (id, display_name, username, avatar_url) VALUES ($1, $2, $3, $4)',
        [user.id, displayName, final_username, avatarUrl]
      );
      console.log(`Created profile for ${user.email} (username: ${final_username})`);
    }

    // 2. Also backfill usernames for users who have a profile but username is NULL
    const missingUsernameSql = `
      SELECT p.id, u.email, u.raw_user_meta_data 
      FROM public.profiles p
      JOIN auth.users u ON p.id = u.id
      WHERE p.username IS NULL
    `;
    const missingUsernamesRes = await client.query(missingUsernameSql);
    const usersWithoutUsernames = missingUsernamesRes.rows;

    console.log(`Found ${usersWithoutUsernames.length} users with profiles but no usernames.`);

    for (const user of usersWithoutUsernames) {
      let base_username = (
        user.raw_user_meta_data?.username || 
        user.raw_user_meta_data?.full_name || 
        user.raw_user_meta_data?.name || 
        user.email.split('@')[0]
      ).toLowerCase().replace(/[^a-z0-9]/g, '');

      if (base_username.length > 15) base_username = base_username.substring(0, 15);
      if (!base_username) base_username = 'user';

      let final_username = base_username;
      let counter = 0;
      while (true) {
        const checkRes = await client.query('SELECT 1 FROM public.profiles WHERE username = $1', [final_username]);
        if (checkRes.rows.length === 0) break;
        counter++;
        final_username = base_username + counter;
      }

      await client.query('UPDATE public.profiles SET username = $1 WHERE id = $2', [final_username, user.id]);
      console.log(`Updated username for ${user.email} to ${final_username}`);
    }

    console.log('Backfill completed successfully!');

  } catch (err) {
    console.error('Backfill failed:', err.message);
  } finally {
    await client.end();
  }
}

backfill();
