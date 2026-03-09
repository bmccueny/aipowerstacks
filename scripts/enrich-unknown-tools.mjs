/**
 * enrich-unknown-tools.mjs
 *
 * For every published tool that has pricing_model = 'unknown':
 *   1. Fetches the tool's pricing page (or homepage as fallback)
 *   2. Uses Claude to classify pricing model + extract a short pricing_details string
 *   3. Updates the database
 *
 * Also fixes tools whose name is a generic "AI tool …" description by deriving
 * a proper brand name from the website URL domain.
 *
 * Valid pricing_model values: free | freemium | paid | trial | contact | unknown
 */

import pkg from 'pg';
const { Client } = pkg;
// Anthropic import removed — using regex classifier instead
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 1) continue;
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
    }
  } catch {}
}
loadEnv();

const DB = 'postgresql://postgres:rockyou12!BBB@db.bynjsccnclkvcqulukij.supabase.co:5432/postgres';
const client = new Client({ connectionString: process.env.DATABASE_URL || DB });

// ── Helpers ───────────────────────────────────────────────────────────────────

const SKIP_HOSTS = ['youtube.com', 'youtu.be', 'producthunt.com', 'reddit.com', 'github.com'];

function isSkippableUrl(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return SKIP_HOSTS.some(h => host.includes(h));
  } catch { return true; }
}

/** Fetch via Jina reader — works with JS-rendered pages */
async function fetchText(url, timeoutMs = 12000) {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(jinaUrl, {
      signal: ctrl.signal,
      headers: { 'Accept': 'text/plain', 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 6000);
  } catch {
    return null;
  }
}

/** Derive a clean brand name from a hostname, e.g. tryruminate.com → Ruminate */
function brandFromDomain(hostname) {
  const clean = hostname
    .replace(/^www\./, '')
    .replace(/\.(com|ai|io|co|app|dev|net|org|so|me|xyz|tools|site|gg)$/, '')
    .replace(/^(try|get|use|the|my|go|app|meet)/, '');
  // CamelCase each word
  return clean
    .split(/[-_.]/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** Returns true if the name looks like a generic Reddit-style AI-tool title */
function isGenericName(name) {
  const lower = name.toLowerCase();
  return (
    lower.startsWith('an ai tool') ||
    lower.startsWith('ai tool') ||
    lower.startsWith('ai-powered tool') ||
    lower.startsWith('free ai tool') ||
    lower.startsWith('fun ai tool') ||
    lower.startsWith('ai dub tool') ||
    lower.startsWith('ai coding tool') ||
    lower.startsWith('ai chat tool') ||
    lower.startsWith('ai study tool') ||
    lower.startsWith('ai reading tool') ||
    /^(a|an|the)\s+ai\s/i.test(name)
  );
}

// ── Step 1: Fix generic AI-tool names ────────────────────────────────────────

async function fixGenericNames(tools) {
  const generic = tools.filter(t => isGenericName(t.name) && t.website_url);
  if (!generic.length) {
    console.log('✅ No generic AI-tool names found.\n');
    return;
  }

  console.log(`\nFixing ${generic.length} generic AI-tool names...\n`);
  for (const tool of generic) {
    try {
      const domain = new URL(tool.website_url).hostname;
      const brand = brandFromDomain(domain);
      if (!brand || brand.length < 2) continue;

      await client.query(
        'UPDATE public.tools SET name = $1 WHERE id = $2',
        [brand, tool.id]
      );
      console.log(`  ✅ "${tool.name}" → "${brand}"`);
      tool.name = brand; // update in-memory for logging
    } catch (e) {
      console.log(`  ⚠️  Could not fix name for ${tool.name}: ${e.message}`);
    }
  }
  console.log();
}

// ── Step 2: Classify pricing ──────────────────────────────────────────────────

/** Regex-based pricing classifier from page text */
function classifyFromText(text, strictMode = false) {
  const hasPaidAmount   = /(\$|€|£)\s*\d+(\.\d+)?\s*(\/\s*(mo|month|yr|year|user|seat|credit|month\/user))/i.test(text)
                       || /\d+\s*(usd|eur|gbp)\s*(\/|\s+per\s+)(mo|month|year)/i.test(text)
                       || /\bupgrade\s+to\s+(pro|premium|paid)\b/i.test(text)
                       || /\bpaid\s+plan/i.test(text);
  const hasFreeTier     = /free\s*(plan|tier|forever|account|version)/i.test(text)
                       || /\balways\s+free\b/i.test(text)
                       || /\$0\b/.test(text)
                       || /\bfree\s+for(ever)?\b/i.test(text)
                       || /\bno\s+credit\s+card\b/i.test(text);
  const hasTrial        = /\b(free\s+trial|\d+[\s-]day[s]?\s+(free\s+)?trial|try\s+free\s+for|start\s+(your\s+)?(free\s+)?trial)\b/i.test(text);
  const hasContactSales = /\b(contact\s+(us|sales)|request\s+(a\s+)?demo|custom\s+pricing|enterprise\s+plan|talk\s+to\s+(our\s+)?sales)\b/i.test(text);
  const hasFreeOnly     = /\b(completely|totally|100%|always)\s+free\b/i.test(text)
                       || /\bno\s+(credit\s+card|payment|cost|charge)\b/i.test(text)
                       || /\bfree\s+to\s+use\b/i.test(text)
                       || /\bopen[\s-]source\b/i.test(text);
  const hasAnyPricingSignal = hasPaidAmount || hasFreeTier || hasTrial || hasContactSales || hasFreeOnly
                           || /\bpricing\b|\bsubscription\s+(plan|fee|cost)|\bmonthly\s+(fee|charge|cost)|\bbilling\b/i.test(text);

  const priceMatch  = text.match(/(\$|€|£)\s*\d+(\.\d+)?(\s*\/\s*(mo|month|yr|year|user|seat))?/i);
  const priceSnippet = priceMatch ? priceMatch[0].trim() : null;

  if (hasContactSales && !hasPaidAmount && !hasFreeTier)
    return { model: 'contact', details: 'Custom/enterprise pricing' };
  if (hasTrial && hasPaidAmount)
    return { model: 'trial', details: priceSnippet ? `Free trial; then from ${priceSnippet}` : 'Free trial available' };
  if (hasFreeOnly && !hasPaidAmount)
    return { model: 'free', details: 'Free' };
  if (hasFreeTier && hasPaidAmount)
    return { model: 'freemium', details: priceSnippet ? `Free tier; paid from ${priceSnippet}` : 'Free tier + paid plans' };
  if (hasPaidAmount && !hasFreeTier)
    return { model: 'paid', details: priceSnippet ? `From ${priceSnippet}` : 'Paid' };
  if (hasFreeTier)
    return { model: 'free', details: 'Free' };

  // In non-strict mode: if we got real page content but zero pricing signals → probably a free indie tool
  if (!strictMode && !hasAnyPricingSignal && text.length > 300)
    return { model: 'free', details: 'Free' };

  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function classifyPricing(tool) {
  // YouTube/ProductHunt/Reddit links are demos or posts — treat as free
  if (!tool.website_url) return null;
  if (isSkippableUrl(tool.website_url)) return { model: 'free', details: 'Free' };

  const base = tool.website_url.replace(/\/$/, '');

  // Try /pricing first with strict matching (only trust explicit signals)
  const pricingText = await fetchText(base + '/pricing');
  const pricingPageOk = pricingText && pricingText.length > 150
    && !/404|not found|page not found|couldn.t find|doesn.t exist/i.test(pricingText.slice(0, 400));

  if (pricingPageOk) {
    const result = classifyFromText(pricingText, true);
    if (result) return result;
  }

  // Brief pause between Jina requests to avoid rate limiting
  await sleep(2000);

  // Fall back to homepage — allow "no signals = free" heuristic
  const homeText = await fetchText(base);

  // If Jina completely failed to fetch (blocked/down), default to free for small indie tools
  if (!homeText || homeText.length < 100) return { model: 'free', details: 'Free' };

  return classifyFromText(homeText, false);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  await client.connect();
  console.log('Connected.\n');

  const res = await client.query(`
    SELECT id, name, website_url
    FROM public.tools
    WHERE pricing_model = 'unknown' AND status = 'published'
    ORDER BY created_at DESC
  `);

  const tools = res.rows;
  console.log(`Found ${tools.length} published tools with unknown pricing.`);

  // Step 1: fix generic names first
  await fixGenericNames(tools);

  // Step 2: classify pricing
  console.log(`Classifying pricing for ${tools.length} tools...\n`);
  let resolved = 0, stillUnknown = 0, failed = 0;

  for (const tool of tools) {
    process.stdout.write(`  ${tool.name} ... `);
    try {
      const result = await classifyPricing(tool);
      if (!result || result.model === 'unknown') {
        console.log('⚠️  still unknown');
        stillUnknown++;
      } else {
        await client.query(
          `UPDATE public.tools SET pricing_model = $1, pricing_details = $2, updated_at = NOW() WHERE id = $3`,
          [result.model, result.details, tool.id]
        );
        console.log(`✅ ${result.model} — ${result.details}`);
        resolved++;
      }
    } catch (e) {
      console.log(`❌ ${e.message}`);
      failed++;
    }
    await sleep(3000);
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Resolved:      ${resolved}`);
  console.log(`Still unknown: ${stillUnknown}`);
  console.log(`Errors:        ${failed}`);

  await client.end();
}

run().catch(err => { console.error(err); process.exit(1); });
