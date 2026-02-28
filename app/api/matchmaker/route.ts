import { NextRequest, NextResponse } from 'next/server'
import { getMatchedTools } from '@/lib/supabase/queries/tools'

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
