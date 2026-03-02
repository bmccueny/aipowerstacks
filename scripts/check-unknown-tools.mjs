import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getDatabaseUrl() {
  const envPath = join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(String.fromCharCode(10));
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('DATABASE_URL=')) {
        return line.substring(13).replace(/^['"](.*)['"]$/, '$1');
      }
    }
  }
  return null;
}

async function check() {
  const dbUrl = getDatabaseUrl();
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const res = await client.query("SELECT pricing_model, count(*) FROM public.tools GROUP BY pricing_model");
    console.log('Pricing model counts:', res.rows);
  } catch (err) { console.error(err); } finally { await client.end(); }
}
check();
