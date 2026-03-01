import { NextRequest, NextResponse } from 'next/server'
import { getMatchedTools } from '@/lib/supabase/queries/tools'
import { getQueryEmbedding } from '@/lib/ai/embeddings'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    const supabase = createAdminClient()
    
    // 1. Generate embedding for the user's natural language request
    const embedding = await getQueryEmbedding(message)
    const vectorStr = `[${embedding.join(',')}]`

    // 2. Query Supabase using vector similarity
    const { data: tools, error } = await (supabase as any).rpc('match_tools_semantic', {
      query_embedding: vectorStr,
      match_threshold: 0.3, // Adjust for precision vs recall
      match_count: 4
    })

    if (error) throw error

    return NextResponse.json({
      tools: tools ?? [],
      explanation: `I've analyzed your request semantically. Here are the best matches from our verified directory that align with your goal.`
    })
  } catch (err: any) {
    console.error('Semantic Matchmaker Error:', err.message)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

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
      useCase,
      pricing,
      persona,
      needsApi,
      needsMobile,
      needsOpenSource,
      needsPrivacy,
      needsSSO,
      limit: 4
    })
    
    return NextResponse.json(tools)
  } catch (err) {
    console.error('API Matchmaker Error:', err)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}
