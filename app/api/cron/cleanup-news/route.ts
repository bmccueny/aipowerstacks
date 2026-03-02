import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  
  // 1. Fetch all recent news (last 500)
  const { data: news, error: fetchError } = await admin
    .from('ai_news')
    .select('id, title, summary')
    .order('published_at', { ascending: false })
    .limit(500)

  if (fetchError || !news) {
    return NextResponse.json({ error: fetchError?.message || 'No news found' }, { status: 400 })
  }

  // 2. Identify non-AI news
  const toDelete = news
    .filter(item => !isAiRelated(item.title, item.summary))
    .map(item => item.id)

  if (toDelete.length === 0) {
    return NextResponse.json({ success: true, message: 'All current news is AI-related', cleaned: 0 })
  }

  // 3. Delete non-AI news
  const { error: deleteError } = await admin
    .from('ai_news')
    .delete()
    .in('id', toDelete)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    totalChecked: news.length,
    cleaned: toDelete.length,
    ranAt: new Date().toISOString()
  })
}
