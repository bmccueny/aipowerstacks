import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    const lines = raw.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) { }
}
loadEnv();

const connectionString = process.env.DATABASE_URL;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function getExistingDomains(client) {
  const res = await client.query("SELECT website_url FROM public.tools");
  const domains = new Set();
  for (const r of res.rows) {
    try {
      const d = new URL(r.website_url).hostname.replace('www.', '');
      domains.add(d);
    } catch (e) { }
  }
  return domains;
}

async function scrapePage(pageNum) {
  const url = 'https://www.futurepedia.io/new';
  console.log('Scraping ' + url + '...');
  
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error('Failed to fetch page: ' + res.statusText);
  
  const html = await res.text();
  const $ = cheerio.load(html);
  const tools = [];

  $('a[href^="/tool/"]').each((i, el) => {
    const name = $(el).find('h3').text().trim() || $(el).find('h2').text().trim();
    const tagline = $(el).closest('div').find('p').first().text().trim();
    const internalLink = $(el).attr('href');
    
    if (name && internalLink) {
        tools.push({
            name: name,
            tagline: tagline,
            internalLink: 'https://www.futurepedia.io' + internalLink
        });
    }
  });

  return tools;
}

async function getRealUrl(internalUrl) {
    try {
        const res = await fetch(internalUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);
        
        let realUrl = null;
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('http') && !href.includes('futurepedia.io') && !href.includes('twitter.com') && !href.includes('facebook.com') && !href.includes('linkedin.com')) {
                realUrl = href;
                return false;
            }
        });
        
        return realUrl || null;
    } catch (e) {
        return null;
    }
}

async function main() {
  const client = new Client({ connectionString: connectionString });
  await client.connect();
  
  const existingDomains = await getExistingDomains(client);
  const allNewTools = [];
  
  const tools = await scrapePage(1);
  console.log('Found ' + tools.length + ' candidates on Futurepedia');
  
  const limit = 20;
  let count = 0;

  for (const tool of tools) {
    if (count >= limit) break;
    
    const realUrl = await getRealUrl(tool.internalLink);
    if (!realUrl) continue;
    
    try {
        const urlObj = new URL(realUrl);
        const domain = urlObj.hostname.replace('www.', '');
        if (existingDomains.has(domain)) continue;
        
        const logo_url = 'https://www.google.com/s2/favicons?domain=' + urlObj.hostname + '&sz=128';
        const slug = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        allNewTools.push({
            name: tool.name,
            website_url: realUrl,
            tagline: tool.tagline,
            logo_url: logo_url,
            slug: slug
        });
        console.log('  + Found NEW tool: ' + tool.name + ' -> ' + realUrl);
        existingDomains.add(domain);
        count++;
    } catch (e) { }
  }

  if (allNewTools.length > 0) {
    console.log('Inserting ' + allNewTools.length + ' new tools...');
    for (const t of allNewTools) {
      try {
        await client.query(
          "INSERT INTO public.tools (name, website_url, tagline, logo_url, slug, status, category_id, description) VALUES ($1, $2, $3, $4, $5, 'draft', '6d289a7f-ea6b-4e85-ad69-099f2bfb5439', $3) ON CONFLICT (website_url) DO NOTHING",
          [t.name, t.website_url, t.tagline, t.logo_url, t.slug]
        );
      } catch (e) {
        if (e.code !== '23505') console.error('Failed to insert ' + t.name + ':', e.message);
      }
    }
  } else {
    console.log('No new tools found.');
  }
  
  await client.end();
}

main().catch(console.error);
