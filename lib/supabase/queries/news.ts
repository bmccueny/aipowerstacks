import { createClient } from '@/lib/supabase/server'

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
