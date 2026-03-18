import { createClient } from '@/lib/supabase/server'
import { NEWS_PAGE_SIZE } from '@/lib/constants'

export type AINewsItem = {
  id: string
  title: string
  url: string
  summary: string | null
  source_name: string
  source_url: string | null
  image_url: string | null
  published_at: string
}

function buildPreviewImageUrl(articleUrl: string): string {
  return `https://image.thum.io/get/width/1200/noanimate/${encodeURIComponent(articleUrl)}`
}

function normalizeNewsImageUrl(imageUrl: string | null, articleUrl: string): string {
  if (!imageUrl) return buildPreviewImageUrl(articleUrl)

  const isLegacyThumUrl = imageUrl.startsWith('https://image.thum.io/get/') && imageUrl.includes('/noanimate/https://')
  if (isLegacyThumUrl) return buildPreviewImageUrl(articleUrl)

  return imageUrl
}

export async function getLatestAINews(limit = 50): Promise<AINewsItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('ai_news')
    .select('id, title, url, summary, source_name, source_url, image_url, published_at')
    .order('published_at', { ascending: false })
    .limit(limit)

  return ((data ?? []) as AINewsItem[]).map((item) => ({
    ...item,
    image_url: normalizeNewsImageUrl(item.image_url, item.url),
  }))
}

export async function getPaginatedAINews(page = 1) {
  const supabase = await createClient()
  const offset = (page - 1) * NEWS_PAGE_SIZE

  const { data, count } = await supabase
    .from('ai_news')
    .select('id, title, url, summary, source_name, source_url, image_url, published_at', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(offset, offset + NEWS_PAGE_SIZE - 1)

  const items = ((data ?? []) as AINewsItem[]).map((item) => ({
    ...item,
    image_url: normalizeNewsImageUrl(item.image_url, item.url),
  }))

  return { items, total: count ?? 0 }
}
