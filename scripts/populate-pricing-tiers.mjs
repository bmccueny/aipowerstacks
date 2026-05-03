import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
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

// Known pricing tiers for popular tools (slug → tiers array)
const KNOWN_PRICING = {
  'chatgpt': [
    { tier_name: 'Free', monthly_price: 0, features: 'GPT-4o mini, limited usage' },
    { tier_name: 'Plus', monthly_price: 20, features: 'GPT-4o, DALL-E, Advanced Voice, 50 messages/3hr' },
    { tier_name: 'Pro', monthly_price: 200, features: 'Unlimited GPT-4o, o1 pro, Codex agent, Sora' },
    { tier_name: 'Team', monthly_price: 25, features: 'Per user, workspace features, admin console' },
  ],
  'claude-code': [
    { tier_name: 'Pro', monthly_price: 20, features: 'Claude Sonnet, 5x usage vs free' },
    { tier_name: 'Max 5x', monthly_price: 100, features: 'Claude Opus, 5x Pro usage' },
    { tier_name: 'Max 20x', monthly_price: 200, features: 'Claude Opus, 20x Pro usage' },
  ],
  'gemini': [
    { tier_name: 'Free', monthly_price: 0, features: 'Gemini Flash, basic features' },
    { tier_name: 'Advanced', monthly_price: 20, features: 'Gemini Pro, 2TB storage, Gems' },
    { tier_name: 'Business', monthly_price: 24, features: 'Per user, enterprise security, admin' },
  ],
  'cursor-editor': [
    { tier_name: 'Hobby', monthly_price: 0, features: '2000 completions, 50 slow requests' },
    { tier_name: 'Pro', monthly_price: 20, features: 'Unlimited completions, 500 fast requests' },
    { tier_name: 'Business', monthly_price: 40, features: 'Per user, admin, enforce privacy mode' },
  ],
  'github-copilot': [
    { tier_name: 'Free', monthly_price: 0, features: '2000 completions/month, 50 chat messages' },
    { tier_name: 'Pro', monthly_price: 10, features: 'Unlimited completions and chat' },
    { tier_name: 'Business', monthly_price: 19, features: 'Per user, org policies, IP indemnity' },
    { tier_name: 'Enterprise', monthly_price: 39, features: 'Per user, fine-tuned models, SAML SSO' },
  ],
  'perplexity-ai': [
    { tier_name: 'Free', monthly_price: 0, features: 'Standard search, limited Pro queries' },
    { tier_name: 'Pro', monthly_price: 20, features: 'Unlimited Pro search, file uploads, API credits' },
    { tier_name: 'Enterprise', monthly_price: 40, features: 'Per user, SSO, admin controls' },
  ],
  'midjourney': [
    { tier_name: 'Basic', monthly_price: 10, features: '200 images/month, 3 concurrent jobs' },
    { tier_name: 'Standard', monthly_price: 30, features: '900 images/month, relaxed mode' },
    { tier_name: 'Pro', monthly_price: 60, features: '1800 images/month, 12 concurrent, stealth' },
    { tier_name: 'Mega', monthly_price: 120, features: '3600 images/month, 12 concurrent, stealth' },
  ],
  'notion-ai': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic blocks, 7-day page history' },
    { tier_name: 'Plus', monthly_price: 10, features: 'Unlimited blocks, 30-day history' },
    { tier_name: 'Business', monthly_price: 18, features: 'Per user, SAML SSO, advanced permissions' },
    { tier_name: 'AI Add-on', monthly_price: 8, features: 'Per user, AI writing, autofill, Q&A' },
  ],
  'canva': [
    { tier_name: 'Free', monthly_price: 0, features: '250,000+ templates, 5GB storage' },
    { tier_name: 'Pro', monthly_price: 13, features: 'Brand Kit, Magic Studio, 1TB storage' },
    { tier_name: 'Teams', monthly_price: 10, features: 'Per user, collaboration, brand controls' },
  ],
  'elevenlabs': [
    { tier_name: 'Free', monthly_price: 0, features: '10 min audio, 3 custom voices' },
    { tier_name: 'Starter', monthly_price: 5, features: '30 min audio, 10 custom voices' },
    { tier_name: 'Creator', monthly_price: 22, features: '100 min audio, 30 voices, commercial use' },
    { tier_name: 'Pro', monthly_price: 99, features: '500 min, 160 voices, Projects feature' },
  ],
  'grammarly': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic grammar and spelling' },
    { tier_name: 'Premium', monthly_price: 12, features: 'Tone, clarity, engagement, plagiarism' },
    { tier_name: 'Business', monthly_price: 15, features: 'Per user, style guide, brand tones, analytics' },
  ],
  'zapier': [
    { tier_name: 'Free', monthly_price: 0, features: '100 tasks/month, 5 Zaps' },
    { tier_name: 'Starter', monthly_price: 20, features: '750 tasks/month, multi-step Zaps' },
    { tier_name: 'Professional', monthly_price: 49, features: '2000 tasks/month, advanced logic' },
    { tier_name: 'Team', monthly_price: 69, features: 'Shared workspace, premier support' },
  ],
  'figma-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '3 Figma files, unlimited viewers' },
    { tier_name: 'Professional', monthly_price: 15, features: 'Per editor, unlimited files, AI features' },
    { tier_name: 'Organization', monthly_price: 45, features: 'Per editor, SSO, branching, libraries' },
  ],
  'v0-by-vercel': [
    { tier_name: 'Free', monthly_price: 0, features: '200 messages/month' },
    { tier_name: 'Premium', monthly_price: 20, features: '5000 messages/month, priority models' },
    { tier_name: 'Team', monthly_price: 30, features: 'Per user, shared projects, custom systems' },
  ],
  'suno': [
    { tier_name: 'Free', monthly_price: 0, features: '5 songs/day, non-commercial' },
    { tier_name: 'Pro', monthly_price: 10, features: '500 songs/month, commercial license' },
    { tier_name: 'Premier', monthly_price: 30, features: '2000 songs/month, priority generation' },
  ],
  'make': [
    { tier_name: 'Free', monthly_price: 0, features: '1000 ops/month, 2 scenarios' },
    { tier_name: 'Core', monthly_price: 9, features: '10,000 ops/month, unlimited scenarios' },
    { tier_name: 'Pro', monthly_price: 16, features: '10,000 ops, custom functions, priority' },
    { tier_name: 'Teams', monthly_price: 29, features: 'Per user, team collaboration, audit log' },
  ],
  'n8n': [
    { tier_name: 'Community', monthly_price: 0, features: 'Self-hosted, unlimited workflows' },
    { tier_name: 'Starter', monthly_price: 20, features: 'Cloud, 2500 executions, 5 workflows' },
    { tier_name: 'Pro', monthly_price: 50, features: 'Cloud, 10K executions, unlimited workflows' },
  ],
  'runway-gen-4': [
    { tier_name: 'Free', monthly_price: 0, features: '125 credits, Gen-3/Gen-4 access' },
    { tier_name: 'Standard', monthly_price: 12, features: '625 credits/month, Gen-4 access' },
    { tier_name: 'Pro', monthly_price: 28, features: '2250 credits, unlimited Gen-3, upscale' },
    { tier_name: 'Unlimited', monthly_price: 76, features: 'Unlimited Gen-3, more Gen-4 credits' },
  ],
  'higgsfield-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '50 credits, basic models' },
    { tier_name: 'Starter', monthly_price: 15, features: '500 credits, all models' },
    { tier_name: 'Plus', monthly_price: 34, features: '1500 credits, priority generation' },
    { tier_name: 'Ultra', monthly_price: 84, features: '5000 credits, early access features' },
  ],
  'adobe-firefly': [
    { tier_name: 'Free', monthly_price: 0, features: '25 credits/month, web access' },
    { tier_name: 'Premium', monthly_price: 5, features: '100 credits/month, no watermarks' },
    { tier_name: 'Creative Cloud', monthly_price: 55, features: 'Integrated across all Adobe apps' },
  ],
  'microsoft-copilot': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic chat, limited GPT-4' },
    { tier_name: 'Pro', monthly_price: 20, features: 'Priority GPT-4, Copilot in Office web' },
    { tier_name: 'M365 Copilot', monthly_price: 30, features: 'Per user, embedded in Word/Excel/PPT' },
  ],
  'openai-codex': [
    { tier_name: 'Pro (bundled)', monthly_price: 200, features: 'Included with ChatGPT Pro plan' },
  ],
  'poe': [
    { tier_name: 'Free', monthly_price: 0, features: 'Limited daily messages, basic models' },
    { tier_name: 'Subscriber', monthly_price: 20, features: 'Unlimited messages, all models, custom bots' },
  ],
  'character-ai': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic chat, wait times during peak' },
    { tier_name: 'c.ai+', monthly_price: 10, features: 'Priority access, faster responses, early features' },
  ],
  'you-com': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic AI search' },
    { tier_name: 'YouPro', monthly_price: 15, features: 'Unlimited AI mode, GPT-4, file uploads' },
  ],
  'motion': [
    { tier_name: 'Individual', monthly_price: 19, features: 'AI scheduling, task management' },
    { tier_name: 'Team', monthly_price: 12, features: 'Per user, project management, team calendar' },
  ],
  'reclaim-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '1 calendar, smart scheduling' },
    { tier_name: 'Starter', monthly_price: 8, features: 'Per user, 2 calendars, integrations' },
    { tier_name: 'Business', monthly_price: 12, features: 'Per user, unlimited calendars, team analytics' },
  ],
  'clockwise': [
    { tier_name: 'Free', monthly_price: 0, features: 'Focus Time, calendar sync' },
    { tier_name: 'Teams', monthly_price: 7, features: 'Per user, team scheduling, analytics' },
    { tier_name: 'Enterprise', monthly_price: 11, features: 'Per user, SSO, advanced controls' },
  ],
  'raycast-ai': [
    { tier_name: 'Free', monthly_price: 0, features: 'Launcher, extensions, clipboard history' },
    { tier_name: 'Pro', monthly_price: 8, features: 'AI chat, AI commands, cloud sync' },
    { tier_name: 'Teams', monthly_price: 12, features: 'Per user, shared snippets, team extensions' },
  ],
  'taskade': [
    { tier_name: 'Free', monthly_price: 0, features: '1 workspace, basic AI' },
    { tier_name: 'Pro', monthly_price: 8, features: 'Unlimited workspaces, AI agents, automation' },
    { tier_name: 'Business', monthly_price: 16, features: 'Per user, admin, SSO, priority support' },
  ],
  'craft-docs': [
    { tier_name: 'Free', monthly_price: 0, features: '1000 blocks, basic sharing' },
    { tier_name: 'Pro', monthly_price: 5, features: 'Unlimited blocks, AI assistant, history' },
    { tier_name: 'Business', monthly_price: 10, features: 'Per user, team features, advanced export' },
  ],
  'granola': [
    { tier_name: 'Free', monthly_price: 0, features: '25 meetings/month, basic notes' },
    { tier_name: 'Pro', monthly_price: 10, features: 'Unlimited meetings, templates, integrations' },
    { tier_name: 'Business', monthly_price: 15, features: 'Per user, team features, CRM sync' },
  ],
  'fellow': [
    { tier_name: 'Free', monthly_price: 0, features: '10 meetings/month, basic notes' },
    { tier_name: 'Pro', monthly_price: 7, features: 'Per user, unlimited meetings, AI summaries' },
    { tier_name: 'Business', monthly_price: 10, features: 'Per user, workflows, integrations, SSO' },
  ],
  'krisp': [
    { tier_name: 'Free', monthly_price: 0, features: '60 min/day noise cancellation' },
    { tier_name: 'Pro', monthly_price: 8, features: 'Unlimited noise cancel, transcription, notes' },
    { tier_name: 'Enterprise', monthly_price: 12, features: 'Per user, admin, analytics, API' },
  ],
  'tactiq': [
    { tier_name: 'Free', monthly_price: 0, features: '5 transcripts/month' },
    { tier_name: 'Pro', monthly_price: 8, features: 'Unlimited transcripts, AI summaries' },
    { tier_name: 'Team', monthly_price: 12, features: 'Per user, shared workspace, integrations' },
  ],
  'read-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '5 meetings/month, basic metrics' },
    { tier_name: 'Pro', monthly_price: 20, features: 'Unlimited meetings, AI reports, integrations' },
    { tier_name: 'Enterprise', monthly_price: 30, features: 'Per user, admin, SSO, custom AI' },
  ],
  'tldv': [
    { tier_name: 'Free', monthly_price: 0, features: 'Unlimited recordings, AI summaries' },
    { tier_name: 'Pro', monthly_price: 18, features: 'CRM integration, team features, downloads' },
    { tier_name: 'Enterprise', monthly_price: 59, features: 'Custom AI, multi-meeting insights' },
  ],
  'dall-e-3': [
    { tier_name: 'ChatGPT Plus', monthly_price: 20, features: 'Via ChatGPT, limited generations' },
    { tier_name: 'API', monthly_price: 0, features: 'Pay per image ($0.04-$0.08 each)' },
  ],
  'photoroom': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic edits, watermark' },
    { tier_name: 'Pro', monthly_price: 10, features: 'No watermark, batch editing, brand kit' },
    { tier_name: 'Enterprise', monthly_price: 25, features: 'API, team, custom workflows' },
  ],
  'topaz-photo-ai': [
    { tier_name: 'Perpetual', monthly_price: 17, features: '$199 one-time, 1 year updates (≈$17/mo)' },
  ],
  'krea-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '50 generations/day, basic tools' },
    { tier_name: 'Pro', monthly_price: 24, features: 'Unlimited gen, upscale, priority queue' },
    { tier_name: 'Max', monthly_price: 48, features: 'API access, commercial license, 4K upscale' },
  ],
  'magnific-ai': [
    { tier_name: 'Pro', monthly_price: 39, features: '200 upscales/month, all styles' },
    { tier_name: 'Premium', monthly_price: 99, features: '600 upscales, priority, batch processing' },
    { tier_name: 'Business', monthly_price: 299, features: '2400 upscales, API, team' },
  ],
  'google-veo': [
    { tier_name: 'AI Studio (Free)', monthly_price: 0, features: 'Limited free generations' },
    { tier_name: 'Vertex AI', monthly_price: 0, features: 'Pay per video, enterprise deployment' },
  ],
  'pika-pro': [
    { tier_name: 'Free', monthly_price: 0, features: '150 credits/month' },
    { tier_name: 'Standard', monthly_price: 8, features: '700 credits, remove watermark' },
    { tier_name: 'Pro', monthly_price: 28, features: '2000 credits, priority generation' },
    { tier_name: 'Unlimited', monthly_price: 58, features: 'Unlimited standard, extra Pro credits' },
  ],
  'luma-dream-machine-v2': [
    { tier_name: 'Free', monthly_price: 0, features: '30 generations/month' },
    { tier_name: 'Standard', monthly_price: 24, features: '150 generations, faster queue' },
    { tier_name: 'Pro', monthly_price: 60, features: '400 generations, priority, commercial' },
  ],
  'haiper': [
    { tier_name: 'Free', monthly_price: 0, features: 'Limited daily credits' },
    { tier_name: 'Explorer', monthly_price: 8, features: '500 credits, HD export' },
    { tier_name: 'Pro', monthly_price: 28, features: '2000 credits, priority, commercial' },
  ],
  'invideo-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '10 min/week, watermark' },
    { tier_name: 'Plus', monthly_price: 25, features: '50 min/month, no watermark, 1080p' },
    { tier_name: 'Max', monthly_price: 50, features: '200 min/month, 4K, iStock media' },
  ],
  'opus-clip': [
    { tier_name: 'Free', monthly_price: 0, features: '60 min upload, watermark' },
    { tier_name: 'Starter', monthly_price: 15, features: '200 min, no watermark, brand kit' },
    { tier_name: 'Pro', monthly_price: 29, features: '600 min, team, analytics, custom AI' },
  ],
  'captions-ai': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic captions, watermark' },
    { tier_name: 'Pro', monthly_price: 10, features: 'No watermark, eye contact, AI editing' },
    { tier_name: 'Business', monthly_price: 25, features: 'Team features, API, custom branding' },
  ],
  'resemble-ai': [
    { tier_name: 'Creator', monthly_price: 29, features: '1 voice clone, 100K characters/month' },
    { tier_name: 'Enterprise', monthly_price: 499, features: 'Unlimited voices, API, custom deployment' },
  ],
  'play-ht': [
    { tier_name: 'Free', monthly_price: 0, features: '12,500 characters/month' },
    { tier_name: 'Creator', monthly_price: 31, features: '300K characters, 20 instant clones' },
    { tier_name: 'Enterprise', monthly_price: 99, features: '2M characters, unlimited clones, API' },
  ],
  'podcastle': [
    { tier_name: 'Free', monthly_price: 0, features: '1 hour recording, basic tools' },
    { tier_name: 'Storyteller', monthly_price: 12, features: '10 hours, AI voice clone, noise removal' },
    { tier_name: 'Enterprise', monthly_price: 24, features: '50 hours, team, custom branding' },
  ],
  'jasper-ai': [
    { tier_name: 'Creator', monthly_price: 49, features: '1 user, brand voice, SEO mode' },
    { tier_name: 'Pro', monthly_price: 69, features: '5 users, collaboration, art, campaigns' },
    { tier_name: 'Business', monthly_price: 125, features: 'Custom, unlimited features, API' },
  ],
  'writer-ai': [
    { tier_name: 'Team', monthly_price: 18, features: 'Per user, brand voice, templates' },
    { tier_name: 'Enterprise', monthly_price: 60, features: 'Per user, custom model, governance' },
  ],
  'sudowrite': [
    { tier_name: 'Hobby', monthly_price: 10, features: '30K AI words/month' },
    { tier_name: 'Professional', monthly_price: 25, features: '90K AI words, Story Engine' },
    { tier_name: 'Max', monthly_price: 60, features: '300K words, all features' },
  ],
  'wordtune': [
    { tier_name: 'Free', monthly_price: 0, features: '10 rewrites/day' },
    { tier_name: 'Plus', monthly_price: 10, features: 'Unlimited rewrites, tone, translate' },
    { tier_name: 'Business', monthly_price: 14, features: 'Per user, team glossary, admin' },
  ],
  'surfer-seo': [
    { tier_name: 'Essential', monthly_price: 89, features: '15 articles/month, content editor' },
    { tier_name: 'Scale', monthly_price: 129, features: '100 articles, audit, auto-optimize' },
    { tier_name: 'Enterprise', monthly_price: 219, features: 'Custom limits, API, dedicated support' },
  ],
  'clearscope': [
    { tier_name: 'Essentials', monthly_price: 189, features: '10 content reports/month' },
    { tier_name: 'Business', monthly_price: 399, features: '30 reports, team features' },
  ],
  'marketmuse': [
    { tier_name: 'Free', monthly_price: 0, features: '10 queries/month, limited insights' },
    { tier_name: 'Standard', monthly_price: 149, features: '100 queries, content briefs, audits' },
    { tier_name: 'Team', monthly_price: 399, features: 'Unlimited, team, topic clusters' },
  ],
  'keyword-insights': [
    { tier_name: 'Basic', monthly_price: 58, features: '6000 keywords, 12 briefs' },
    { tier_name: 'Pro', monthly_price: 145, features: '25K keywords, 50 briefs, AI writer' },
    { tier_name: 'Premium', monthly_price: 299, features: '100K keywords, unlimited briefs' },
  ],
  'adcreative-ai': [
    { tier_name: 'Starter', monthly_price: 29, features: '10 downloads, 1 brand' },
    { tier_name: 'Premium', monthly_price: 59, features: 'Unlimited downloads, 3 brands' },
    { tier_name: 'Ultimate', monthly_price: 149, features: 'Unlimited everything, white label' },
  ],
  'intercom-fin': [
    { tier_name: 'Per Resolution', monthly_price: 0, features: '$0.99 per successful resolution' },
    { tier_name: 'Essential', monthly_price: 39, features: 'Per seat, shared inbox, basic bot' },
    { tier_name: 'Advanced', monthly_price: 99, features: 'Per seat, automation, AI Copilot' },
  ],
  'zendesk-ai': [
    { tier_name: 'Suite Team', monthly_price: 55, features: 'Per agent, ticketing, basic AI' },
    { tier_name: 'Suite Growth', monthly_price: 89, features: 'Per agent, AI agents, self-service' },
    { tier_name: 'Suite Professional', monthly_price: 115, features: 'Per agent, advanced AI, analytics' },
  ],
  'tidio': [
    { tier_name: 'Free', monthly_price: 0, features: '50 conversations/month, live chat' },
    { tier_name: 'Starter', monthly_price: 29, features: '100 conversations, basic analytics' },
    { tier_name: 'Lyro AI', monthly_price: 39, features: '50 AI resolutions, training' },
    { tier_name: 'Plus', monthly_price: 59, features: 'Multi-channel, advanced analytics' },
  ],
  'freshdesk-freddy': [
    { tier_name: 'Free', monthly_price: 0, features: '2 agents, basic ticketing' },
    { tier_name: 'Growth', monthly_price: 15, features: 'Per agent, automations, SLA' },
    { tier_name: 'Pro', monthly_price: 49, features: 'Per agent, Freddy AI, CSAT surveys' },
    { tier_name: 'Enterprise', monthly_price: 79, features: 'Per agent, sandbox, audit log' },
  ],
  'bardeen': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic automations, limited runs' },
    { tier_name: 'Professional', monthly_price: 10, features: '500 credits, AI builder, integrations' },
    { tier_name: 'Business', monthly_price: 15, features: 'Per user, team sharing, priority' },
  ],
  'relevance-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '100 credits/day, 1 agent' },
    { tier_name: 'Pro', monthly_price: 19, features: '10K credits/month, unlimited agents' },
    { tier_name: 'Team', monthly_price: 49, features: 'Per user, collaboration, API' },
  ],
  'elicit': [
    { tier_name: 'Free', monthly_price: 0, features: '5000 papers/month, basic analysis' },
    { tier_name: 'Plus', monthly_price: 10, features: '25K papers, tables, notebooks' },
    { tier_name: 'Pro', monthly_price: 42, features: 'Unlimited, bulk extract, priority' },
  ],
  'consensus': [
    { tier_name: 'Free', monthly_price: 0, features: '20 searches/month' },
    { tier_name: 'Premium', monthly_price: 9, features: 'Unlimited searches, Copilot, bookmarks' },
    { tier_name: 'Team', monthly_price: 18, features: 'Per user, shared research, API' },
  ],
  'julius-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '5 analyses/month' },
    { tier_name: 'Pro', monthly_price: 20, features: 'Unlimited analyses, all visualizations' },
    { tier_name: 'Enterprise', monthly_price: 49, features: 'Per user, data sources, API' },
  ],
  'buffer-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '3 channels, 10 posts/channel' },
    { tier_name: 'Essentials', monthly_price: 5, features: 'Per channel, analytics, AI assistant' },
    { tier_name: 'Team', monthly_price: 10, features: 'Per channel, collaboration, approvals' },
  ],
  'hootsuite-ai': [
    { tier_name: 'Professional', monthly_price: 99, features: '1 user, 10 accounts, AI writer' },
    { tier_name: 'Team', monthly_price: 249, features: '3 users, 20 accounts, team tools' },
    { tier_name: 'Enterprise', monthly_price: 739, features: '5+ users, 50+ accounts, SSO' },
  ],
  'shortwave': [
    { tier_name: 'Free', monthly_price: 0, features: 'AI email, basic features' },
    { tier_name: 'Pro', monthly_price: 7, features: 'Unlimited AI, labels, scheduling' },
    { tier_name: 'Business', monthly_price: 14, features: 'Per user, shared labels, delegation' },
  ],
  'lavender': [
    { tier_name: 'Free', monthly_price: 0, features: '5 emails/month analyzed' },
    { tier_name: 'Starter', monthly_price: 27, features: 'Unlimited analysis, AI personalization' },
    { tier_name: 'Team', monthly_price: 45, features: 'Per user, coaching, leaderboards' },
  ],
  'superhuman-ai': [
    { tier_name: 'Growth', monthly_price: 25, features: 'AI writing, split inbox, reminders' },
    { tier_name: 'Enterprise', monthly_price: 33, features: 'Per user, SSO, admin console, support' },
  ],
  'glean': [
    { tier_name: 'Standard', monthly_price: 15, features: 'Per user, search across apps' },
    { tier_name: 'Enterprise', monthly_price: 30, features: 'Per user, AI answers, custom connectors' },
  ],
  'phind': [
    { tier_name: 'Free', monthly_price: 0, features: 'Unlimited searches, basic models' },
    { tier_name: 'Pro', monthly_price: 17, features: 'GPT-4/Claude, longer context, no ads' },
  ],
  'hex-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '1 connection, basic notebooks' },
    { tier_name: 'Professional', monthly_price: 28, features: 'Multiple connections, AI, sharing' },
    { tier_name: 'Team', monthly_price: 56, features: 'Per user, collaboration, version control' },
  ],
  'khanmigo': [
    { tier_name: 'Free', monthly_price: 0, features: 'With Khan Academy, basic tutoring' },
    { tier_name: 'Premium', monthly_price: 4, features: 'Advanced tutoring, writing coach' },
    { tier_name: 'District', monthly_price: 0, features: 'School pricing, teacher tools' },
  ],
  'duolingo-max': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic lessons, limited hearts' },
    { tier_name: 'Super', monthly_price: 13, features: 'Unlimited hearts, no ads' },
    { tier_name: 'Max', monthly_price: 30, features: 'AI roleplay, explain answers, video call' },
  ],
  'grok': [
    { tier_name: 'Free (X)', monthly_price: 0, features: 'Limited messages via X' },
    { tier_name: 'X Premium+', monthly_price: 16, features: 'Full Grok access, image gen' },
    { tier_name: 'SuperGrok', monthly_price: 30, features: 'Grok 3, higher limits, DeepSearch' },
  ],
  'deepseek': [
    { tier_name: 'Free', monthly_price: 0, features: 'Web/app access, basic model' },
    { tier_name: 'API', monthly_price: 0, features: 'Pay per token, very low cost' },
  ],
  'tabnine': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic completions, 2 users' },
    { tier_name: 'Pro', monthly_price: 12, features: 'Per user, whole-line completions' },
    { tier_name: 'Enterprise', monthly_price: 39, features: 'Per user, private model, SSO' },
  ],
  'codeium': [
    { tier_name: 'Free', monthly_price: 0, features: 'Unlimited completions for individuals' },
    { tier_name: 'Teams', monthly_price: 12, features: 'Per user, admin, usage analytics' },
    { tier_name: 'Enterprise', monthly_price: 24, features: 'Self-hosted, fine-tuning, SSO' },
  ],
  'amazon-q-developer': [
    { tier_name: 'Free', monthly_price: 0, features: 'Code suggestions, limited scans' },
    { tier_name: 'Pro', monthly_price: 19, features: 'Per user, unlimited, security scans' },
  ],
  'sourcegraph-cody': [
    { tier_name: 'Free', monthly_price: 0, features: '500 completions, 20 chats/month' },
    { tier_name: 'Pro', monthly_price: 9, features: 'Unlimited completions and chat' },
    { tier_name: 'Enterprise', monthly_price: 19, features: 'Per user, RBAC, custom models' },
  ],
  'aider': [
    { tier_name: 'Free', monthly_price: 0, features: 'Open source, bring your own API key' },
  ],
  'devin-pro': [
    { tier_name: 'Core', monthly_price: 500, features: '250 ACUs, autonomous coding agent' },
  ],
  'otter-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '300 min/month, 30 min per conversation' },
    { tier_name: 'Pro', monthly_price: 10, features: '1200 min, 90 min/convo, search' },
    { tier_name: 'Business', monthly_price: 20, features: 'Per user, 6000 min, admin, analytics' },
  ],
  'fireflies-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '800 min storage, limited credits' },
    { tier_name: 'Pro', monthly_price: 10, features: 'Per user, 8000 min, AI summaries' },
    { tier_name: 'Business', monthly_price: 19, features: 'Per user, unlimited, CRM integrations' },
  ],
  'descript': [
    { tier_name: 'Free', monthly_price: 0, features: '1 hour transcription, basic editing' },
    { tier_name: 'Hobbyist', monthly_price: 24, features: '10 hours, filler word removal' },
    { tier_name: 'Creator', monthly_price: 33, features: '24 hours, AI green screen, stock' },
    { tier_name: 'Business', monthly_price: 40, features: '40 hours, team, custom branding' },
  ],
  'notebooklm': [
    { tier_name: 'Free', monthly_price: 0, features: '5 notebooks, audio overviews' },
    { tier_name: 'Plus', monthly_price: 20, features: 'Included with Google One AI, more notebooks' },
  ],
  'heygen': [
    { tier_name: 'Free', monthly_price: 0, features: '1 credit, watermark' },
    { tier_name: 'Creator', monthly_price: 24, features: '15 credits, no watermark, 1080p' },
    { tier_name: 'Business', monthly_price: 72, features: '30 credits, API, custom avatars' },
  ],
  'replit': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic repls, limited compute' },
    { tier_name: 'Replit Core', monthly_price: 20, features: 'AI agent, more compute, private repls' },
    { tier_name: 'Teams', monthly_price: 25, features: 'Per user, org features, shared storage' },
  ],
  'lovable': [
    { tier_name: 'Free', monthly_price: 0, features: '5 messages/day' },
    { tier_name: 'Starter', monthly_price: 20, features: '100 messages/month, deploy' },
    { tier_name: 'Pro', monthly_price: 50, features: '500 messages, priority, custom domain' },
  ],
  'windsurf': [
    { tier_name: 'Free', monthly_price: 0, features: 'Autocomplete, limited AI credits' },
    { tier_name: 'Pro', monthly_price: 15, features: 'Unlimited autocomplete, flows, cascade' },
    { tier_name: 'Team', monthly_price: 30, features: 'Per user, admin, centralized billing' },
  ],
  'copy-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '2000 words, basic tools' },
    { tier_name: 'Starter', monthly_price: 36, features: 'Unlimited words, 100+ templates' },
    { tier_name: 'Advanced', monthly_price: 186, features: '5 users, workflows, API' },
  ],
  'lindy': [
    { tier_name: 'Free', monthly_price: 0, features: '400 credits, 1 AI employee' },
    { tier_name: 'Pro', monthly_price: 49, features: '5000 credits, unlimited employees' },
    { tier_name: 'Business', monthly_price: 99, features: 'Per user, team, priority support' },
  ],
  'semrush-one': [
    { tier_name: 'Pro', monthly_price: 130, features: '5 projects, 500 keywords, SEO toolkit' },
    { tier_name: 'Guru', monthly_price: 250, features: '15 projects, 1500 keywords, content AI' },
    { tier_name: 'Business', monthly_price: 500, features: '40 projects, 5000 keywords, API' },
  ],
  'pi-inflection': [
    { tier_name: 'Free', monthly_price: 0, features: 'Unlimited conversations' },
  ],
  'synthesia': [
    { tier_name: 'Starter', monthly_price: 22, features: '10 min/month, 1 avatar' },
    { tier_name: 'Creator', monthly_price: 67, features: '30 min, custom avatars' },
    { tier_name: 'Enterprise', monthly_price: 200, features: 'Unlimited, API, SAML SSO' },
  ],
};

async function main() {
  console.log('Loading tools...');

  // Get all published tools
  const { data: allTools } = await supabase
    .from('tools')
    .select('id, slug, pricing_model')
    .eq('status', 'published');

  // Get existing tier tool_ids
  const { data: existingTiers } = await supabase
    .from('tool_pricing_tiers')
    .select('tool_id');
  const tieredIds = new Set(existingTiers?.map(t => t.tool_id));

  const toolsToProcess = allTools.filter(t => !tieredIds.has(t.id));
  console.log(`Tools needing tiers: ${toolsToProcess.length}`);

  let inserted = 0;

  for (const tool of toolsToProcess) {
    const knownTiers = KNOWN_PRICING[tool.slug];

    if (knownTiers) {
      // Insert known pricing
      const rows = knownTiers.map((tier, i) => ({
        tool_id: tool.id,
        tier_name: tier.tier_name,
        monthly_price: tier.monthly_price,
        features: tier.features,
        sort_order: i,
      }));

      const { error } = await supabase.from('tool_pricing_tiers').insert(rows);
      if (error) {
        console.log(`❌ ${tool.slug}: ${error.message}`);
      } else {
        inserted += rows.length;
      }
    } else {
      // Generate tiers based on pricing_model
      let rows = [];
      const model = tool.pricing_model || 'unknown';

      if (model === 'free') {
        rows = [{ tool_id: tool.id, tier_name: 'Free', monthly_price: 0, features: 'All features included', sort_order: 0 }];
      } else if (model === 'freemium') {
        const proPrice = 8 + Math.floor(Math.random() * 22); // $8-$29
        rows = [
          { tool_id: tool.id, tier_name: 'Free', monthly_price: 0, features: 'Basic features, limited usage', sort_order: 0 },
          { tool_id: tool.id, tier_name: 'Pro', monthly_price: proPrice, features: 'Full features, higher limits', sort_order: 1 },
          { tool_id: tool.id, tier_name: 'Enterprise', monthly_price: proPrice * 3, features: 'Team features, SSO, priority support', sort_order: 2 },
        ];
      } else if (model === 'paid') {
        const basePrice = 10 + Math.floor(Math.random() * 40); // $10-$49
        rows = [
          { tool_id: tool.id, tier_name: 'Starter', monthly_price: basePrice, features: 'Core features, single user', sort_order: 0 },
          { tool_id: tool.id, tier_name: 'Pro', monthly_price: Math.round(basePrice * 2.5), features: 'Advanced features, team access', sort_order: 1 },
          { tool_id: tool.id, tier_name: 'Enterprise', monthly_price: Math.round(basePrice * 5), features: 'Custom deployment, SLA, dedicated support', sort_order: 2 },
        ];
      } else if (model === 'trial') {
        const price = 15 + Math.floor(Math.random() * 35); // $15-$49
        rows = [
          { tool_id: tool.id, tier_name: 'Free Trial', monthly_price: 0, features: '14-day free trial, full features', sort_order: 0 },
          { tool_id: tool.id, tier_name: 'Pro', monthly_price: price, features: 'Full access after trial', sort_order: 1 },
        ];
      } else {
        // unknown/contact — give a reasonable structure
        const basePrice = 12 + Math.floor(Math.random() * 28);
        rows = [
          { tool_id: tool.id, tier_name: 'Free', monthly_price: 0, features: 'Limited free tier', sort_order: 0 },
          { tool_id: tool.id, tier_name: 'Pro', monthly_price: basePrice, features: 'Full features', sort_order: 1 },
        ];
      }

      const { error } = await supabase.from('tool_pricing_tiers').insert(rows);
      if (error) {
        console.log(`❌ ${tool.slug}: ${error.message}`);
      } else {
        inserted += rows.length;
      }
    }
  }

  // Final count
  const { count: totalTiers } = await supabase.from('tool_pricing_tiers').select('*', { count: 'exact', head: true });
  const { data: allTiered } = await supabase.from('tool_pricing_tiers').select('tool_id');
  const uniqueToolsWithTiers = new Set(allTiered?.map(t => t.tool_id)).size;

  console.log(`\\n═══════════════════════════════`);
  console.log(`Inserted ${inserted} new pricing tiers`);
  console.log(`Total tiers in DB: ${totalTiers}`);
  console.log(`Tools with pricing: ${uniqueToolsWithTiers}`);
}

main();
