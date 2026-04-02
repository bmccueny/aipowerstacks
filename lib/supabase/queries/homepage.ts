import { createAdminClient } from '@/lib/supabase/admin'
import { proxyFaviconUrl } from '@/lib/utils/favicon-proxy'

const supabase = createAdminClient()

export async function getHomepageData() {
  const [
    siteStatsResult,
    mostTrackedResult,
    overlapsResult,
    latestPostsResult,
    calcToolsResult,
    categoriesResult,
  ] = await Promise.all([
    fetchSiteStats(),
    fetchMostTrackedTools(8),
    fetchOverlapExamples(),
    fetchLatestPosts(3),
    supabase
      .from('tools')
      .select('id, name, slug, logo_url, pricing_model')
      .eq('status', 'published')
      .order('name'),
    supabase.from('categories').select('id, name, slug').order('name'),
  ])

  return {
    siteStats: siteStatsResult,
    mostTracked: mostTrackedResult.map((t) => ({ ...t, logo_url: proxyFaviconUrl(t.logo_url) })),
    overlaps: overlapsResult.map((o) => ({
      ...o,
      examples: o.examples.map((e) => ({ ...e, logo_url: proxyFaviconUrl(e.logo_url) })),
    })),
    latestPosts: latestPostsResult,
    calcTools: (calcToolsResult.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      logo_url: proxyFaviconUrl(t.logo_url),
      pricing_model: t.pricing_model,
    })),
    categories: categoriesResult.data ?? [],
  }
}

async function fetchSiteStats() {
  const [toolsResult, reviewsResult, pricingResult, spendResult] = await Promise.allSettled([
    supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('tool_pricing_tiers').select('tool_id', { count: 'exact', head: true }),
    supabase.from('user_subscriptions').select('monthly_cost'),
  ])

  const toolCount = toolsResult.status === 'fulfilled' ? toolsResult.value.count ?? 0 : 0
  const reviewCount = reviewsResult.status === 'fulfilled' ? reviewsResult.value.count ?? 0 : 0
  const toolsWithPricing = pricingResult.status === 'fulfilled' ? pricingResult.value.count ?? 0 : 0

  let trackedSpend = 0
  if (spendResult.status === 'fulfilled' && spendResult.value.data) {
    trackedSpend = spendResult.value.data.reduce(
      (sum: number, row: { monthly_cost: number }) => sum + Number(row.monthly_cost),
      0
    )
  }

  return { toolCount, reviewCount, toolsWithPricing, trackedSpend }
}

async function fetchMostTrackedTools(limit: number) {
  const { data: rawSubs } = await supabase
    .from('user_subscriptions')
    .select('tool_id, monthly_cost, tools:tool_id(name, slug, logo_url, pricing_model, use_case)')

  const subs = rawSubs as
    | { tool_id: string; monthly_cost: number; tools: Record<string, unknown> }[]
    | null

  if (!subs || subs.length === 0) return []

  const toolMap = new Map<
    string,
    { id: string; name: string; slug: string; logo_url: string | null; pricing_model: string; count: number; totalCost: number }
  >()

  for (const sub of subs) {
    const t = sub.tools as { name?: string; slug?: string; logo_url?: string; pricing_model?: string } | null
    if (!t?.slug) continue
    const existing = toolMap.get(sub.tool_id)
    if (existing) {
      existing.count++
      existing.totalCost += Number(sub.monthly_cost)
    } else {
      toolMap.set(sub.tool_id, {
        id: sub.tool_id,
        name: t.name ?? '',
        slug: t.slug,
        logo_url: t.logo_url ?? null,
        pricing_model: t.pricing_model ?? 'unknown',
        count: 1,
        totalCost: Number(sub.monthly_cost),
      })
    }
  }

  return Array.from(toolMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((t) => ({
      ...t,
      avg_cost: t.count > 0 ? Math.round(t.totalCost / t.count) : 0,
    }))
}

async function fetchOverlapExamples() {
  const { data: tools } = await supabase
    .from('tools')
    .select('id, name, slug, logo_url, use_case')
    .eq('status', 'published')
    .not('use_case', 'is', null)

  if (!tools) return []

  const grouped = new Map<string, typeof tools>()
  for (const tool of tools) {
    if (!tool.use_case) continue
    const existing = grouped.get(tool.use_case) ?? []
    existing.push(tool)
    grouped.set(tool.use_case, existing)
  }

  const USE_CASE_LABELS: Record<string, string> = {
    design: 'Design',
    marketing: 'Marketing',
    'content-creation': 'Content Creation',
    coding: 'Coding',
    research: 'Research',
    writing: 'Writing',
    productivity: 'Productivity',
    video: 'Video',
    audio: 'Audio & Music',
    data: 'Data & Analytics',
  }

  return Array.from(grouped.entries())
    .filter(([, list]) => list.length >= 3)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([useCase, list]) => ({
      useCase,
      label: USE_CASE_LABELS[useCase] ?? useCase,
      toolCount: list.length,
      examples: list
        .slice(0, 4)
        .map((t) => ({ name: t.name, slug: t.slug, logo_url: t.logo_url })),
    }))
}

async function fetchLatestPosts(limit: number) {
  const { data } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags, reading_time_min, published_at, author_id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (!data) return []

  const authorIds = Array.from(new Set(data.map((p) => p.author_id).filter(Boolean)))
  let authorMap = new Map<string, { display_name: string | null }>()

  if (authorIds.length > 0) {
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', authorIds)
    if (authors) {
      authorMap = new Map(authors.map((a) => [a.id, a]))
    }
  }

  return data.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    cover_image_url: p.cover_image_url,
    published_at: p.published_at,
    author_display_name: authorMap.get(p.author_id)?.display_name ?? null,
  }))
}
