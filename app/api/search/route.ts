import { NextRequest, NextResponse } from 'next/server'
import { getQueryEmbedding } from '@/lib/ai/embeddings'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/search
 *
 * Server-side semantic search endpoint.
 * Generates a local embedding for the query using Xenova/all-MiniLM-L6-v2,
 * then calls the `match_tools_semantic` pgvector RPC to find similar tools.
 *
 * Returns full tool data (not just RPC columns) so it can be merged into
 * the existing ToolSearchResult pipeline.
 *
 * Body: { query: string, limit?: number, threshold?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { query, limit = 20, threshold = 0.15 } = await req.json()

    if (!query?.trim()) {
      return NextResponse.json({ tools: [], semantic: false })
    }

    // 1. Generate embedding (runs locally, ~50ms after model is cached)
    let embedding: number[]
    try {
      embedding = await getQueryEmbedding(query.trim())
    } catch (err: any) {
      console.error('Embedding generation failed:', err.message)
      return NextResponse.json({ tools: [], semantic: false })
    }

    // 2. Call pgvector RPC
    const supabase = createAdminClient()
    const vectorStr = `[${embedding.join(',')}]`

    const { data: semanticHits, error: rpcError } = await (supabase as any).rpc(
      'match_tools_semantic',
      {
        query_embedding: vectorStr,
        match_threshold: threshold,
        match_count: Math.min(limit, 50),
      }
    )

    if (rpcError) {
      console.error('match_tools_semantic RPC error:', rpcError.message)
      return NextResponse.json({ tools: [], semantic: false })
    }

    if (!semanticHits || semanticHits.length === 0) {
      return NextResponse.json({ tools: [], semantic: true })
    }

    // 3. Fetch full tool data for the matched IDs (preserving semantic rank order)
    const ids = semanticHits.map((h: any) => h.id)

    const { data: fullTools, error: fetchError } = await supabase
      .from('tools')
      .select(
        'id, name, slug, tagline, logo_url, pricing_model, pricing_details, is_verified, avg_rating, review_count, upvote_count, category_id, published_at, screenshot_urls, is_supertools, target_audience, has_api, has_mobile_app, is_open_source, trains_on_data, has_sso, security_certifications, model_provider'
      )
      .in('id', ids)
      .eq('status', 'published')

    if (fetchError) {
      console.error('Full tool fetch error:', fetchError.message)
      return NextResponse.json({ tools: [], semantic: true })
    }

    // 4. Reorder by semantic similarity (preserve the RPC's ranking)
    const toolMap = new Map((fullTools ?? []).map((t: any) => [t.id, t]))
    const similarityMap = new Map(
      semanticHits.map((h: any) => [h.id, h.similarity])
    )

    const ordered = ids
      .map((id: string) => {
        const tool = toolMap.get(id)
        if (!tool) return null
        return { ...tool, _similarity: similarityMap.get(id) ?? 0 }
      })
      .filter(Boolean)

    return NextResponse.json({
      tools: ordered,
      semantic: true,
      count: ordered.length,
    })
  } catch (err: any) {
    console.error('Semantic search error:', err.message)
    return NextResponse.json(
      { error: 'Semantic search failed' },
      { status: 500 }
    )
  }
}
