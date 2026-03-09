/**
 * create-new-editors.mjs
 * Creates 5 new editor profiles with distinct personalities.
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  const p = join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 1) continue;
    if (!process.env[t.slice(0, eq).trim()])
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
}
loadEnv();

const DB = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';
const client = new Client({ connectionString: process.env.DATABASE_URL || DB });

const editors = [
  {
    id: randomUUID(),
    email: 'marcus.thompson+aitools5@gmail.com',
    fullName: 'Marcus Thompson',
    username: 'marcus_thompson',
    bio: 'Bootstrapped three SaaS products. Now I test AI tools so founders don\'t waste money on the wrong ones.',
    website: 'https://marcusbuilds.com',
    linkedin_url: 'https://linkedin.com/in/marcusthompson',
  },
  {
    id: randomUUID(),
    email: 'lena.fischer+aitools6@gmail.com',
    fullName: 'Lena Fischer',
    username: 'lena_fischer',
    bio: 'UX designer and product strategist based in Berlin. I care about AI that\'s actually usable — and honest about what it can\'t do.',
    website: 'https://lenafischer.design',
    linkedin_url: 'https://linkedin.com/in/lenafischer',
  },
  {
    id: randomUUID(),
    email: 'aisha.okonkwo+aitools7@gmail.com',
    fullName: 'Aisha Okonkwo',
    username: 'aisha_okonkwo',
    bio: 'Content strategist and growth marketer. I use AI tools every day to produce, distribute, and measure content at scale.',
    website: 'https://aishaokonkwo.com',
    linkedin_url: 'https://linkedin.com/in/aishaokonkwo',
  },
  {
    id: randomUUID(),
    email: 'dev.patel+aitools8@gmail.com',
    fullName: 'Dev Patel',
    username: 'dev_patel',
    bio: 'Full-stack developer. I\'ll actually read the docs, test the API, and tell you whether it\'s worth integrating.',
    website: 'https://devpatel.dev',
    github_url: 'https://github.com/devpatel',
  },
  {
    id: randomUUID(),
    email: 'sofia.reyes+aitools9@gmail.com',
    fullName: 'Sofia Reyes',
    username: 'sofia_reyes',
    bio: 'Startup operator turned AI workflow nerd. I\'ve automated more than half of my team\'s recurring tasks — here\'s what actually works.',
    website: 'https://sofiareyes.io',
    linkedin_url: 'https://linkedin.com/in/sofiareyes',
  },
];

async function run() {
  await client.connect();
  console.log('Connected.\n');

  for (const ed of editors) {
    try {
      // 1. Insert into auth.users
      await client.query(`
        INSERT INTO auth.users (
          id, instance_id, aud, role, email,
          encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at, is_sso_user, is_anonymous
        ) VALUES (
          $1,
          '00000000-0000-0000-0000-000000000000',
          'authenticated', 'authenticated',
          $2,
          '', NOW(),
          '{"provider":"email","providers":["email"]}',
          $3,
          NOW(), NOW(), false, false
        )
        ON CONFLICT (id) DO NOTHING
      `, [ed.id, ed.email, JSON.stringify({ full_name: ed.fullName, email_verified: true })]);

      // 2. Insert into public.profiles
      await client.query(`
        INSERT INTO public.profiles (
          id, username, display_name, bio, website,
          role, avatar_url, linkedin_url, github_url,
          social_links, reputation_score, is_identity_verified,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          'editor',
          $6,
          $7, $8,
          '{}', 100, true,
          NOW(), NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `, [
        ed.id,
        ed.username,
        ed.fullName,
        ed.bio,
        ed.website,
        `https://api.dicebear.com/9.x/pixel-art/png?seed=${ed.fullName.replace(' ', '')}`,
        ed.linkedin_url || null,
        ed.github_url || null,
      ]);

      console.log(`✅ Created: ${ed.fullName} (${ed.id})`);
    } catch (e) {
      console.log(`❌ Failed: ${ed.fullName}: ${e.message}`);
    }
  }

  // Print IDs for memory file
  console.log('\n── UUIDs ──');
  for (const ed of editors) console.log(`${ed.fullName}: ${ed.id}`);

  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
