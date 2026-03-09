import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getMatchedTools } from '@/lib/supabase/queries/tools'
import { getQueryEmbedding } from '@/lib/ai/embeddings'
import { createAdminClient } from '@/lib/supabase/admin'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Claude: intelligent tool selection ────────────────────────────────────────
// Uses claude-haiku (lowest token cost) with the semantic pool as candidates.
// Falls back to heuristics if the API key is missing or the call fails.
async function selectStackWithClaude(message: string, pool: any[]): Promise<{
  intro: string
  stack: Array<{ id: string; role: string; reason: string }>
}> {
  // Trim tool data to absolute minimum to save input tokens
  const candidates = pool.slice(0, 20).map(t => ({
    id: t.id,
    name: t.name,
    tag: t.tagline || '',
    use: t.use_case || '',
    api: t.has_api ?? false,
    oss: t.is_open_source ?? false,
    price: t.pricing_model || '',
  }))

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    system: `You are an AI tool stack advisor. Given a user's project goal and candidate tools, select the 3-5 most relevant tools. For each, assign a specific role name (3-5 words) tailored to THIS project, and write one sentence explaining why it fits. Respond ONLY with valid JSON: {"intro":"<one sentence framing the stack>","stack":[{"id":"...","role":"...","reason":"..."}]}`,
    messages: [{
      role: 'user',
      content: `Goal: "${message}"\n\nCandidates:\n${JSON.stringify(candidates)}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  // Extract JSON even if Claude wraps it in markdown fences
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in Claude response')
  return JSON.parse(match[0])
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = { label: string; keywords: string[]; description: string }
type StackEntry = { tool: any; role: string; description: string }

// ── Intent Analysis ───────────────────────────────────────────────────────────
function analyzeIntent(message: string) {
  const lower = message.toLowerCase()

  const domainTests: Record<string, RegExp> = {
    mobile:     /\b(ios|android|mobile|iphone|flutter|react native|app store|phone app)\b/,
    code:       /\b(code|coding|app|software|saas|backend|frontend|full.?stack|build.*app|github|devops|ship|deploy)\b/,
    video:      /\b(video|tiktok|youtube|reel|film|edit|animation|motion|clip|short.?form|b-roll|vlog)\b/,
    audio:      /\b(podcast|music|voice|voiceover|audio|sound|song|speech|elevenlabs|suno|udio)\b/,
    image:      /\b(image|photo|art|illustration|generate.*image|midjourney|dalle|flux|stable diffusion|ideogram)\b/,
    writing:    /\b(write|writing|blog|article|copy|copywriting|content|newsletter|essay|book|script)\b/,
    design:     /\b(design|ui|ux|logo|branding|visual|graphic|figma|prototype|wireframe)\b/,
    marketing:  /\b(marketing|seo|ads|growth|audience|social media|viral|email list|lead gen|traffic|campaign)\b/,
    data:       /\b(data|analytics|dashboard|insight|metrics|report|sql|research|analyze|bi|spreadsheet)\b/,
    ai_agent:   /\b(ai agent|chatbot|bot|llm|gpt|claude|rag|embedding|fine.?tun|build.*ai|ai.?powered|foundation model)\b/,
    automation: /\b(automate|workflow|integrate|pipeline|trigger|connect|sync|n8n|zapier|make\.com|no.?code)\b/,
    security:   /\b(secure|security|privacy|gdpr|hipaa|compliance|encrypt|protect|vault|zero trust)\b/,
    ecommerce:  /\b(ecommerce|e-commerce|shop|store|sell|shopify|checkout|woocommerce|product listing)\b/,
  }

  const domains = Object.entries(domainTests)
    .filter(([, rx]) => rx.test(lower))
    .map(([d]) => d)

  const priority = ['ai_agent', 'mobile', 'code', 'video', 'audio', 'image', 'writing', 'design', 'marketing', 'ecommerce', 'data', 'automation', 'security']
  const primaryDomain = priority.find(d => domains.includes(d)) ?? domains[0] ?? 'general'

  const hints = {
    needsPrivacy:    /\b(private|privacy|gdpr|hipaa|no training|sensitive|confidential)\b/.test(lower),
    needsAPI:        /\b(api|integrate|programmatic|developer|sdk|endpoint|webhook)\b/.test(lower),
    needsOpenSource: /\b(open.?source|self.?host|community|oss)\b/.test(lower),
    needsMobile:     /\b(mobile|ios|android|iphone|app)\b/.test(lower),
    isEnterprise:    /\b(enterprise|company|organization|b2b|large scale|corporate|team)\b/.test(lower),
    isViral:         /\b(viral|growth|audience|followers|views|reach|millions|traction)\b/.test(lower),
    needsAnalytics:  /\b(track|analytics|metric|measure|insight|dashboard|monitor)\b/.test(lower),
    needsVoice:      /\b(voice|narrate|voiceover|tts|speech)\b/.test(lower),
    needsAvatar:     /\b(avatar|presenter|talking head|human presenter)\b/.test(lower),
    needsScript:     /\b(script|caption|subtitle|transcript)\b/.test(lower),
  }

  const roles = inferRoles(primaryDomain, domains, hints, lower)
  return { primaryDomain, domains, hints, roles }
}

function inferRoles(primary: string, domains: string[], hints: Record<string, boolean>, lower: string): Role[] {
  const roles: Role[] = []
  const add = (label: string, keywords: string[], description: string) =>
    roles.push({ label, keywords, description })

  switch (primary) {
    case 'mobile':
    case 'code':
      add('Code Assistant', ['code', 'coding', 'developer', 'ide', 'programming', 'debug', 'refactor', 'git', 'github', 'copilot'], 'Your AI pair programmer')
      if (hints.needsMobile || primary === 'mobile')
        add('Mobile Builder', ['mobile', 'ios', 'android', 'app', 'flutter', 'swift', 'kotlin', 'react native', 'expo'], 'Build native mobile experiences')
      if (domains.includes('ai_agent') || /\bai\b|chatbot|agent/.test(lower))
        add('AI / LLM Platform', ['llm', 'model', 'inference', 'gpt', 'claude', 'api', 'embedding', 'foundation', 'ai api'], 'Power the AI layer of your app')
      if (domains.includes('design'))
        add('Design Tool', ['design', 'ui', 'ux', 'prototype', 'figma', 'component', 'interface', 'wireframe', 'mockup'], 'Design your UI/UX')
      if (domains.includes('automation') || hints.needsAPI)
        add('Automation / CI', ['automation', 'workflow', 'api', 'deploy', 'pipeline', 'ci', 'cd', 'webhook', 'devops', 'infra'], 'Ship and integrate faster')
      if (hints.needsAnalytics)
        add('Monitoring', ['monitor', 'log', 'error', 'track', 'alert', 'observ', 'apm', 'debug', 'crash'], 'Catch errors before users do')
      if (hints.isEnterprise || hints.needsPrivacy)
        add('Security & Compliance', ['security', 'privacy', 'compliance', 'sso', 'auth', 'gdpr', 'encrypt', 'vault', 'zero trust'], 'Enterprise-grade protection')
      break

    case 'ai_agent':
      add('LLM / Foundation Model', ['llm', 'model', 'gpt', 'claude', 'inference', 'api', 'ai', 'foundation', 'openai', 'anthropic'], 'The intelligence core of your agent')
      add('Agent Orchestration', ['agent', 'workflow', 'automation', 'pipeline', 'orchestrat', 'chain', 'n8n', 'langchain', 'multi-agent', 'agentic'], 'Chain tasks and run complex logic')
      add('Knowledge & RAG', ['rag', 'knowledge', 'embedding', 'search', 'retrieval', 'vector', 'document', 'wiki', 'index', 'memory'], 'Ground your agent with real data')
      if (hints.isEnterprise || hints.needsPrivacy)
        add('Compliance & Safety', ['security', 'privacy', 'compliance', 'sso', 'audit', 'gdpr', 'protect', 'guardrail', 'policy'], 'Responsible AI with guardrails')
      if (hints.needsAnalytics)
        add('Observability', ['monitor', 'log', 'trace', 'metric', 'evaluate', 'benchmark', 'test', 'evals', 'hallucin'], 'Monitor accuracy and behavior')
      break

    case 'video':
      add('Video Creator', ['video', 'edit', 'clip', 'motion', 'animation', 'render', 'cut', 'effect', 'capcut', 'premiere', 'runwayml'], 'Core video production tool')
      if (hints.needsVoice || domains.includes('audio'))
        add('AI Voice & Audio', ['voice', 'audio', 'voiceover', 'speech', 'tts', 'music', 'sound', 'elevenlabs', 'narrator'], 'Professional AI-generated audio')
      if (hints.needsAvatar)
        add('AI Avatar', ['avatar', 'presenter', 'talking head', 'heygen', 'synthesia', 'digital human', 'd-id'], 'Lifelike video presenters')
      if (domains.includes('marketing') || hints.isViral)
        add('Growth & Distribution', ['social', 'schedule', 'distribute', 'viral', 'instagram', 'tiktok', 'youtube', 'post', 'growth', 'publish'], 'Publish and grow your audience')
      if (hints.needsScript || /\bscript|caption|subtitle\b/.test(lower))
        add('Script & Captions', ['script', 'caption', 'subtitle', 'transcript', 'write', 'copy', 'teleprompter'], 'AI scripts and auto-captions')
      break

    case 'audio':
      add('Audio / Music AI', ['audio', 'music', 'sound', 'podcast', 'song', 'beat', 'compose', 'suno', 'udio', 'musicgen', 'udio'], 'Core audio creation engine')
      add('Voice & Narration', ['voice', 'tts', 'speech', 'narrate', 'voiceover', 'elevenlabs', 'clone', 'realistic voice'], 'Realistic AI voice generation')
      if (domains.includes('marketing') || hints.isViral)
        add('Distribution', ['publish', 'podcast', 'distribute', 'spotify', 'rss', 'host', 'audience', 'anchor', 'buzzsprout'], 'Reach listeners everywhere')
      break

    case 'image':
      add('Image Generator', ['image', 'generate', 'midjourney', 'stable diffusion', 'dalle', 'flux', 'art', 'illustration', 'ideogram', 'firefly'], 'Create stunning AI visuals')
      if (domains.includes('design'))
        add('Design & Edit', ['design', 'edit', 'canvas', 'photoshop', 'layer', 'background', 'upscale', 'enhance', 'remove'], 'Edit and refine your creations')
      if (domains.includes('marketing'))
        add('Brand & Marketing', ['brand', 'social', 'ad', 'campaign', 'post', 'template', 'canva', 'asset'], 'Turn visuals into marketing assets')
      break

    case 'writing':
      add('AI Writer', ['write', 'writing', 'copy', 'content', 'blog', 'article', 'essay', 'draft', 'jasper', 'copy.ai', 'writesonic'], 'Your AI writing powerhouse')
      add('Research & Sources', ['research', 'search', 'source', 'fact', 'cite', 'gather', 'summarize', 'perplexity', 'scholar', 'web search'], 'Find and verify information fast')
      if (domains.includes('marketing') || /\bseo|blog|traffic\b/.test(lower))
        add('SEO & Distribution', ['seo', 'keyword', 'rank', 'traffic', 'distribute', 'social', 'publish', 'surfer', 'ahrefs'], 'Get your content discovered')
      add('Workspace', ['note', 'organize', 'knowledge', 'wiki', 'notion', 'obsidian', 'document', 'workspace', 'outline'], 'Keep research and drafts organized')
      break

    case 'design':
      add('Design Platform', ['design', 'ui', 'ux', 'figma', 'prototype', 'wireframe', 'component', 'interface', 'canvas', 'framer'], 'Core design and prototyping')
      if (domains.includes('image') || /\bimage|asset|icon\b/.test(lower))
        add('AI Image Gen', ['image', 'generate', 'asset', 'illustration', 'icon', 'visual', 'dalle', 'flux', 'midjourney'], 'Generate design assets with AI')
      if (domains.includes('code'))
        add('Design-to-Code', ['code', 'export', 'react', 'css', 'component', 'frontend', 'implement', 'html', 'tailwind'], 'Turn designs into working code')
      if (domains.includes('marketing'))
        add('Brand Assets', ['brand', 'logo', 'identity', 'template', 'social', 'visual', 'style guide'], 'Build a consistent brand identity')
      break

    case 'marketing':
      add('Marketing Platform', ['marketing', 'seo', 'ads', 'growth', 'campaign', 'lead', 'traffic', 'conversion', 'ahrefs', 'semrush'], 'Drive growth and acquire users')
      if (domains.includes('writing') || /\bcopy|content|email\b/.test(lower))
        add('Content & Copy AI', ['copy', 'content', 'write', 'blog', 'ad copy', 'email', 'social post', 'jasper', 'copy.ai'], 'Generate high-converting content')
      add('Analytics & Tracking', ['analytics', 'metric', 'conversion', 'track', 'insight', 'dashboard', 'ab test', 'funnel', 'ga4'], 'Measure what moves the needle')
      if (domains.includes('automation') || /\bsequence|drip|crm\b/.test(lower))
        add('Automation', ['automate', 'email sequence', 'workflow', 'crm', 'drip', 'trigger', 'hubspot', 'mailchimp', 'klaviyo'], 'Run campaigns on autopilot')
      break

    case 'data':
      add('Data Platform', ['data', 'sql', 'database', 'query', 'warehouse', 'etl', 'pipeline', 'bi', 'bigquery', 'snowflake'], 'Core data processing engine')
      add('Research AI', ['research', 'summarize', 'search', 'gather', 'extract', 'nlp', 'parse', 'scrape', 'web search'], 'AI-powered research and synthesis')
      add('Visualization', ['chart', 'dashboard', 'visual', 'report', 'graph', 'plot', 'tableau', 'looker', 'metabase', 'powerbi'], 'Communicate insights clearly')
      if (hints.isEnterprise || hints.needsPrivacy)
        add('Data Governance', ['governance', 'privacy', 'security', 'compliance', 'lineage', 'access', 'catalog', 'gdpr'], 'Keep data safe and compliant')
      break

    case 'ecommerce':
      add('Store & Commerce', ['ecommerce', 'shop', 'store', 'product', 'sell', 'checkout', 'shopify', 'woocommerce', 'inventory'], 'Your core commerce platform')
      add('Marketing & Growth', ['marketing', 'email', 'seo', 'ads', 'customer', 'conversion', 'retention', 'loyalty', 'klaviyo'], 'Drive traffic and increase sales')
      if (domains.includes('writing') || /\bproduct description|listing\b/.test(lower))
        add('Content Generation', ['copy', 'product description', 'write', 'content', 'listing', 'email', 'ad copy'], 'Generate compelling product content')
      add('Analytics', ['analytics', 'revenue', 'conversion', 'funnel', 'customer', 'retention', 'ltv', 'cohort'], 'Understand your customers and revenue')
      break

    case 'automation':
      add('Workflow Automation', ['automation', 'workflow', 'trigger', 'n8n', 'zapier', 'make', 'integrate', 'connect', 'no-code'], 'Core automation and integration engine')
      add('Data Processing', ['data', 'transform', 'parse', 'extract', 'api', 'webhook', 'json', 'csv', 'etl', 'format'], 'Handle data flows between apps')
      if (hints.needsAnalytics)
        add('Monitoring', ['monitor', 'log', 'alert', 'track', 'status', 'error', 'notification', 'uptime', 'ping'], 'Know when automations fail')
      break

    case 'security':
      add('Security Platform', ['security', 'privacy', 'compliance', 'protect', 'secure', 'vault', 'encrypt', 'scan', 'pen test'], 'Core security and compliance layer')
      add('Identity & Access', ['sso', 'auth', 'identity', 'okta', 'saml', 'mfa', 'access control', 'permission', 'rbac'], 'Control who can access what')
      if (domains.includes('data'))
        add('Data Protection', ['data', 'governance', 'gdpr', 'hipaa', 'lineage', 'mask', 'anonymize', 'dataloss'], 'Keep sensitive data safe')
      break

    default:
      // Fallback: use pool ranking directly
      add('Top Pick', [], 'Best match for your goal')
      add('Strong Alternative', [], 'Highly relevant to your project')
      add('Also Recommended', [], 'Complements your stack well')
  }

  return roles.slice(0, 5)
}

// ── Tool Scoring ───────────────────────────────────────────────────────────────
function scoreToolForRole(tool: any, role: Role, poolRank: number): number {
  // Generic roles: score purely by semantic rank
  if (role.keywords.length === 0) return Math.max(0, 100 - poolRank * 10)

  const content = [tool.name, tool.tagline, tool.use_case, tool.description]
    .filter(Boolean).join(' ').toLowerCase()

  const matches = role.keywords.filter(k => content.includes(k)).length
  if (matches === 0) return 0 // Must match at least one keyword for specific roles

  let score = matches * 10
  if (tool.is_supertools) score += 15
  if (tool.is_verified) score += 8
  score += (tool.avg_rating || 0) * 2
  score -= poolRank * 1.5
  return score
}

function buildContextualStack(pool: any[], roles: Role[]): StackEntry[] {
  const used = new Set<string>()
  const stack: StackEntry[] = []

  for (const role of roles) {
    let best: any = null
    let bestScore = 0

    pool.forEach((tool, rank) => {
      if (used.has(tool.id)) return
      const score = scoreToolForRole(tool, role, rank)
      if (score > bestScore) {
        bestScore = score
        best = tool
      }
    })

    if (best) {
      used.add(best.id)
      stack.push({ tool: best, role: role.label, description: role.description })
    }
  }

  // Fill remaining slots with top semantic matches if fewer than 3 were matched
  for (const tool of pool) {
    if (stack.length >= 5) break
    if (!used.has(tool.id)) {
      stack.push({ tool, role: 'Recommended', description: 'Highly relevant to your goal' })
      used.add(tool.id)
    }
  }

  return stack
}

// ── Narrative Builder ──────────────────────────────────────────────────────────
function buildNarrative(message: string, stack: StackEntry[], intent: ReturnType<typeof analyzeIntent>): string {
  const domainLabels: Record<string, string> = {
    code: 'software development', mobile: 'mobile app development',
    video: 'video creation', audio: 'audio production',
    image: 'image generation', writing: 'content writing',
    design: 'design and prototyping', marketing: 'marketing and growth',
    data: 'data and research', ai_agent: 'AI agent development',
    automation: 'workflow automation', security: 'security and compliance',
    ecommerce: 'e-commerce', general: 'your project',
  }

  const domainLabel = domainLabels[intent.primaryDomain] ?? 'your project'
  let narrative = `${stack.length} tools curated for "${message}" — optimized for ${domainLabel}.`

  for (const { tool, role, description } of stack) {
    const highlights: string[] = []
    if (tool.is_verified) highlights.push('verified')
    if (tool.has_api) highlights.push('API-ready')
    if (tool.trains_on_data === false) highlights.push('privacy-first')
    if (tool.pricing_model === 'free' || tool.pricing_model === 'freemium') highlights.push('free to start')
    if (tool.is_open_source) highlights.push('open source')

    const note = highlights.length > 0 ? ` — ${highlights.slice(0, 2).join(', ')}` : ''
    const desc = (tool.tagline || description).replace(/\*\*/g, '')
    narrative += `\n\n**${role}: ${tool.name}**\n${desc}${note}`
  }

  return narrative
}

// ── Wizard Explanation ─────────────────────────────────────────────────────────
function buildWizardExplanation(useCase: string, pricing: string, persona: string, count: number): string {
  const useCaseLabels: Record<string, string> = {
    'content-creation': 'content creation', 'coding': 'software development',
    'video': 'video production', 'marketing': 'business growth', 'research': 'research and data',
  }
  const personaLabels: Record<string, string> = {
    'solo-creator': 'solo creators', 'lean-startup': 'startup teams', 'enterprise-ready': 'enterprise teams',
  }
  const pricingLabel = pricing === 'free' ? 'free tools only' : pricing === 'paid' ? 'paid tools' : 'any budget'
  const domainLabel = useCaseLabels[useCase] || useCase.replace(/-/g, ' ')
  const personaLabel = personaLabels[persona] || persona.replace(/-/g, ' ')
  return `${count} top tools for ${domainLabel}, curated for ${personaLabel} at ${pricingLabel}.`
}

// ── Narrative builder (used by both Claude and fallback paths) ─────────────────
function buildNarrativeFromStack(
  intro: string,
  stack: StackEntry[]
): string {
  let narrative = intro
  for (const { tool, role, description } of stack) {
    const highlights: string[] = []
    if (tool.is_verified) highlights.push('verified')
    if (tool.has_api) highlights.push('API-ready')
    if (tool.trains_on_data === false) highlights.push('privacy-first')
    if (tool.pricing_model === 'free' || tool.pricing_model === 'freemium') highlights.push('free to start')
    if (tool.is_open_source) highlights.push('open source')
    const note = highlights.length > 0 ? ` — ${highlights.slice(0, 2).join(', ')}` : ''
    const desc = (description || tool.tagline || role).replace(/\*\*/g, '')
    narrative += `\n\n**${role}: ${tool.name}**\n${desc}${note}`
  }
  return narrative
}

// ── POST: Chat / Natural Language Mode ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ tools: [], explanation: '' })

    const supabase = createAdminClient()

    // 1. Semantic pool — always runs, cheap local embeddings
    const embedding = await getQueryEmbedding(message)
    const vectorStr = `[${embedding.join(',')}]`

    const { data: pool, error: poolError } = await (supabase as any).rpc('match_tools_semantic', {
      query_embedding: vectorStr,
      match_threshold: 0.1,
      match_count: 30,
    })

    if (poolError) {
      console.error('Semantic search error:', poolError)
    }
    
    // If no semantic results, fall back to popular published tools
    let finalPool = pool
    if (!pool || pool.length === 0) {
      console.log('No semantic matches, falling back to popular tools')
      const { data: fallbackPool } = await supabase
        .from('tools')
        .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, avg_rating, review_count, upvote_count, is_supertools, use_case, description, has_api, is_open_source, trains_on_data')
        .eq('status', 'published')
        .order('upvote_count', { ascending: false })
        .limit(30)
      finalPool = fallbackPool || []
    }

    // 2. Claude path — real AI reasoning over the semantic pool
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { intro, stack: claudeStack } = await selectStackWithClaude(message, finalPool)
        const stack: StackEntry[] = claudeStack
          .map(({ id, role, reason }) => ({
            tool: finalPool.find((t: any) => t.id === id),
            role,
            description: reason,
          }))
          .filter((s): s is StackEntry => Boolean(s.tool))

        if (stack.length >= 2) {
          return NextResponse.json({
            tools: stack.map(s => s.tool),
            explanation: buildNarrativeFromStack(intro, stack),
            roles: stack.map(s => ({ toolId: s.tool.id, role: s.role })),
          })
        }
      } catch (claudeErr: any) {
        // Log and fall through to heuristic fallback
        console.warn('Claude selection failed, using fallback:', claudeErr.message)
      }
    }

    // 3. Heuristic fallback — no API key or Claude failed
    const intent = analyzeIntent(message)
    const stack = buildContextualStack(finalPool, intent.roles)
    const results = stack.length >= 2 ? stack : finalPool.slice(0, 5).map((tool: any) => ({
      tool,
      role: 'Recommended',
      description: tool.tagline || '',
    }))

    return NextResponse.json({
      tools: results.map((s: any) => s.tool),
      explanation: buildNarrative(message, results, intent),
      roles: results.map((s: any) => ({ toolId: s.tool.id, role: s.role })),
    })
  } catch (err: any) {
    console.error('Matchmaker POST error:', err.message)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// ── GET: Guided Wizard Mode ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const useCase = searchParams.get('useCase') || 'content-creation'
  const pricing = (searchParams.get('pricing') as 'free' | 'paid' | 'any') || 'any'
  const persona = searchParams.get('persona') || ''
  const needsApi = searchParams.get('needsApi') === 'true'
  const needsMobile = searchParams.get('needsMobile') === 'true'
  const needsOpenSource = searchParams.get('needsOpenSource') === 'true'
  const needsPrivacy = searchParams.get('needsPrivacy') === 'true'
  const needsSSO = searchParams.get('needsSSO') === 'true'

  try {
    const tools = await getMatchedTools({
      useCase, pricing, persona,
      needsApi, needsMobile, needsOpenSource, needsPrivacy, needsSSO,
      limit: 5,
    })

    return NextResponse.json({
      tools,
      explanation: buildWizardExplanation(useCase, pricing, persona, tools.length),
    })
  } catch (err) {
    console.error('Matchmaker GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}
