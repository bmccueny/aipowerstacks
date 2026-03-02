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

async function fetchPage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractExactPrice(html) {
  if (!html) return null;
  
  const text = html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ');
  
  // Try to find the most likely pricing candidate
  // Matches: $19, $19.99, 19 USD, 500 credits, £15, €20
  const matches = text.match(/((\$|£|€)\s*\d+(\.\d{2})?|(\d+(\.\d{2})?)\s*(USD|EUR|GBP|credits))(\s*(\/mo|per month|per user|yearly|\/yr|billed yearly|monthly))?/gi);
  
  if (!matches) return null;

  // Filter out very small numbers (likely not main price) and $0
  const validPrices = matches.filter(m => {
    const num = parseFloat(m.replace(/[^0-9.]/g, ''));
    return num > 0.5 && num < 10000; // Skip tiny numbers and clearly wrong ones
  });

  return validPrices.length > 0 ? `From ${validPrices[0].trim()}` : null;
}

async function scan() {
  const dbUrl = getDatabaseUrl();
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    
    // Target tools that need details
    const res = await client.query(`
      SELECT id, name, website_url 
      FROM public.tools 
      WHERE pricing_model IN ('paid', 'freemium', 'trial') 
      AND (pricing_details IS NULL OR pricing_details = 'N/A' OR pricing_details = '')
      LIMIT 100
    `);
    const tools = res.rows;
    
    console.log(`Scanning ${tools.length} tools for exact pricing...`);

    for (const tool of tools) {
      console.log(`- ${tool.name} (${tool.website_url})`);
      
      // Always try /pricing first for accuracy
      const pricingUrl = tool.website_url.replace(/\/$/, '') + '/pricing';
      let html = await fetchPage(pricingUrl);
      
      if (!html) {
        html = await fetchPage(tool.website_url);
      }

      const price = extractExactPrice(html);
      if (price) {
        console.log(`  FOUND: ${price}`);
        await client.query(
          'UPDATE public.tools SET pricing_details = $1, updated_at = NOW() WHERE id = $2',
          [price, tool.id]
        );
      } else {
        console.log('  NOT FOUND');
      }
      
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('Batch scan complete.');
  } catch (err) { console.error(err); } finally { await client.end(); }
}

scan();
