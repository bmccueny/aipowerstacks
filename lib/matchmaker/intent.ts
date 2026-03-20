// ── Types ─────────────────────────────────────────────────────────────────────
export type Role = { label: string; keywords: string[]; description: string }

export type IntentHints = {
  needsPrivacy: boolean
  needsAPI: boolean
  needsOpenSource: boolean
  needsMobile: boolean
  isEnterprise: boolean
  isViral: boolean
  needsAnalytics: boolean
  needsVoice: boolean
  needsAvatar: boolean
  needsScript: boolean
}

export type IntentResult = {
  primaryDomain: string
  domains: string[]
  hints: IntentHints
  roles: Role[]
}

// ── Intent Analysis ───────────────────────────────────────────────────────────
export function analyzeIntent(message: string): IntentResult {
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

  const hints: IntentHints = {
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

export function inferRoles(primary: string, domains: string[], hints: IntentHints, lower: string): Role[] {
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
