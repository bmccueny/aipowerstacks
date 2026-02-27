import { createClient } from '@/lib/supabase/server'
import type { ToolSearchResult, ToolWithTags } from '@/lib/types'
import { PAGE_SIZE } from '@/lib/constants'

type SearchToolsArgs = {
  search_query?: string | null
  p_category?: string | null
  p_pricing?: string | null
  p_verified?: boolean | null
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
  sort = 'relevance',
  page = 1,
}: {
  query?: string
  category?: string
  pricing?: string
  verified?: boolean
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

  const { data, error } = await rpcSearchTools(supabase, {
    search_query: query || null,
    p_category: categoryId || null,
    p_pricing: pricing || null,
    p_verified: verified ?? null,
    p_sort: sort,
    p_limit: PAGE_SIZE,
    p_offset: offset,
  })

  if (error) {
    console.error('searchTools error:', error)
    return { tools: [], total: 0 }
  }

  return { tools: data ?? [], total: data?.length ?? 0 }
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

export async function getLatestTools(limit = 8): Promise<ToolSearchResult[]> {
  const supabase = await createClient()

  const { data } = await rpcSearchTools(supabase, {
    search_query: null,
    p_category: null,
    p_pricing: null,
    p_verified: null,
    p_sort: 'newest',
    p_limit: limit,
    p_offset: 0,
  })

  return data ?? []
}

export async function getSuperTools(limit = 8): Promise<ToolSearchResult[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, category_id, published_at')
    .eq('status', 'published')
    .eq('is_supertools', true)
    .order('avg_rating', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as ToolSearchResult[]
}

export async function getFeaturedTools(limit = 6): Promise<ToolSearchResult[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tools')
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, category_id, published_at')
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
    .select('id, name, slug, tagline, logo_url, pricing_model, is_verified, is_featured, avg_rating, review_count, category_id, published_at')
    .eq('status', 'published')
    .eq('category_id', catId)
    .order('avg_rating', { ascending: false })
    .limit(limit)

  return (data ?? []) as unknown as ToolSearchResult[]
}
