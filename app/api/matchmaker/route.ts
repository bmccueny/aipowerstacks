import { NextRequest, NextResponse } from 'next/server'
import { getMatchedTools } from '@/lib/supabase/queries/tools'
import { getQueryEmbedding } from '@/lib/ai/embeddings'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    const supabase = createAdminClient()
    const msgLower = message.toLowerCase()
    
    // 1. Get semantic pool
    const embedding = await getQueryEmbedding(message)
    const vectorStr = `[${embedding.join(',')}]`

    const { data: pool, error: poolError } = await (supabase as any).rpc('match_tools_semantic', {
      query_embedding: vectorStr,
      match_threshold: 0.2,
      match_count: 20
    })

    if (poolError) throw poolError
    if (!pool || pool.length === 0) {
      return NextResponse.json({ tools: [], explanation: "No matches found." })
    }

    const finalTools: any[] = []
    const hero = pool[0]
    finalTools.push(hero)

    // 2. High-Precision Role Matchers
    const isAutomation = (t: any) => {
      const content = `${t.name} ${t.tagline}`.toLowerCase()
      return content.includes('automation') || content.includes('workflow') || t.slug.includes('n8n') || t.slug.includes('zapier')
    }

    const isKnowledge = (t: any) => {
      const content = `${t.name} ${t.tagline}`.toLowerCase()
      return content.includes('notes') || content.includes('knowledge') || content.includes('wiki') || t.slug.includes('notion') || t.slug.includes('obsidian')
    }

    const isGrowth = (t: any) => {
      const content = `${t.name} ${t.tagline}`.toLowerCase()
      // Contextual check: If the user mentioned "tiktok" or "video", SEO for websites is WRONG.
      const isVideoContext = msgLower.includes('video') || msgLower.includes('tiktok') || msgLower.includes('youtube') || msgLower.includes('reel')
      
      if (isVideoContext) {
        return (content.includes('marketing') || content.includes('social') || content.includes('ads') || content.includes('viral')) && !content.includes('seo') && !content.includes('website')
      }
      return content.includes('marketing') || content.includes('content') || content.includes('seo') || content.includes('growth')
    }

    const isSecurity = (t: any) => t.has_sso || t.trains_on_data === false || t.tagline?.toLowerCase().includes('secure') || t.tagline?.toLowerCase().includes('privacy')

    // 3. Selective Stack Building
    const auto = pool.find(t => t.id !== hero.id && isAutomation(t))
    if (auto) finalTools.push(auto)

    const doc = pool.find(t => !finalTools.find(ft => ft.id === t.id) && isKnowledge(t))
    if (doc) finalTools.push(doc)

    const growth = pool.find(t => !finalTools.find(ft => ft.id === t.id) && isGrowth(t))
    if (growth) finalTools.push(growth)

    const security = pool.find(t => !finalTools.find(ft => ft.id === t.id) && isSecurity(t))
    if (security) finalTools.push(security)

    // 4. Narrative (Uses actual resulting list)
    const buildNarrative = (tools: any[]) => {
      const heroTool = tools[0]
      const actualAuto = tools.find(t => t.id !== heroTool.id && isAutomation(t))
      const actualDoc = tools.find(t => t.id !== heroTool.id && isKnowledge(t))
      const actualGrowth = tools.find(t => t.id !== heroTool.id && isGrowth(t))
      const actualSec = tools.find(t => t.id !== heroTool.id && isSecurity(t))

      let narrative = `For your goal of **"${message}"**, I've engineered a ${tools.length}-part specialized stack.`

      narrative += `\n\n**Core Engine: ${heroTool.name}**\nThis tool is your primary ${heroTool.use_case || 'solution'}. `
      if (heroTool.is_verified) narrative += `It is officially verified by AIPowerStacks for technical reliability. `
      
      if (actualAuto) {
        narrative += `\n\n**Connectivity: ${actualAuto.name}**\nTo handle your backend logic, I've added ${actualAuto.name} to automate data flows between your apps.`
      }

      if (actualDoc) {
        narrative += `\n\n**Organization: ${actualDoc.name}**\n${actualDoc.name} acts as your workspace repository to keep requirements and logs in sync.`
      }

      if (actualGrowth) {
        narrative += `\n\n**Launch Strategy: ${actualGrowth.name}**\nTo help you find users, I've selected ${actualGrowth.name} for its ability to handle high-intent ${message.includes('video') ? 'social distribution' : 'content marketing'}.`
      }

      if (actualSec) {
        narrative += `\n\n**Compliance: ${actualSec.name}**\nFinally, I've added a security layer with ${actualSec.name} to ensure your project data remains strictly private.`
      }

      return narrative
    }

    const results = finalTools.length >= 2 ? finalTools : pool.slice(0, 5)

    return NextResponse.json({
      tools: results,
      explanation: buildNarrative(results)
    })
  } catch (err: any) {
    console.error('Matchmaker Error:', err.message)
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
      limit: 5
    })
    return NextResponse.json(tools)
  } catch (err) {
    console.error('API Matchmaker Error:', err)
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 })
  }
}
