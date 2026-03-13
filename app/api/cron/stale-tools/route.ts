import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

  const { data: staleTools, error } = await supabase
    .from('tools')
    .select('id, name, website_url, created_at')
    .eq('status', 'published')
    .lt('created_at', sixtyDaysAgo)
    .order('created_at', { ascending: true })
    .limit(20)

  if (error || !staleTools?.length) {
    return NextResponse.json({ message: 'No stale tools found', flagged: 0 })
  }

  const flagged = []
  for (const tool of staleTools) {
    flagged.push(tool.name)
  }

  return NextResponse.json({ 
    message: 'Stale tools check completed',
    flagged: flagged.length,
    tools: flagged
  })
}
