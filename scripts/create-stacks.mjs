import { createClient } from '@supabase/supabase-js'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const adminId = 'a6b778a3-1bf6-4530-8ac9-3ebb5dedf16e'

// Get tool IDs
const { data: tools } = await c.from('tools').select('id, slug, name').eq('status', 'published')
const tm = {}
tools?.forEach(t => { tm[t.slug] = t.id })

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 6)
}

const stacks = [
  {
    name: 'The Solopreneur AI Stack',
    icon: '💼',
    description: 'Everything a one-person business needs to compete with teams 10x their size. Writing, design, automation, and customer management powered by AI.',
    tools: ['chatgpt', 'canva', 'zapier', 'grammarly', 'superhuman', 'notion-ai'],
  },
  {
    name: 'AI Music Producer Kit',
    icon: '🎵',
    description: 'Create professional music from scratch. Generate songs, clone voices, edit audio, and produce podcast-quality content without a studio.',
    tools: ['suno', 'udio', 'elevenlabs-dubbing', 'descript-ai'],
  },
  {
    name: 'Full-Stack Vibe Coder',
    icon: '⚡',
    description: 'Ship apps from idea to production using AI. Describe what you want, get working code, deploy instantly.',
    tools: ['cursor-editor', 'claude-code', 'v0-by-vercel', 'bolt-new', 'replit', 'github-copilot'],
  },
  {
    name: 'AI Research Lab',
    icon: '🔬',
    description: 'Research faster than a team of analysts. Search, synthesize, cite, and organize knowledge from any source.',
    tools: ['perplexity-ai', 'notebooklm', 'chatgpt', 'tavily', 'liner'],
  },
  {
    name: 'Content Creator Powerhouse',
    icon: '📸',
    description: 'Create videos, thumbnails, voiceovers, and written content at scale. The complete creator workflow.',
    tools: ['midjourney-v7', 'descript-ai', 'canva', 'elevenlabs-dubbing', 'chatgpt', 'suno'],
  },
  {
    name: 'AI Design Studio',
    icon: '🎨',
    description: 'Generate images, edit photos, create UI components, and design at the speed of thought.',
    tools: ['midjourney-v7', 'ideogram', 'leonardo-ai', 'canva', 'v0-by-vercel', 'flux2'],
  },
  {
    name: 'Open Source AI Toolkit',
    icon: '🔓',
    description: 'Run everything locally. No API keys, no subscriptions, no data leaving your machine. Complete privacy.',
    tools: ['stability-ai', 'mistral-ai', 'deepseek-v32', 'flux2'],
  },
  {
    name: 'AI Sales Machine',
    icon: '📞',
    description: 'Automate prospecting, draft outreach, record calls, and close deals faster with AI-powered sales tools.',
    tools: ['chatgpt', 'superhuman', 'fireflies-ai', 'jasper-brand-voice', 'zapier'],
  },
  {
    name: 'Meeting-Free Manager',
    icon: '📋',
    description: 'Never take notes again. Record, transcribe, summarize, and extract action items from every meeting automatically.',
    tools: ['fireflies-ai', 'otter-ai', 'voicenotes', 'notion-ai', 'clickup-agents'],
  },
  {
    name: 'AI Film Studio',
    icon: '🎬',
    description: 'Generate cinematic video, add VFX, translate into 40 languages, and create AI avatars for professional productions.',
    tools: ['runway-gen-45', 'pika', 'luma-dream-machine', 'heygen', 'synthesia-avatar', 'elevenlabs-dubbing'],
  },
  {
    name: 'SEO Content Engine',
    icon: '🔍',
    description: 'Research keywords, write optimized content, check grammar, and track rankings. The complete SEO workflow.',
    tools: ['semrush-one', 'chatgpt', 'grammarly', 'perplexity-ai', 'writesonic-ai'],
  },
  {
    name: 'The Code Review Stack',
    icon: '🛡️',
    description: 'Automated code review, AI-assisted debugging, and quality assurance. Ship better code faster.',
    tools: ['coderabbitai-powered-tool-streamlining-code-reviews', 'claude-code', 'cursor-editor', 'github-copilot', 'windsurf'],
  },
]

let created = 0
for (const stack of stacks) {
  // Create collection
  const { data: col, error: colErr } = await c.from('collections').insert({
    user_id: adminId,
    name: stack.name,
    icon: stack.icon,
    description: stack.description,
    is_public: true,
    share_slug: slug(stack.name),
    view_count: Math.floor(Math.random() * 200) + 50,
    save_count: Math.floor(Math.random() * 30) + 5,
  }).select('id').single()

  if (colErr) {
    console.error(`Error creating ${stack.name}:`, colErr.message)
    continue
  }

  // Add tools
  const items = stack.tools
    .filter(s => tm[s])
    .map((s, i) => ({
      collection_id: col.id,
      tool_id: tm[s],
      sort_order: i,
    }))

  if (items.length > 0) {
    const { error: itemErr } = await c.from('collection_items').insert(items)
    if (itemErr) console.error(`  Items error:`, itemErr.message)
  }

  console.log(`${stack.icon} ${stack.name} (${items.length} tools)`)
  created++
}

console.log(`\nCreated ${created} stacks`)
