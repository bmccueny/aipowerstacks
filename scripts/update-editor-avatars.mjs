/**
 * update-editor-avatars.mjs
 *
 * Assigns hand-crafted DiceBear pixel-art avatars to all 9 editors.
 * Each avatar uses a unique seed + personality-matched background color,
 * skin tone, hair color, and accessories to create a distinct look.
 *
 * DiceBear pixel-art docs: https://www.dicebear.com/styles/pixel-art/
 * Format: https://api.dicebear.com/9.x/pixel-art/png?seed=X&backgroundColor=X&skinColor=X...
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

// DiceBear skin tone options for reference:
// f9c9b6 (very light) | fdbcb4 (light) | d08b5b (medium) | b16a5b (medium-warm)
// ac6651 (medium-dark) | ae5d29 (warm brown) | 614335 (dark) | fd9841 (golden)

// DiceBear hair color options (hex, without #):
// 2c1b18 (black) | 4a312c (dark brown) | 724133 (brown) | a55728 (auburn)
// b58143 (dirty blonde) | d6b370 (blonde) | e8e1ef (silver/white) | c93305 (red)

const BASE = 'https://api.dicebear.com/9.x/pixel-art/png';

function avatar(seed, bg, skin, hair, extras = '') {
  const params = new URLSearchParams({
    seed,
    backgroundColor: bg,
    skinColor: skin,
    hairColor: hair,
    size: '128',
  });
  return `${BASE}?${params.toString()}${extras}`;
}

const editors = [
  // ── Original 4 ─────────────────────────────────────────────────────────────

  {
    id: 'c131993d-8710-43f9-91ef-fb194d7113c0',
    name: 'Andrew Ng',
    // Academic blue BG, light skin, black hair, glasses
    avatar: avatar('andrew-ng-professor-ai', '1d4ed8', 'f9c9b6', '2c1b18', '&glassesProbability=100'),
  },
  {
    id: '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
    name: 'Cassie Kozyrkov',
    // Deep violet BG, light skin, dark auburn hair
    avatar: avatar('cassie-kozyrkov-decision-science', '6d28d9', 'fdbcb4', 'a55728'),
  },
  {
    id: '8d0cf351-70ee-428c-bc76-164f1ee1b929',
    name: 'Ethan Mollick',
    // Warm amber BG, medium skin, brown hair, hat
    avatar: avatar('ethan-mollick-wharton-ai', 'd97706', 'd08b5b', '724133', '&hatProbability=100'),
  },
  {
    id: '21b72dfb-882c-44ec-afc0-3a7f5391af70',
    name: 'Zain Kahn',
    // Bold emerald BG, warm brown skin, black hair
    avatar: avatar('zain-kahn-superhuman-newsletter', '059669', 'ae5d29', '2c1b18'),
  },

  // ── New 5 ───────────────────────────────────────────────────────────────────

  {
    id: '4cc6e534-b024-4bf4-bd26-c382412e5802',
    name: 'Marcus Thompson',
    // Navy BG, medium-dark skin, dark hair, glasses
    avatar: avatar('marcus-thompson-saas-founder', '1e3a5f', 'b16a5b', '4a312c', '&glassesProbability=100'),
  },
  {
    id: '6e9bf129-5598-4947-9282-c4fe5ed40ef7',
    name: 'Lena Fischer',
    // Rose pink BG, light skin, blonde hair
    avatar: avatar('lena-fischer-ux-designer-berlin', 'be185d', 'f9c9b6', 'd6b370'),
  },
  {
    id: 'be2d6e6d-5ac7-4eed-a37e-1125dd05f964',
    name: 'Aisha Okonkwo',
    // Coral orange BG, dark skin, black hair
    avatar: avatar('aisha-okonkwo-content-marketer', 'ea580c', '614335', '2c1b18'),
  },
  {
    id: '1a089886-3a67-4332-8fc9-849561897b8c',
    name: 'Dev Patel',
    // Dark teal BG, medium skin, dark brown hair, glasses
    avatar: avatar('dev-patel-fullstack-developer', '0f766e', 'd08b5b', '4a312c', '&glassesProbability=100'),
  },
  {
    id: '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8',
    name: 'Sofia Reyes',
    // Warm red BG, medium-warm skin, auburn hair
    avatar: avatar('sofia-reyes-startup-operator', 'b91c1c', 'ac6651', 'a55728'),
  },
];

async function run() {
  await client.connect();
  console.log('Connected.\n');

  for (const ed of editors) {
    try {
      await client.query(
        `UPDATE public.profiles SET avatar_url = $1, updated_at = NOW() WHERE id = $2`,
        [ed.avatar, ed.id]
      );
      console.log(`✅ ${ed.name}`);
      console.log(`   ${ed.avatar}\n`);
    } catch (e) {
      console.log(`❌ ${ed.name}: ${e.message}\n`);
    }
  }

  await client.end();
  console.log('Done.');
}

run().catch(err => { console.error(err); process.exit(1); });
