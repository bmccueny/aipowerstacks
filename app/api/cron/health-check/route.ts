import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, name, website_url')
    .eq('status', 'published')
    .not('website_url', 'is', null)
    .limit(10)

  if (error || !tools?.length) {
    return NextResponse.json({ message: 'No tools to check', toolsChecked: 0 })
  }

  const results = []
  for (const tool of tools) {
    try {
      const start = Date.now()
      const res = await fetch(tool.website_url, { 
        method: 'HEAD',
        redirect: 'follow'
      })
      const responseTime = Date.now() - start
      const status = res.status
      
      const isUp = status >= 200 && status < 400
      
      await supabase.from('tool_health').upsert({
        tool_id: tool.id,
        status_code: status,
        response_time_ms: responseTime,
        is_up: isUp,
        checked_at: new Date().toISOString()
      } as any, { onConflict: 'tool_id' })

      results.push({ tool: tool.name, status, isUp })
    } catch (err) {
      await supabase.from('tool_health').upsert({
        tool_id: tool.id,
        status_code: 0,
        response_time_ms: 0,
        is_up: false,
        checked_at: new Date().toISOString(),
        error: err instanceof Error ? err.message : 'Unknown error'
      } as any, { onConflict: 'tool_id' })

      results.push({ tool: tool.name, status: 'error', isUp: false })
    }
  }

  return NextResponse.json({ 
    message: 'Health check completed',
    toolsChecked: results.length,
    results 
  })
}
