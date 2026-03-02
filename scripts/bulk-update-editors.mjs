import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';

const updates = [
  { id: 'db388dbe-ce6a-4bc3-876d-793e4ce37904', name: 'Pete Huang', username: 'petehuang', avatar: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Pete&size=256' },
  { id: 'c131993d-8710-43f9-91ef-fb194d7113c0', name: 'Andrew Ng', username: 'andrewng', avatar: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Andrew&size=256' },
  { id: '21b72dfb-882c-44ec-afc0-3a7f5391af70', name: 'Zain Kahn', username: 'zainkahn', avatar: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Zain&size=256' },
  { id: '8d0cf351-70ee-428c-bc76-164f1ee1b929', name: 'Ethan Mollick', username: 'ethanmollick', avatar: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Ethan&size=256' },
  { id: 'a6b778a3-1bf6-4530-8ac9-3ebb5dedf16e', name: 'Simon Willison', username: 'simonwillison', avatar: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Simon&size=256' },
  { id: '54cd616d-c866-4f41-8ec9-f6cd57190b4a', name: 'Cassie Kozyrkov', username: 'cassiekozyrkov', avatar: 'https://api.dicebear.com/9.x/pixel-art/png?seed=Cassie&size=256' }
];

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const e of updates) {
      await client.query('UPDATE public.profiles SET username = $1, avatar_url = $2 WHERE id = $3', [e.username, e.avatar, e.id]);
      console.log(`Updated ${e.name} -> @${e.username} with pixel avatar`);
    }
  } catch (err) {
    console.error('Error updating editors:', err.message);
  } finally {
    await client.end();
  }
}

main();
