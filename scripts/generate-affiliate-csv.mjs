import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"'))) val = val.slice(1, -1);
      val = val.replace(/\\n/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) { }
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase
  .from('tools')
  .select('name, slug, website_url, affiliate_url, affiliate_commission_pct, review_count, avg_rating')
  .not('affiliate_url', 'is', null)
  .eq('status', 'published')
  .order('affiliate_commission_pct', { ascending: false });

const signupUrls = {
  'jasper-ai': 'https://jasper.ai/partners',
  'jasper-brand-voice': 'https://jasper.ai/partners',
  'writesonic-ai': 'https://writesonic.getrewardful.com/signup',
  'writesonic': 'https://writesonic.getrewardful.com/signup',
  'notion-ai': 'https://www.notion.com/affiliates',
  'make': 'https://www.make.com/en/affiliate',
  'elevenlabs': 'https://elevenlabs.io/affiliates',
  'elevenlabs-reader': 'https://elevenlabs.io/affiliates',
  'surfer-seo': 'https://surferseo.com/affiliate-program/',
  'semrush-one': 'https://www.semrush.com/affiliate-program/',
  'grammarly': 'https://www.grammarly.com/affiliates',
  'canva': 'https://www.canva.com/affiliates/',
  'zapier': 'https://zapier.com/l/partners',
  'copy-ai': 'https://www.copy.ai/affiliates',
  'synthesia': 'https://www.synthesia.io/affiliate',
  'synthesia-avatar': 'https://www.synthesia.io/affiliate',
  'adobe-firefly': 'https://www.adobe.com/affiliates.html',
  'midjourney': 'No public affiliate program',
  'figma-ai': 'https://www.figma.com/partners/',
  'framer-ai': 'https://www.framer.com/partners/',
  'tidio': 'https://www.tidio.com/affiliate/',
  'freshdesk-freddy': 'https://www.freshworks.com/partners/',
  'intercom-fin': 'https://www.intercom.com/partner-program',
  'zendesk-ai': 'https://www.zendesk.com/partner/',
  'fireflies-ai': 'https://fireflies.ai/affiliates',
  'otter-ai': 'https://otter.ai/affiliates',
  'hootsuite-ai': 'https://www.hootsuite.com/partners',
  'buffer-ai': 'https://buffer.com/affiliate',
  'replit': 'https://replit.com/affiliate',
  'tabnine': 'https://www.tabnine.com/partners',
  'codeium': 'https://codeium.com/partners',
  'lovable': 'https://lovable.dev/affiliates',
  'adcreative-ai': 'https://www.adcreative.ai/affiliate',
  'taskade': 'https://www.taskade.com/affiliates',
  'n8n': 'https://n8n.io/affiliates',
  'wordtune': 'https://www.wordtune.com/affiliates',
  'rytr': 'https://rytr.me/affiliate',
  'play-ht': 'https://play.ht/affiliates',
  'invideo-ai': 'https://invideo.io/affiliate',
  'opus-clip': 'https://www.opus.pro/affiliate',
  'lavender': 'https://www.lavender.ai/partners',
  'heygen': 'https://www.heygen.com/affiliate',
  'predis-ai': 'https://predis.ai/affiliate',
  'lindy': 'https://www.lindy.ai/affiliates',
  'bardeen': 'https://www.bardeen.ai/affiliates',
  'relevance-ai': 'https://relevanceai.com/partners',
  'cursor-editor': 'No public affiliate program',
  'perplexity-ai': 'No public affiliate program',
  'poe': 'No public affiliate program',
  'character-ai': 'No public affiliate program',
  'phind': 'No public affiliate program',
  'suno': 'No public affiliate program',
  'udio': 'No public affiliate program',
  'duolingo-max': 'No public affiliate program',
};

let csv = 'Tool Name,Commission %,Popularity (reviews),Signup URL,Website,Priority,Status\n';

for (const tool of data) {
  const signup = signupUrls[tool.slug] || tool.website_url + '/affiliates';
  const hasPublicProgram = !signup.includes('No public');
  const priority = tool.affiliate_commission_pct >= 30 ? 'HIGH'
    : tool.affiliate_commission_pct >= 22 ? 'MEDIUM'
    : 'NORMAL';
  const name = tool.name.replace(/,/g, ' ');
  csv += `"${name}",${tool.affiliate_commission_pct}%,${tool.review_count || 0},"${signup}","${tool.website_url}",${priority},${hasPublicProgram ? 'SIGN UP' : 'NO PROGRAM'}\n`;
}

const outPath = join(ROOT, '..', 'aipowerstacks-affiliate-signups.csv');
writeFileSync(outPath, csv);
console.log(`Written ${data.length} rows to ${outPath}`);
