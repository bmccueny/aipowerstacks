import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  
  // 1. Get tools that claim to have an API
  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, name, website_url')
    .eq('status', 'published')
    .eq('has_api', true)
    .order('last_benchmarked_at', { ascending: true, nullsFirst: true })
    .limit(15) // Batch size

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!tools || tools.length === 0) return NextResponse.json({ message: 'No tools to benchmark' })

  const now = new Date().toISOString()

  for (const tool of tools) {
    const start = Date.now()
    let success = false
    let latency = 0

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(tool.website_url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        headers: { 'User-Agent': 'AIPowerStacks-Benchmark-Bot/1.0' }
      })

      clearTimeout(timeout)
      latency = Date.now() - start
      success = response.ok || response.status === 0
    } catch (err) {
      latency = 5000
      success = false
    }

    // A. Insert into HISTORY table
    await (supabase as any)
      .from('tool_benchmarks')
      .insert({
        tool_id: tool.id,
        latency,
        is_up: success
      })

    // B. Calculate 30-day rolling uptime
    const { data: uptimeData } = await (supabase as any).rpc('get_tool_uptime', { p_tool_id: tool.id })
    const rollingUptime = uptimeData ?? (success ? 100.00 : 0.00)

    // C. Update the tool master record
    await (supabase as any)
      .from('tools')
      .update({
        api_latency: latency,
        api_uptime: rollingUptime,
        last_benchmarked_at: now
      })
      .eq('id', tool.id)
  }

  return NextResponse.json({
    success: true,
    processed: tools.length,
    ranAt: now
  })
}
