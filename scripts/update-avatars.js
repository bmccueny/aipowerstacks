const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateAvatars() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database. Fetching profiles...');

    // Find profiles with no avatar or using the old 7.x DiceBear version
    const profilesRes = await client.query("SELECT id, username FROM public.profiles WHERE avatar_url IS NULL OR avatar_url = '' OR avatar_url LIKE '%dicebear.com/7.x%'");
    const profiles = profilesRes.rows;

    console.log(`Found ${profiles.length} profiles to update.`);

    for (const profile of profiles) {
      // Use latest 9.x styles for better reliability and variety
      const styles = ['avataaars', 'bottts', 'pixel-art', 'lorelei', 'notionists'];
      const style = styles[Math.floor(Math.random() * styles.length)];
      const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${profile.id}`;
      
      await client.query("UPDATE public.profiles SET avatar_url = $1 WHERE id = $2", [avatarUrl, profile.id]);
      console.log(`Updated avatar for ${profile.username || profile.id}`);
    }

    console.log('Avatar updates to 9.x completed successfully!');
  } catch (err) {
    console.error('Update failed:', err.message);
  } finally {
    await client.end();
  }
}

updateAvatars();
