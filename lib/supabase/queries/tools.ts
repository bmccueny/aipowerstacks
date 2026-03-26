import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ToolCardData, ToolSearchResult, ToolWithTags, PricingModel } from '@/lib/types'
import { PAGE_SIZE } from '@/lib/constants'

type SearchToolsArgs = {
  search_query?: string | null
  p_category?: string | null
  p_pricing?: string | null
  p_verified?: boolean | null
  p_use_case?: string | null
  p_team_size?: string | null
  p_integration?: string | null
  p_sort?: string
  p_limit?: number
  p_offset?: number
}

async function rpcSearchTools(supabase: Awaited<ReturnType<typeof createClient>>, args: SearchToolsArgs) {
  const { data, error } = await supabase.rpc('search_tools', args as Record<string, unknown>)
  return { data: data as ToolSearchResult[] | null, error }
}

// ── Semantic search helpers ───────────────────────────────────────────────────

/** Heuristic: does this query look like natural language rather than a keyword? */
function looksLikeNaturalLanguage(q: string): boolean {
  const words = q.trim().split(/\s+/)
  if (words.length < 3) return false

  // Common NL indicators: pronouns, articles, prepositions, question words, verbs
  const nlSignals = /\b(i |i'm|my |me |we |our |need|want|looking|find|help|can|how|what|which|best|recommend|suggest|tool to|app for|app that|something|anything)\b/i
  if (nlSignals.test(q)) return true

  // If 4+ words, likely natural language even without explicit signals
  if (words.length >= 4) return true

  return false
}

// ── Stop words to strip from natural language queries ──────────────────────
const STOP_WORDS = new Set([
  // Pronouns & determiners
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'a', 'an', 'the',
  // Be/have/do verbs
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  // Modals
  'will', 'would', 'could', 'should', 'can', 'may', 'might',
  // Intent verbs (user expressing desire, not describing a tool)
  'need', 'want', 'looking', 'find', 'help', 'get', 'give', 'use', 'using',
  'replace', 'switch', 'try', 'start', 'know', 'think', 'think',
  'write', 'writes', 'run', 'runs', 'work', 'works',
  // Relative/demonstrative
  'that', 'which', 'who', 'whom', 'this', 'these', 'those',
  // Pronouns & prepositions
  'it', 'its', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with',
  'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
  // Conjunctions & adverbs
  'and', 'but', 'or', 'nor', 'not', 'so', 'very', 'really', 'just',
  'than', 'then', 'also', 'some', 'any', 'all', 'most', 'more',
  'much', 'many', 'something', 'anything', 'thing', 'things',
  'like', 'make', 'makes', 'made',
  // Filler / hyperbole
  'way', 'best', 'good', 'great', 'better', 'faster', 'slower',
  'ever', 'never', 'always', 'every', 'still', 'even',
  // Meta words (referring to tools generically)
  'tool', 'tools', 'app', 'apps', 'software', 'platform', 'service',
  'solution', 'product', 'program', 'website', 'site',
  // Request words
  'please', 'recommend', 'suggest', 'show', 'tell',
])

// Words that indicate a specific domain — these are the most important for search
const DOMAIN_SIGNAL_WORDS = new Set([
  'ai', 'code', 'coding', 'video', 'audio', 'image', 'design', 'write', 'writing',
  'seo', 'marketing', 'data', 'api', 'mobile', 'agent', 'chat', 'bot', 'llm',
  'music', 'voice', 'photo', 'edit', 'editing', 'generate', 'automate', 'automation',
  'transcribe', 'transcription', 'translate', 'deploy', 'build', 'prototype',
  'email', 'cms', 'crm', 'erp', 'database', 'sql', 'analytics', 'dashboard',
  'podcast', 'blog', 'content', 'copy', 'copywriting', 'research',
  'security', 'privacy', 'compliance', 'monitor', 'test', 'debug',
  'ecommerce', 'shop', 'store', 'payment', 'checkout',
  'free', 'open-source',
])

// Adjectives/qualifiers that are useful as modifiers but bad as primary search terms
// These get included only when paired with a domain signal word
const MODIFIER_WORDS = new Set([
  'fast', 'speed', 'quick', 'realtime', 'real-time', 'cheap', 'simple',
  'easy', 'powerful', 'advanced', 'smart', 'intelligent', 'modern',
  'lightweight', 'scalable', 'secure', 'enterprise', 'professional',
  'automated', 'instant', 'unlimited', 'accurate', 'creative',
])

/**
 * Local keyword extraction from natural language queries.
 * Strips stop words and filler, preserves domain-signal words and meaningful terms.
 * Modifiers (fast, easy, etc.) are only included when there are domain signals present.
 * Returns cleaned keywords as a string, or null if nothing useful remains.
 *
 * "ai that writes code faster than i can think" → "ai code"
 * "i need a fast coding agent"                  → "coding agent"
 * "help me find a tool to transcribe audio"     → "transcribe audio"
 */
function extractKeywordsLocal(query: string): string | null {
  const words = query.toLowerCase().trim().split(/\s+/)

  // First pass: extract domain signals and other meaningful words
  const domainWords: string[] = []
  const modifierWords: string[] = []
  const otherWords: string[] = []

  for (const w of words) {
    if (DOMAIN_SIGNAL_WORDS.has(w)) {
      domainWords.push(w)
    } else if (MODIFIER_WORDS.has(w)) {
      modifierWords.push(w)
    } else if (!STOP_WORDS.has(w) && w.length >= 3) {
      otherWords.push(w)
    }
  }

  // Build the result: domain words are primary, others are secondary
  // Only include modifiers if we already have domain words (to avoid over-constraining)
  const result = [...domainWords, ...otherWords]

  // If we have enough domain words (2+), skip modifiers to keep the query focused
  // If only 1 domain word, include 1 modifier for context
  if (result.length < 2 && modifierWords.length > 0) {
    result.push(modifierWords[0])
  }

  if (result.length === 0) return null
  return result.join(' ')
}

/**
 * Extract search-friendly keywords from a natural language query.
 * Tries xAI Grok for higher-quality extraction, falls back to local keyword extraction.
 */
async function extractSearchIntent(query: string): Promise<string | null> {
  const localKeywords = extractKeywordsLocal(query)

  // Try xAI Grok for higher-quality extraction if available
  if (process.env.XAI_API_KEY) {
    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini-fast',
          max_tokens: 60,
          temperature: 0,
          messages: [
            { role: 'system', content: 'Extract 3-5 precise search keywords/phrases from the user query that describe what kind of AI tool they want. Return ONLY the keywords separated by commas, nothing else. Focus on the functional intent, ignore filler words and hyperbole.' },
            { role: 'user', content: query },
          ],
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = (data.choices?.[0]?.message?.content ?? '').trim()
        if (text) return text
      }
    } catch {
      // xAI failed, fall through to local keywords
    }
  }

  return localKeywords
}

const TOOL_SELECT_COLUMNS =
  'id, name, slug, tagline, website_url, logo_url, pricing_model, pricing_details, is_verified, avg_rating, review_count, upvote_count, category_id, published_at, screenshot_urls, is_supertools, target_audience, has_api, has_mobile_app, is_open_source, trains_on_data, has_sso, security_certifications, model_provider, use_case, updated_at, deployment_type, time_to_value, not_for'

/**
 * Server-side semantic search using pgvector.
 * Generates an embedding for the query and finds similar tools.
 * Returns null if semantic search is unavailable or returns no results.
 */
async function semanticSearch(
  query: string,
  limit: number
): Promise<ToolSearchResult[] | null> {
  try {
    // Dynamic import to avoid loading the model when not needed
    const { getQueryEmbedding } = await import('@/lib/ai/embeddings')
    const embedding = await getQueryEmbedding(query)
    const vectorStr = `[${embedding.join(',')}]`

    const admin = createAdminClient()
    type SemanticHit = { id: string; similarity: number }
    // pgvector RPC expects a string-encoded vector, not number[]
    const { data: hits, error } = await admin.rpc('match_tools_semantic', {
      query_embedding: vectorStr as unknown as number[],
      match_threshold: 0.15,
      match_count: Math.min(limit, 50),
    })

    if (error || !hits || (hits as SemanticHit[]).length === 0) {
      if (error) console.warn('Semantic search RPC error:', error.message)
      return null
    }

    // Fetch full tool data to match ToolSearchResult shape
    const semanticHits = hits as SemanticHit[]
    const ids = semanticHits.map((h) => h.id)
    const { data: fullTools } = await admin
      .from('tools')
      .select(TOOL_SELECT_COLUMNS)
      .in('id', ids)
      .eq('status', 'published')

    if (!fullTools || fullTools.length === 0) return null

    // Preserve semantic ranking order
    const toolMap = new Map(fullTools.map((t) => [t.id, t]))
    const ordered = ids
      .map((id) => toolMap.get(id))
      .filter(Boolean) as unknown as ToolSearchResult[]

    return ordered.length > 0 ? ordered : null
  } catch (err) {
    console.warn('Semantic search failed:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function searchTools({
  query,
  category,
  pricing,
  verified,
  useCase,
  teamSize,
  integration,
  audience,
  hasApi,
  hasMobile,
  isOpenSource,
  privacyFirst,
  enterpriseReady,
  modelProvider,
  deploymentType,
  source,
  sort = 'relevance',
  page = 1,
}: {
  query?: string
  category?: string
  pricing?: PricingModel
  verified?: boolean
  useCase?: string
  teamSize?: string
  integration?: string
  audience?: string
  hasApi?: boolean
  hasMobile?: boolean
  isOpenSource?: boolean
  privacyFirst?: boolean
  enterpriseReady?: boolean
  modelProvider?: string
  deploymentType?: string
  source?: string
  sort?: string
  page?: number
}): Promise<{ tools: ToolSearchResult[]; total: number }> {
  const supabase = await createClient()
  const offset = (page - 1) * PAGE_SIZE

  let categoryId: string | undefined
  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()
    categoryId = (cat as { id: string } | null)?.id
  }

  // Build a standard query for when persona/capabilities are involved
  let builder = supabase
    .from('tools')
    .select(TOOL_SELECT_COLUMNS)
    .eq('status', 'published')

  // If search query exists, try intent extraction → semantic → RPC → ilike fallback
  if (query) {
    const isNL = looksLikeNaturalLanguage(query)

    // Intent extraction: convert NL to search keywords
    let searchKeywords: string | null = null
    if (isNL) {
      searchKeywords = await extractSearchIntent(query)
    }

    // The effective query for text/semantic search — use extracted keywords if available
    const effectiveQuery = searchKeywords || query

    // ── Tier 0: Semantic search for natural language queries ──────────────
    if (isNL) {
      const semanticResults = await semanticSearch(effectiveQuery, PAGE_SIZE)
      if (semanticResults && semanticResults.length > 0) {
        // Apply client-side filters to semantic results
        let filtered = semanticResults
        type FilterableTool = ToolSearchResult & Record<string, unknown>
        if (categoryId) filtered = filtered.filter(t => (t as FilterableTool).category_id === categoryId)
        if (pricing) filtered = filtered.filter(t => (t as FilterableTool).pricing_model === pricing)
        if (verified) filtered = filtered.filter(t => (t as FilterableTool).is_verified === true)
        if (hasApi) filtered = filtered.filter(t => (t as FilterableTool).has_api === true)
        if (hasMobile) filtered = filtered.filter(t => (t as FilterableTool).has_mobile_app === true)
        if (isOpenSource) filtered = filtered.filter(t => (t as FilterableTool).is_open_source === true)
        if (audience) filtered = filtered.filter(t => (t as FilterableTool).target_audience === audience)
        if (modelProvider) filtered = filtered.filter(t => (t as FilterableTool).model_provider === modelProvider)
        if (deploymentType) filtered = filtered.filter(t => (t as FilterableTool).deployment_type === deploymentType)
        if (source === 'github') filtered = filtered.filter(t => ((t as FilterableTool).website_url as string)?.includes('github.com'))

        if (filtered.length > 0) {
          return { tools: filtered.slice(0, PAGE_SIZE), total: filtered.length }
        }
        // If filters eliminated all semantic results, fall through to text search
      }
    }

    // ── Tier 1: Full-text search via RPC (uses search_vector with A/B/C weighting) ──
    // For NL queries, use extracted keywords for better tsquery matching.
    // If 3+ keywords return 0 results, progressively drop trailing keywords
    // (websearch_to_tsquery requires ALL terms to match, so fewer terms = broader match).
    const rpcQuery = isNL && searchKeywords ? searchKeywords : query
    const rpcKeywords = rpcQuery.split(/\s+/).filter(w => w.length >= 2)

    let rpcData: ToolSearchResult[] | null = null
    let rpcError: { message: string } | null = null

    // Try full query first, then progressively reduce keywords
    for (let len = rpcKeywords.length; len >= Math.min(2, rpcKeywords.length); len--) {
      const attempt = rpcKeywords.slice(0, len).join(' ')
      const { data, error } = await rpcSearchTools(supabase, {
        search_query: attempt || null,
        p_category: categoryId || null,
        p_pricing: pricing || null,
        p_verified: verified ?? null,
        p_use_case: useCase || null,
        p_team_size: teamSize || null,
        p_integration: integration || null,
        p_sort: sort,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      })

      if (error) {
        rpcError = error
        break // RPC itself is broken, skip to fallback
      }

      if (data && data.length > 0) {
        rpcData = data
        break // Found results
      }
    }

    if (rpcData && rpcData.length > 0) {
      return { tools: rpcData, total: rpcData.length }
    }

    if (rpcError) {
      console.warn('search_tools RPC unavailable, falling back to ilike search:', rpcError.message)
    }

    // ── Tier 2: ILIKE fallback — search name, tagline, description ────────
    // For NL queries with extracted keywords, build OR clauses for each keyword
    let ilikeOrClause: string
    if (isNL && searchKeywords) {
      // Split on comma (Claude format) or spaces (local format), take meaningful terms
      const keywords = searchKeywords.includes(',')
        ? searchKeywords.split(',').map(k => k.trim()).filter(Boolean)
        : searchKeywords.split(/\s+/).filter(w => w.length >= 3)

      // Build OR clause: match any keyword in name, tagline, or description
      const clauses = keywords.slice(0, 5).flatMap(k => [
        `name.ilike.%${k}%`,
        `tagline.ilike.%${k}%`,
        `description.ilike.%${k}%`,
      ])
      ilikeOrClause = clauses.join(',')
    } else {
      const term = `%${query}%`
      ilikeOrClause = `name.ilike.${term},tagline.ilike.${term},description.ilike.${term}`
    }

    let fallback = supabase
      .from('tools')
      .select(TOOL_SELECT_COLUMNS)
      .eq('status', 'published')
      .or(ilikeOrClause)

    // Apply ALL filters (fixing previous filter leakage)
    if (categoryId) fallback = fallback.eq('category_id', categoryId)
    if (pricing)    fallback = fallback.eq('pricing_model', pricing)
    if (verified)   fallback = fallback.eq('is_verified', true)
    if (useCase)    fallback = fallback.eq('use_case', useCase)
    if (teamSize)   fallback = fallback.eq('team_size', teamSize)
    if (audience)   fallback = fallback.eq('target_audience', audience)
    if (hasApi)     fallback = fallback.eq('has_api', true)
    if (hasMobile)  fallback = fallback.eq('has_mobile_app', true)
    if (isOpenSource) fallback = fallback.eq('is_open_source', true)
    if (privacyFirst) fallback = fallback.eq('trains_on_data', false)
    if (enterpriseReady) fallback = fallback.eq('has_sso', true)
    if (modelProvider) fallback = fallback.eq('model_provider', modelProvider)
    if (deploymentType) fallback = fallback.eq('deployment_type', deploymentType as 'cloud' | 'self-hosted' | 'both')
    if (source === 'github') fallback = fallback.like('website_url', '%github.com%')

    if (sort === 'rating') {
      fallback = fallback.order('avg_rating', { ascending: false }).order('review_count', { ascending: false })
    } else if (sort === 'newest') {
      fallback = fallback.order('published_at', { ascending: false })
    } else if (sort === 'popular') {
      fallback = fallback.order('upvote_count', { ascending: false })
    } else {
      fallback = fallback.order('is_supertools', { ascending: false }).order('upvote_count', { ascending: false })
    }

    fallback = fallback.range(offset, offset + PAGE_SIZE - 1)

    const { data: fallbackData, error: fallbackError } = await fallback

    if (fallbackError) {
      console.error('searchTools ilike fallback error:', fallbackError)
      return { tools: [], total: 0 }
    }

    // ── Tier 3: If text search found nothing and we haven't tried semantic yet, try it ──
    if ((!fallbackData || fallbackData.length === 0) && !isNL) {
      const semanticResults = await semanticSearch(query, PAGE_SIZE)
      if (semanticResults && semanticResults.length > 0) {
        return { tools: semanticResults.slice(0, PAGE_SIZE), total: semanticResults.length }
      }
    }

    return { tools: (fallbackData ?? []) as unknown as ToolSearchResult[], total: fallbackData?.length ?? 0 }
  }

  // Apply filters
  if (categoryId) builder = builder.eq('category_id', categoryId)
  if (pricing) builder = builder.eq('pricing_model', pricing)
  if (verified) builder = builder.eq('is_verified', true)
  if (useCase) builder = builder.eq('use_case', useCase)
  if (teamSize) builder = builder.eq('team_size', teamSize)
  if (audience) builder = builder.eq('target_audience', audience)
  if (hasApi) builder = builder.eq('has_api', true)
  if (hasMobile) builder = builder.eq('has_mobile_app', true)
  if (isOpenSource) builder = builder.eq('is_open_source', true)
  if (privacyFirst) builder = builder.eq('trains_on_data', false)
  if (enterpriseReady) builder = builder.eq('has_sso', true)
  if (modelProvider) builder = builder.eq('model_provider', modelProvider)
  if (deploymentType) builder = builder.eq('deployment_type', deploymentType as 'cloud' | 'self-hosted' | 'both')
  if (source === 'github') builder = builder.like('website_url', '%github.com%')

  // Sort
  if (sort === 'rating') {
    builder = builder.order('avg_rating', { ascending: false }).order('review_count', { ascending: false })
  } else if (sort === 'newest') {
    builder = builder.order('published_at', { ascending: false })
  } else if (sort === 'popular') {
    builder = builder.order('upvote_count', { ascending: false })
  } else {
    // Default: SuperTools first, then popular
    builder = builder.order('is_supertools', { ascending: false }).order('upvote_count', { ascending: false })
  }

  const { data, error } = await builder.range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    console.error('searchTools error:', error)
    return { tools: [], total: 0 }
  }

  return { tools: (data ?? []) as unknown as ToolSearchResult[], total: data?.length ?? 0 }
}

export async function getToolBySlug(slug: string): Promise<ToolWithTags | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tools')
    .select(`
      *,
      categories (id, name, slug, icon, color),
      tool_tags (
        tags (id, name, slug)
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !data) return null
  return data as unknown as ToolWithTags
}

export async function getSiteStats(): Promise<{ toolCount: number; reviewCount: number; toolsWithPricing: number; trackedSpend: number }> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const [toolsResult, reviewsResult, pricingResult, spendResult] = await Promise.allSettled([
    supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    sb.from('tool_pricing_tiers').select('tool_id', { count: 'exact', head: true }),
    sb.from('user_subscriptions').select('monthly_cost'),
  ])
  const toolCount = toolsResult.status === 'fulfilled' ? toolsResult.value.count ?? 0 : 0
  const reviewCount = reviewsResult.status === 'fulfilled' ? reviewsResult.value.count ?? 0 : 0
  const toolsWithPricing = pricingResult.status === 'fulfilled' ? pricingResult.value.count ?? 0 : 0

  let trackedSpend = 0
  if (spendResult.status === 'fulfilled' && spendResult.value.data) {
    trackedSpend = spendResult.value.data.reduce((sum: number, row: { monthly_cost: number }) => sum + Number(row.monthly_cost), 0)
  }

  return { toolCount, reviewCount, toolsWithPricing, trackedSpend }
}

/** Tools most frequently tracked in user subscriptions, with their avg price */
export async function getMostTrackedTools(limit = 8) {
  const supabase = await createClient()

  // user_subscriptions isn't in generated types — cast to bypass
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawSubs } = await (supabase as any)
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, pricing_model, use_case)')

  const subs = rawSubs as { tool_id: string; monthly_cost: number; tools: Record<string, unknown> }[] | null

  if (!subs || subs.length === 0) {
    // Fallback: show tools with most pricing tiers (popular enough to have pricing data)
    const { data: popular } = await supabase
      .from('tools')
      .select('id, name, slug, logo_url, pricing_model, use_case')
      .eq('status', 'published')
      .in('pricing_model', ['paid', 'freemium'])
      .order('view_count', { ascending: false })
      .limit(limit)

    return (popular ?? []).map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      logo_url: t.logo_url,
      pricing_model: t.pricing_model,
      use_case: t.use_case as string | null,
      tracker_count: 0,
      avg_cost: 0,
    }))
  }

  // Aggregate by tool
  const toolMap = new Map<string, { count: number; totalCost: number; tool: Record<string, unknown> }>()
  for (const sub of subs) {
    const existing = toolMap.get(sub.tool_id)
    const tool = sub.tools as unknown as Record<string, unknown>
    if (existing) {
      existing.count++
      existing.totalCost += Number(sub.monthly_cost)
    } else {
      toolMap.set(sub.tool_id, { count: 1, totalCost: Number(sub.monthly_cost), tool })
    }
  }

  return Array.from(toolMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([id, { count, totalCost, tool }]) => ({
      id,
      name: tool.name as string,
      slug: tool.slug as string,
      logo_url: tool.logo_url as string | null,
      pricing_model: tool.pricing_model as string,
      use_case: (tool.use_case as string) || null,
      tracker_count: count,
      avg_cost: Math.round(totalCost / count),
    }))
}

/** Find common overlap categories for the teaser */
export async function getOverlapExamples() {
  const supabase = await createClient()

  const USE_CASE_LABELS: Record<string, string> = {
    coding: 'Coding & Development',
    'content-creation': 'Content Creation',
    marketing: 'Marketing',
    design: 'Design',
    research: 'Research',
    video: 'Video',
    sales: 'Sales',
  }

  // Get paid tools grouped by use_case with their cheapest tier
  const { data: tools } = await supabase
    .from('tools')
    .select('id, name, slug, logo_url, use_case, pricing_model')
    .eq('status', 'published')
    .in('pricing_model', ['paid', 'freemium'])
    .not('use_case', 'is', null)

  if (!tools || tools.length === 0) return []

  // Group by use_case
  const groups = new Map<string, typeof tools>()
  for (const tool of tools) {
    const uc = tool.use_case as string
    if (!uc || !USE_CASE_LABELS[uc]) continue
    const list = groups.get(uc) || []
    list.push(tool)
    groups.set(uc, list)
  }

  // Pick top 3 categories with most paid tools
  return Array.from(groups.entries())
    .filter(([, items]) => items.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([useCase, items]) => ({
      useCase,
      label: USE_CASE_LABELS[useCase] || useCase,
      toolCount: items.length,
      examples: items.slice(0, 4).map(t => ({
        name: t.name,
        slug: t.slug,
        logo_url: t.logo_url,
      })),
    }))
}

export async function getLatestTools(limit = 8): Promise<ToolCardData[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tools')
    .select(TOOL_SELECT_COLUMNS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as ToolCardData[]
}

export async function getSuperTools(limit = 8): Promise<ToolSearchResult[]> {
  const supabase = await createClient()

  // Fetch reviewed tools, then rank by weighted score (review_count * avg_rating).
  // A 4.8 with 50 reviews beats a 5.0 with 2 reviews.
  const { data } = await supabase
    .from('tools')
    .select(TOOL_SELECT_COLUMNS)
    .eq('status', 'published')
    .gte('review_count', 1)
    .gte('avg_rating', 3.5)
    .order('review_count', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(limit * 3)

  const tools = (data ?? []) as unknown as ToolSearchResult[]

  tools.sort((a, b) => {
    const scoreA = (a.review_count ?? 0) * (a.avg_rating ?? 0)
    const scoreB = (b.review_count ?? 0) * (b.avg_rating ?? 0)
    return scoreB - scoreA
  })

  return tools.slice(0, limit)
}

export async function getSimilarTools(slugs: string[], limit = 4): Promise<ToolSearchResult[]> {
  if (slugs.length === 0) return []
  const supabase = await createClient()

  // Get the category IDs and use_cases of the tools being compared
  const { data: currentTools } = await supabase
    .from('tools')
    .select('category_id, use_case')
    .in('slug', slugs)

  const categoryIds = Array.from(new Set(currentTools?.map(t => t.category_id).filter(Boolean)))
  const useCases = Array.from(new Set(currentTools?.map(t => t.use_case).filter(Boolean)))
  const slugFilter = `(${slugs.join(',')})`

  // Priority 1: same use_case (tightest functional match)
  let results: ToolSearchResult[] = []
  if (useCases.length > 0) {
    const { data } = await supabase
      .from('tools')
      .select(TOOL_SELECT_COLUMNS)
      .in('use_case', useCases)
      .not('slug', 'in', slugFilter)
      .eq('status', 'published')
      .order('avg_rating', { ascending: false })
      .order('review_count', { ascending: false })
      .limit(limit)

    results = (data ?? []) as unknown as ToolSearchResult[]
  }

  // Priority 2: fill remaining slots with same category
  if (results.length < limit && categoryIds.length > 0) {
    const existingSlugs = [...slugs, ...results.map(r => r.slug)]
    const { data } = await supabase
      .from('tools')
      .select(TOOL_SELECT_COLUMNS)
      .in('category_id', categoryIds)
      .not('slug', 'in', `(${existingSlugs.join(',')})`)
      .eq('status', 'published')
      .order('avg_rating', { ascending: false })
      .limit(limit - results.length)

    results = [...results, ...((data ?? []) as unknown as ToolSearchResult[])]
  }

  return results.slice(0, limit)
}

export async function getToolsByCategory(categorySlug: string, page = 1): Promise<{ tools: ToolSearchResult[]; total: number }> {
  return searchTools({ category: categorySlug, sort: 'rating', page })
}

export async function getRelatedToolsByCategory({
  categoryId,
  excludeToolId,
  limit = 3,
}: {
  categoryId: string
  excludeToolId: string
  limit?: number
}): Promise<ToolSearchResult[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tools')
    .select(TOOL_SELECT_COLUMNS)
    .eq('status', 'published')
    .eq('category_id', categoryId)
    .neq('id', excludeToolId)
    .order('avg_rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as ToolSearchResult[]
}

export async function getToolsBySlugs(slugs: string[]): Promise<ToolSearchResult[]> {
  if (slugs.length === 0) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, category_id, published_at, website_url, pricing_details, use_case, team_size, integrations, model_provider')
    .in('slug', slugs)
    .eq('status', 'published')

  if (!data) return []

  const ordered = slugs
    .map((slug) => data.find((tool) => tool.slug === slug))
    .filter(Boolean)

  return ordered as unknown as ToolSearchResult[]
}

/**
 * Fetch tools based on matchmaker criteria
 */
export async function getMatchedTools({
  useCase,
  pricing,
  persona,
  needsApi = false,
  needsMobile = false,
  needsOpenSource = false,
  needsPrivacy = false,
  needsSSO = false,
  limit = 4,
}: {
  useCase: string
  pricing: 'free' | 'paid' | 'any'
  persona: string
  needsApi?: boolean
  needsMobile?: boolean
  needsOpenSource?: boolean
  needsPrivacy?: boolean
  needsSSO?: boolean
  limit?: number
}) {
  const supabase = await createClient()
  
  const buildBaseQuery = () => {
    let q = supabase
      .from('tools')
      .select(TOOL_SELECT_COLUMNS)
      .eq('status', 'published')

    // 1. Deep Text Analysis: match use_case OR check tagline/description for keywords
    q = q.or(`use_case.eq.${useCase},tagline.ilike.%${useCase}%,description.ilike.%${useCase}%`)

    if (pricing === 'free') {
      q = q.eq('pricing_model', 'free')
    } else if (pricing === 'paid') {
      q = q.neq('pricing_model', 'free')
    }

    if (needsApi) q = q.eq('has_api', true)
    if (needsMobile) q = q.eq('has_mobile_app', true)
    if (needsOpenSource) q = q.eq('is_open_source', true)
    if (needsPrivacy) q = q.eq('trains_on_data', false)
    if (needsSSO) q = q.eq('has_sso', true)
    
    return q
  }

  // A. Try with BOTH use case and persona (High precision)
  let { data } = await buildBaseQuery()
    .or(`target_audience.eq.${persona},target_audience.is.null`) // Include tools with no audience set
    .order('is_supertools', { ascending: false }) // 1. Best-in-class first
    .order('is_verified', { ascending: false })   // 2. Editor vetted second
    .order('avg_rating', { ascending: false })    // 3. Community rating third
    .order('upvote_count', { ascending: false })  // 4. Popularity last
    .limit(limit)

  // B. FALLBACK: If still no results, broaden to just the use case category
  if (!data || data.length < 2) {
    const fallback = await supabase
      .from('tools')
      .select(TOOL_SELECT_COLUMNS)
      .eq('status', 'published')
      .eq('use_case', useCase)
      .order('is_supertools', { ascending: false })
      .order('is_verified', { ascending: false })
      .order('avg_rating', { ascending: false })
      .limit(limit)
    
    if (fallback.data && fallback.data.length > 0) {
      data = fallback.data
    }
  }

  // C. FINAL FALLBACK: If still nothing, get top tools by popularity to ensure we never show an empty screen
  if (!data || data.length === 0) {
    const fallbackPopular = await supabase
      .from('tools')
      .select(TOOL_SELECT_COLUMNS)
      .eq('status', 'published')
      .order('upvote_count', { ascending: false })
      .limit(limit)
    data = fallbackPopular.data
  }

  return (data ?? []) as unknown as ToolSearchResult[]
}

export async function getPopularToolsExcluding(excludeIds: string[], limit = 4): Promise<ToolSearchResult[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('tools')
    .select(TOOL_SELECT_COLUMNS)
    .eq('status', 'published')
    .order('avg_rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit + excludeIds.length + 5)

  // Filter out excluded IDs in JS and take the limit
  const filtered = (data ?? []).filter(t => !excludeIds.includes(t.id))
  return filtered.slice(0, limit) as unknown as ToolSearchResult[]
}

export async function getFeaturedStack() {
  const supabase = createAdminClient()

  // Get the most recently featured public stack with creator profile in one query
  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, description, icon, share_slug, featured_at, user_id, view_count, save_count, profiles:user_id (username, display_name, avatar_url)')
    .eq('is_public', true)
    .not('featured_at', 'is', null)
    .order('featured_at', { ascending: false })
    .limit(1)
    .single()

  if (!collection) return null

  // Get tools in this stack (second query — can't easily join through collection_items in one shot)
  const { data: items } = await supabase
    .from('collection_items')
    .select('tools:tool_id (id, name, slug, logo_url, tagline, pricing_model)')
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true })
    .limit(5)

  const { profiles: creator, ...rest } = collection

  return {
    ...rest,
    tools: (items?.map(i => i.tools).filter(Boolean) ?? []) as Array<{id: string; name: string; slug: string; logo_url: string | null; tagline: string; pricing_model: string}>,
    creator: creator as { username: string | null; display_name: string | null; avatar_url: string | null } | null,
  }
}
