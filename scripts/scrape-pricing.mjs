import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { readFileSync, existsSync, mkdirSync } from 'fs'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// Tools with known pricing pages to scrape
const PRICING_URLS = {
  'chatgpt': 'https://openai.com/chatgpt/pricing/',
  'claude-code': 'https://www.anthropic.com/pricing',
  'cursor-editor': 'https://www.cursor.com/pricing',
  'midjourney-v7': 'https://www.midjourney.com/account/',
  'github-copilot': 'https://github.com/features/copilot#pricing',
  'perplexity-ai': 'https://www.perplexity.ai/pro',
  'zapier': 'https://zapier.com/pricing',
  'grammarly': 'https://www.grammarly.com/plans',
  'canva': 'https://www.canva.com/pricing/',
  'superhuman': 'https://superhuman.com/pricing',
  'notion-ai': 'https://www.notion.com/pricing',
  'suno': 'https://suno.com/pricing',
  'replit': 'https://replit.com/pricing',
  'windsurf': 'https://windsurf.com/pricing',
  'jasper-brand-voice': 'https://www.jasper.ai/pricing',
  'semrush-one': 'https://www.semrush.com/prices/',
  'heygen': 'https://www.heygen.com/pricing',
  'descript-ai': 'https://www.descript.com/pricing',
  'elevenlabs-dubbing': 'https://elevenlabs.io/pricing',
  'udio': 'https://www.udio.com/pricing',
  'pika': 'https://pika.art/pricing',
  'luma-dream-machine': 'https://lumalabs.ai/pricing',
  'runway-gen-45': 'https://runwayml.com/pricing/',
  'synthesia-avatar': 'https://www.synthesia.io/pricing',
  'ideogram': 'https://ideogram.ai/pricing',
  'leonardo-ai': 'https://leonardo.ai/pricing',
  'copy-ai': 'https://www.copy.ai/pricing',
  'writesonic-ai': 'https://writesonic.com/pricing',
  'fireflies-ai': 'https://fireflies.ai/pricing',
  'otter-ai': 'https://otter.ai/pricing',
  'clickup-agents': 'https://clickup.com/pricing',
  'voicenotes': 'https://voicenotes.com/pricing',
  'bolt-new': 'https://bolt.new/pricing',
  'lovable': 'https://lovable.dev/pricing',
  'v0-by-vercel': 'https://v0.dev/pricing',
  'stability-ai': 'https://stability.ai/pricing',
  'mistral-ai': 'https://mistral.ai/pricing/',
  'tavily': 'https://tavily.com/#pricing',
  'liner': 'https://getliner.com/pricing',
  'decktopus': 'https://www.decktopus.com/pricing',
  'pieces-for-developers': 'https://pieces.app/pricing',
  'notebooklm': null, // Free, no pricing page
  'deepseek-v32': null, // Open source
}

// Known pricing that's hard to scrape (behind logins, dynamic JS, etc.)
const KNOWN_PRICING = {
  'chatgpt': [
    { tier_name: 'Free', monthly_price: 0, features: 'GPT-4o mini, limited GPT-5.3 access' },
    { tier_name: 'Plus', monthly_price: 20, features: 'GPT-5.3, image gen, deep research, voice mode' },
    { tier_name: 'Pro', monthly_price: 200, features: 'Unlimited GPT-5.3, o3-pro, extended thinking' },
  ],
  'claude-code': [
    { tier_name: 'Free', monthly_price: 0, features: 'Claude Sonnet 4.6, limited messages' },
    { tier_name: 'Pro', monthly_price: 20, features: 'Claude Opus 4.6, higher limits, projects' },
    { tier_name: 'Max (5x)', monthly_price: 100, features: '5x Pro usage, extended thinking' },
    { tier_name: 'Max (20x)', monthly_price: 200, features: '20x Pro usage, max context' },
  ],
  'cursor-editor': [
    { tier_name: 'Hobby', monthly_price: 0, features: '2000 completions, 50 premium requests' },
    { tier_name: 'Pro', monthly_price: 20, features: 'Unlimited completions, 500 premium requests' },
    { tier_name: 'Business', monthly_price: 40, features: 'Team features, admin dashboard, SSO' },
  ],
  'midjourney-v7': [
    { tier_name: 'Basic', monthly_price: 10, features: '200 images/month, 3 concurrent jobs' },
    { tier_name: 'Standard', monthly_price: 30, features: '900 images/month, 3 concurrent, relaxed mode' },
    { tier_name: 'Pro', monthly_price: 60, features: '1800 images/month, 12 concurrent, stealth' },
    { tier_name: 'Mega', monthly_price: 120, features: '3600 images/month, 12 concurrent, stealth' },
  ],
  'github-copilot': [
    { tier_name: 'Free', monthly_price: 0, features: '2000 completions/month, Copilot Chat' },
    { tier_name: 'Pro', monthly_price: 10, features: 'Unlimited completions, agent mode' },
    { tier_name: 'Business', monthly_price: 19, features: 'Org management, IP indemnity, SSO' },
    { tier_name: 'Enterprise', monthly_price: 39, features: 'Fine-tuned models, audit logs' },
  ],
  'perplexity-ai': [
    { tier_name: 'Free', monthly_price: 0, features: 'Quick search, 5 Pro searches/day' },
    { tier_name: 'Pro', monthly_price: 20, features: 'Unlimited Pro, file upload, API credits' },
    { tier_name: 'Enterprise', monthly_price: 40, features: 'Team workspace, SSO, admin' },
  ],
  'zapier': [
    { tier_name: 'Free', monthly_price: 0, features: '100 tasks/month, 5 zaps' },
    { tier_name: 'Starter', monthly_price: 20, features: '750 tasks/month, multi-step zaps' },
    { tier_name: 'Professional', monthly_price: 49, features: '2000 tasks, webhooks, paths' },
    { tier_name: 'Team', monthly_price: 69, features: '2000 tasks, shared workspace' },
  ],
  'grammarly': [
    { tier_name: 'Free', monthly_price: 0, features: 'Grammar, spelling, punctuation' },
    { tier_name: 'Premium', monthly_price: 12, features: 'Tone, clarity, AI rewrites' },
    { tier_name: 'Business', monthly_price: 15, features: 'Brand voice, analytics, team' },
  ],
  'canva': [
    { tier_name: 'Free', monthly_price: 0, features: '250K templates, 5GB storage' },
    { tier_name: 'Pro', monthly_price: 13, features: 'Brand kit, bg remover, 1TB storage' },
    { tier_name: 'Teams', monthly_price: 10, features: 'Collaboration, workflow approval' },
  ],
  'superhuman': [
    { tier_name: 'Growth', monthly_price: 25, features: 'AI drafts, snippets, send later' },
    { tier_name: 'Starter', monthly_price: 30, features: 'Split inbox, team features' },
  ],
  'notion-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '10 blocks, basic pages' },
    { tier_name: 'Plus', monthly_price: 10, features: 'Unlimited blocks, file uploads' },
    { tier_name: 'Business', monthly_price: 18, features: 'SAML SSO, advanced permissions' },
    { tier_name: 'AI Add-on', monthly_price: 10, features: 'AI writing, Q&A, autofill (per member add-on)' },
  ],
  'suno': [
    { tier_name: 'Free', monthly_price: 0, features: '50 credits/day, non-commercial' },
    { tier_name: 'Pro', monthly_price: 10, features: '2500 credits/month, commercial use' },
    { tier_name: 'Premier', monthly_price: 30, features: '10000 credits/month, priority' },
  ],
  'replit': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic IDE, limited compute' },
    { tier_name: 'Replit Core', monthly_price: 25, features: 'AI agent, deployments, boosted compute' },
  ],
  'windsurf': [
    { tier_name: 'Free', monthly_price: 0, features: 'Copilot completions, limited Cascade' },
    { tier_name: 'Pro', monthly_price: 15, features: 'Unlimited Cascade, priority models' },
  ],
  'heygen': [
    { tier_name: 'Free', monthly_price: 0, features: '1 credit, 1 instant avatar' },
    { tier_name: 'Creator', monthly_price: 24, features: '15 credits, custom avatars' },
    { tier_name: 'Business', monthly_price: 72, features: '30 credits, API, brand kit' },
  ],
  'elevenlabs-dubbing': [
    { tier_name: 'Free', monthly_price: 0, features: '10K chars/month, 3 voices' },
    { tier_name: 'Starter', monthly_price: 5, features: '30K chars, 10 voices, voice clone' },
    { tier_name: 'Creator', monthly_price: 22, features: '100K chars, 30 voices, projects' },
    { tier_name: 'Pro', monthly_price: 99, features: '500K chars, 160 voices, dubbing' },
  ],
  'descript-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '1 hr transcription, basic editing' },
    { tier_name: 'Hobbyist', monthly_price: 24, features: '10 hrs transcription, filler words' },
    { tier_name: 'Business', monthly_price: 33, features: '30 hrs, green screen, stock media' },
  ],
  'fireflies-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '800 min storage, limited transcripts' },
    { tier_name: 'Pro', monthly_price: 18, features: 'Unlimited transcripts, search, AI summary' },
    { tier_name: 'Business', monthly_price: 29, features: 'CRM integrations, conversation analytics' },
  ],
  'otter-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '300 mins/month, basic transcription' },
    { tier_name: 'Pro', monthly_price: 17, features: '1200 mins, OtterPilot, search' },
    { tier_name: 'Business', monthly_price: 30, features: 'Admin, analytics, API' },
  ],
  'copy-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '2000 words/month, 90+ templates' },
    { tier_name: 'Starter', monthly_price: 49, features: 'Unlimited words, brand voice' },
    { tier_name: 'Advanced', monthly_price: 249, features: 'Workflows, API access, team' },
  ],
  'jasper-brand-voice': [
    { tier_name: 'Creator', monthly_price: 49, features: 'Brand voice, SEO mode' },
    { tier_name: 'Pro', monthly_price: 69, features: 'Campaigns, art, collaboration' },
  ],
  'pika': [
    { tier_name: 'Free', monthly_price: 0, features: '250 credits, watermarked' },
    { tier_name: 'Standard', monthly_price: 10, features: '700 credits, no watermark' },
    { tier_name: 'Pro', monthly_price: 35, features: '2000 credits, 4K upscale' },
    { tier_name: 'Unlimited', monthly_price: 60, features: 'Unlimited generations' },
  ],
  'ideogram': [
    { tier_name: 'Free', monthly_price: 0, features: '25 images/day, slow queue' },
    { tier_name: 'Basic', monthly_price: 8, features: '400 images/month, fast queue' },
    { tier_name: 'Plus', monthly_price: 20, features: '1000 images/month, priority' },
    { tier_name: 'Pro', monthly_price: 60, features: '3000 images/month, API access' },
  ],
  'bolt-new': [
    { tier_name: 'Free', monthly_price: 0, features: 'Limited tokens, basic deployments' },
    { tier_name: 'Pro', monthly_price: 20, features: '10M tokens/month, full deployments' },
    { tier_name: 'Team', monthly_price: 50, features: '25M tokens, collaboration' },
  ],
  'lovable': [
    { tier_name: 'Free', monthly_price: 0, features: '5 app generations' },
    { tier_name: 'Starter', monthly_price: 20, features: '100 generations, custom domain' },
    { tier_name: 'Pro', monthly_price: 50, features: 'Unlimited, priority support' },
  ],
  'v0-by-vercel': [
    { tier_name: 'Free', monthly_price: 0, features: '200 credits, community models' },
    { tier_name: 'Premium', monthly_price: 20, features: '5000 credits, all models' },
    { tier_name: 'Team', monthly_price: 30, features: 'Shared workspace, Figma import' },
  ],
  'notebooklm': [
    { tier_name: 'Free', monthly_price: 0, features: 'All features, no paid tier' },
  ],
  'semrush-one': [
    { tier_name: 'Pro', monthly_price: 130, features: '5 projects, 500 keywords' },
    { tier_name: 'Guru', monthly_price: 250, features: '15 projects, 1500 keywords, content AI' },
    { tier_name: 'Business', monthly_price: 500, features: '40 projects, 5000 keywords, API' },
  ],
  'runway-gen-45': [
    { tier_name: 'Free', monthly_price: 0, features: '125 credits, Gen-3 only' },
    { tier_name: 'Standard', monthly_price: 15, features: '625 credits, Gen-4.5' },
    { tier_name: 'Pro', monthly_price: 35, features: '2250 credits, all models' },
    { tier_name: 'Unlimited', monthly_price: 95, features: 'Unlimited relaxed, priority' },
  ],
  'leonardo-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '150 tokens/day' },
    { tier_name: 'Apprentice', monthly_price: 12, features: '8500 tokens/month, fine-tune' },
    { tier_name: 'Artisan', monthly_price: 30, features: '25000 tokens/month, priority' },
    { tier_name: 'Maestro', monthly_price: 60, features: '60000 tokens/month, API' },
  ],
  'mistral-ai': [
    { tier_name: 'Free (La Plateforme)', monthly_price: 0, features: 'API with rate limits' },
    { tier_name: 'Le Chat Pro', monthly_price: 15, features: 'Higher limits, Mistral Large' },
  ],
  'stability-ai': [
    { tier_name: 'Free (Open Source)', monthly_price: 0, features: 'Run locally, no limits' },
    { tier_name: 'API Starter', monthly_price: 10, features: '1000 credits/month' },
    { tier_name: 'API Pro', monthly_price: 30, features: '3000 credits/month, priority' },
  ],
  'synthesia-avatar': [
    { tier_name: 'Starter', monthly_price: 29, features: '3 videos/month, 100+ avatars' },
    { tier_name: 'Creator', monthly_price: 89, features: '10 videos/month, custom avatar' },
    { tier_name: 'Enterprise', monthly_price: 0, features: 'Custom pricing, API, SSO' },
  ],
  'clickup-agents': [
    { tier_name: 'Free', monthly_price: 0, features: '100MB storage, basic tasks' },
    { tier_name: 'Unlimited', monthly_price: 7, features: 'Unlimited storage, integrations' },
    { tier_name: 'Business', monthly_price: 12, features: 'AI, automations, dashboards' },
  ],
  'writesonic-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '10K words/month, basic templates' },
    { tier_name: 'Individual', monthly_price: 20, features: 'Unlimited words, Chatsonic' },
    { tier_name: 'Team', monthly_price: 49, features: 'Brand voice, collaboration' },
  ],
  'udio': [
    { tier_name: 'Free', monthly_price: 0, features: '10 songs/month' },
    { tier_name: 'Standard', monthly_price: 10, features: '1200 songs/month' },
    { tier_name: 'Pro', monthly_price: 30, features: '4800 songs/month, priority' },
  ],
  'decktopus': [
    { tier_name: 'Free', monthly_price: 0, features: '2 AI presentations' },
    { tier_name: 'Pro AI', monthly_price: 10, features: 'Unlimited AI decks, analytics' },
    { tier_name: 'Business', monthly_price: 36, features: 'Custom branding, team' },
  ],
  'liner': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic search, 5 AI answers/day' },
    { tier_name: 'Pro', monthly_price: 10, features: 'Unlimited AI, PDF highlights' },
  ],
  'tavily': [
    { tier_name: 'Free', monthly_price: 0, features: '1000 API calls/month' },
    { tier_name: 'Starter', monthly_price: 50, features: '10K calls, faster response' },
    { tier_name: 'Scale', monthly_price: 200, features: '50K calls, priority support' },
  ],
  'deepseek-v32': [
    { tier_name: 'Free (Open Source)', monthly_price: 0, features: 'Run locally, no limits' },
    { tier_name: 'API', monthly_price: 0, features: 'Pay per token, very cheap' },
  ],
  'lovo-ai': [
    { tier_name: 'Free', monthly_price: 0, features: '5 minutes/month' },
    { tier_name: 'Creator', monthly_price: 25, features: '2 hours/month, 100+ voices' },
    { tier_name: 'Pro', monthly_price: 48, features: '5 hours/month, voice cloning' },
  ],
  'voicenotes': [
    { tier_name: 'Free', monthly_price: 0, features: 'Basic transcription, 20 notes' },
    { tier_name: 'Plus', monthly_price: 10, features: 'Unlimited notes, AI features' },
  ],
  'luma-dream-machine': [
    { tier_name: 'Free', monthly_price: 0, features: '30 generations/month' },
    { tier_name: 'Standard', monthly_price: 30, features: '120 generations, faster queue' },
    { tier_name: 'Pro', monthly_price: 100, features: '400 generations, priority' },
  ],
  'pieces-for-developers': [
    { tier_name: 'Free', monthly_price: 0, features: 'On-device AI, snippets, plugins' },
    { tier_name: 'Pro', monthly_price: 10, features: 'Cloud models, team features' },
  ],
}

// Insert all tiers
let totalInserted = 0

// Get tool IDs
const { data: tools } = await c.from('tools').select('id, slug').eq('status', 'published')
const toolMap = {}
tools.forEach(t => { toolMap[t.slug] = t.id })

for (const [slug, tiers] of Object.entries(KNOWN_PRICING)) {
  const toolId = toolMap[slug]
  if (!toolId) { console.log(`Missing tool: ${slug}`); continue }

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i]
    const { error } = await c.from('tool_pricing_tiers').upsert({
      tool_id: toolId,
      tier_name: tier.tier_name,
      monthly_price: tier.monthly_price,
      features: tier.features,
      sort_order: i,
    }, { onConflict: 'tool_id,tier_name' })

    if (error) console.error(`  Error ${slug}/${tier.tier_name}: ${error.message}`)
    else totalInserted++
  }
  console.log(`${slug}: ${tiers.length} tiers`)
}

console.log(`\nDone! Inserted ${totalInserted} pricing tiers`)
