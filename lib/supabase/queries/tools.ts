import { createClient } from '@/lib/supabase/server'
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
  const { data, error } = await (supabase as ReturnType<typeof supabase.rpc> extends never ? never : typeof supabase)
    .rpc('search_tools', args as never)
  return { data: data as ToolSearchResult[] | null, error }
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
    .select('id, name, slug, tagline, logo_url, pricing_model, pricing_details, is_verified, avg_rating, review_count, upvote_count, category_id, published_at, screenshot_urls, is_supertools, target_audience, has_api, has_mobile_app, is_open_source, trains_on_data, has_sso, security_certifications, model_provider')
    .eq('status', 'published')

  // If search query exists, try RPC first, fall back to ilike
  if (query) {
    const { data: rpcData, error: rpcError } = await rpcSearchTools(supabase, {
      search_query: query || null,
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

    if (!rpcError && rpcData && rpcData.length > 0) {
      return { tools: rpcData, total: rpcData.length }
    }

    if (rpcError) {
      console.warn('search_tools RPC unavailable, falling back to ilike search:', rpcError.message)
    }

    // ilike fallback: search name, tagline, description
    const term = `%${query}%`
    let fallback = supabase
      .from('tools')
      .select('id, name, slug, tagline, logo_url, pricing_model, pricing_details, is_verified, avg_rating, review_count, upvote_count, category_id, published_at, screenshot_urls, is_supertools, target_audience, has_api, has_mobile_app, is_open_source, trains_on_data, has_sso, security_certifications, model_provider')
      .eq('status', 'published')
      .or(`name.ilike.${term},tagline.ilike.${term},description.ilike.${term}`)

    if (categoryId) fallback = fallback.eq('category_id', categoryId as any)
    if (pricing)    fallback = fallback.eq('pricing_model', pricing as any)
    if (verified)   fallback = fallback.eq('is_verified', true)

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

    return { tools: (fallbackData as any) ?? [], total: fallbackData?.length ?? 0 }
  }

  // Apply filters
  if (categoryId) builder = builder.eq('category_id', categoryId as any)
  if (pricing) builder = builder.eq('pricing_model', pricing as any)
  if (verified) builder = builder.eq('is_verified', true)
  if (useCase) builder = builder.eq('use_case', useCase as any)
  if (teamSize) builder = builder.eq('team_size', teamSize as any)
  if (audience) builder = builder.eq('target_audience', audience as any)
  if (hasApi) builder = builder.eq('has_api', true)
  if (hasMobile) builder = builder.eq('has_mobile_app', true)
  if (isOpenSource) builder = builder.eq('is_open_source', true)
  if (privacyFirst) builder = builder.eq('trains_on_data', false)
  if (enterpriseReady) builder = builder.eq('has_sso', true)

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

  return { tools: (data as any) ?? [], total: data?.length ?? 0 }
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

export async function getSiteStats(): Promise<{ toolCount: number; reviewCount: number }> {
  const supabase = await createClient()
  const [{ count: toolCount }, { count: reviewCount }] = await Promise.all([
    supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'published'),
  ])
  return { toolCount: toolCount ?? 0, reviewCount: reviewCount ?? 0 }
}

export async function getLatestTools(limit = 8): Promise<ToolCardData[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, upvote_count, category_id, published_at, screenshot_urls')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as ToolCardData[]
}

export async function getSuperTools(limit = 8): Promise<ToolSearchResult[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, upvote_count, category_id, published_at, screenshot_urls')
    .eq('status', 'published')
    .eq('is_supertools', true)
    .order('upvote_count', { ascending: false })
    .order('avg_rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as ToolSearchResult[]
}

export async function getSimilarTools(slugs: string[], limit = 4): Promise<ToolSearchResult[]> {
  if (slugs.length === 0) return []
  const supabase = await createClient()
  
  // 1. Get the category IDs of the tools being compared
  const { data: currentTools } = await supabase
    .from('tools')
    .select('category_id')
    .in('slug', slugs)
  
  const categoryIds = Array.from(new Set(currentTools?.map(t => t.category_id).filter(Boolean)))

  if (categoryIds.length === 0) return []

  // 2. Find other tools in those categories
  const { data } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, upvote_count, category_id, published_at')
    .in('category_id', categoryIds)
    .not('slug', 'in', `(${slugs.join(',')})`)
    .eq('status', 'published')
    .order('upvote_count', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as ToolSearchResult[]
}

export async function getFeaturedTools(limit = 6): Promise<ToolSearchResult[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, upvote_count, category_id, published_at')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('avg_rating', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as ToolSearchResult[]
}

export async function getToolsByCategory(categorySlug: string, page = 1): Promise<{ tools: ToolSearchResult[]; total: number }> {
  return searchTools({ category: categorySlug, sort: 'rating', page })
}

export async function getTopToolsByCategory(categorySlug: string, limit = 10): Promise<ToolSearchResult[]> {
  const supabase = await createClient()

  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (!cat) return []
  const catId = (cat as { id: string }).id

  const { data } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, upvote_count, category_id, published_at')
    .eq('status', 'published')
    .eq('category_id', catId)
    .order('avg_rating', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as ToolSearchResult[]
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
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, upvote_count, category_id, published_at')
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
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, category_id, published_at, website_url, pricing_details, use_case, team_size, integrations')
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
      .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, avg_rating, review_count, upvote_count, has_api, has_mobile_app, is_open_source, is_supertools, trains_on_data, has_sso, security_certifications')
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
      .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, avg_rating, review_count, upvote_count, has_api, has_mobile_app, is_open_source, is_supertools, trains_on_data, has_sso, security_certifications')
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

  // C. NUCLEAR FALLBACK: If still nothing, get top supertools overall to ensure we never show an empty screen
  if (!data || data.length === 0) {
    const nuclear = await supabase
      .from('tools')
      .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, avg_rating, review_count, upvote_count, has_api, has_mobile_app, is_open_source, is_supertools, trains_on_data, has_sso, security_certifications')
      .eq('status', 'published')
      .order('upvote_count', { ascending: false })
      .limit(limit)
    data = nuclear.data
  }

  // D. LAST RESORT: Get any published tools if supertools query failed
  if (!data || data.length === 0) {
    const lastResort = await supabase
      .from('tools')
      .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, avg_rating, review_count, upvote_count, has_api, has_mobile_app, is_open_source, is_supertools, trains_on_data, has_sso, security_certifications')
      .eq('status', 'published')
      .order('upvote_count', { ascending: false })
      .limit(limit)
    data = lastResort.data
  }

  return (data as any) ?? [] as ToolSearchResult[]
}
