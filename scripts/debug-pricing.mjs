import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
for (const l of raw.split('\n')) { const eq = l.indexOf('='); if (eq > 0) process.env[l.slice(0,eq).trim()] = l.slice(eq+1).trim(); }

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchText(url) {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(jinaUrl, { signal: ctrl.signal, headers: { 'Accept': 'text/plain' } });
    console.log('  Jina status:', res.status, jinaUrl);
    if (!res.ok) return null;
    const text = await res.text();
    console.log('  Text length:', text.length);
    console.log('  Preview:', text.slice(0, 300));
    return text.slice(0, 6000);
  } catch(e) {
    console.log('  Fetch error:', e.message);
    return null;
  }
}

// Test with Ruminate
const url = 'https://tryruminate.com';
console.log('Testing:', url);
let text = await fetchText(url + '/pricing');
if (!text || text.length < 200) { console.log('Falling back to homepage'); text = await fetchText(url); }

if (text) {
  const prompt = `You are classifying the pricing model of an AI tool called "Ruminate".
Here is text scraped from its website:
---
${text}
---
Classify pricing as EXACTLY ONE of: free, freemium, paid, trial, contact, unknown
Also write a short pricing_details string (max 80 chars).
Respond ONLY in this JSON format: {"model":"freemium","details":"Free tier; Pro from $12/mo"}`;

  const msg = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  });
  console.log('\nClaude raw response:', JSON.stringify(msg.content[0].text));
}
