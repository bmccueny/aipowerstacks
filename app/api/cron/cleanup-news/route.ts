import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { AINews } from '@/lib/types'

const AI_KEYWORDS = [
  'ai', 'llm', 'gpt', 'claude', 'anthropic', 'openai', 'gemini', 'perplexity', 
  'machine learning', 'deep learning', 'neural', 'bot', 'agent', 'automation',
  'copilot', 'midjourney', 'stable diffusion', 'suno', 'elevenlabs', 'nvidia',
  'tpu', 'gpu', 'quantum', 'robot', 'autonomous', 'model', 'training', 'inference',
  'transformer', 'llama', 'stable video', 'runway', 'pika', 'flux', 'ideogram'
]

function isAiRelated(title: string, summary: string | null) {
  const text = `${title} ${summary || ''}`.toLowerCase()
  return AI_KEYWORDS.some(k => {
    if (k === 'ai') return /\bai\b/i.test(text)
    return text.includes(k)
  })
}

function areTooSimilar(t1: string, t2: string) {
  const w1 = new Set(t1.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const w2 = new Set(t2.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const intersection = new Set([...w1].filter(x => w2.has(x)))
  const similarity = intersection.size / Math.max(w1.size, w2.size)
  return similarity > 0.6
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  
  // 1. Fetch all news
  const { data: news, error: fetchError } = await admin
    .from('ai_news')
    .select('*')
    .order('published_at', { ascending: false })

  if (fetchError || !news) {
    return NextResponse.json({ error: fetchError?.message || 'No news found' }, { status: 400 })
  }

  // 2. Group by day and keep only top 3 unique items
  const toKeep: string[] = []
  const toDelete: string[] = []
  
  const dailyGroups: Record<string, AINews[]> = {}

  news.forEach(item => {
    const day = new Date(item.published_at).toISOString().split('T')[0]
    if (!dailyGroups[day]) dailyGroups[day] = []
    dailyGroups[day].push(item)
  })

  for (const day in dailyGroups) {
    const dayItems = dailyGroups[day]
    const keptInDay: AINews[] = []
    
    for (const item of dayItems) {
      const isAi = isAiRelated(item.title, item.summary)
      const hasImage = !!item.image_url
      const isDup = keptInDay.some(existing => areTooSimilar(existing.title, item.title))
      
      if (isAi && hasImage && !isDup && keptInDay.length < 3) {
        keptInDay.push(item)
        toKeep.push(item.id)
      } else {
        toDelete.push(item.id)
      }
    }
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ success: true, message: 'All news fits the new criteria', cleaned: 0 })
  }

  // 3. Delete everything else
  const { error: deleteError } = await admin
    .from('ai_news')
    .delete()
    .in('id', toDelete)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    totalBefore: news.length,
    cleaned: toDelete.length,
    remaining: toKeep.length,
    ranAt: new Date().toISOString()
  })
}
