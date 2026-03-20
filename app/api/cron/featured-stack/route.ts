import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get public stacks with 3+ tools, not featured recently
  const { data: candidates } = await supabase
    .from('collections')
    .select('id, name, share_slug, collection_items(count)')
    .eq('is_public', true)
    .or(`featured_at.is.null,featured_at.lt.${thirtyDaysAgo}`)
    .order('view_count', { ascending: false })
    .limit(20)

  const eligible = (candidates ?? []).filter((c: { collection_items?: { count: number }[] }) => {
    const count = c.collection_items?.[0]?.count ?? 0
    return count >= 3
  })

  if (eligible.length === 0) {
    return NextResponse.json({ message: 'No eligible stacks found' })
  }

  // Pick a random one from top 20
  const pick = eligible[Math.floor(Math.random() * eligible.length)]

  await supabase
    .from('collections')
    .update({ featured_at: new Date().toISOString() })
    .eq('id', pick.id)

  return NextResponse.json({ featured: pick.name, id: pick.id })
}
