import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// pricing_history table may not exist in generated types yet — use untyped client for this table

/*
 * Daily pricing snapshot cron — records current prices for all tools.
 * Runs once per day. Detects price changes by comparing to previous snapshot.
 * Powers: "ChatGPT raised prices 25% this quarter" insights.
 *
 * Schedule: daily at 06:00 UTC (configured in vercel.json)
 */

export const maxDuration = 120

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Check if we already ran today
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { count: existingCount } = await db
    .from('pricing_history')
    .select('id', { count: 'exact', head: true })
    .eq('snapshot_date', today)

  if (existingCount && existingCount > 0) {
    return NextResponse.json({ message: 'Already snapshotted today', count: existingCount })
  }

  // Fetch all current pricing tiers
  const { data: tiers, error } = await admin
    .from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price, annual_price')

  if (error || !tiers) {
    return NextResponse.json({ error: error?.message || 'No tiers found' }, { status: 500 })
  }

  // Build snapshot rows
  const rows = tiers.map(t => ({
    tool_id: t.tool_id,
    tier_name: t.tier_name,
    monthly_price: t.monthly_price,
    annual_price: t.annual_price,
    snapshot_date: today,
  }))

  // Insert in batches of 500
  let inserted = 0
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    const { error: insertError } = await db
      .from('pricing_history')
      .upsert(batch, { onConflict: 'tool_id,tier_name,snapshot_date' })

    if (insertError) {
      console.error(`Batch ${i / 500} failed:`, insertError.message)
    } else {
      inserted += batch.length
    }
  }

  // Detect price changes vs previous snapshot
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const { data: prevSnapshot } = await db
    .from('pricing_history')
    .select('tool_id, tier_name, monthly_price')
    .eq('snapshot_date', yesterday)

  const changes: { tool_id: string; tier_name: string; oldPrice: number; newPrice: number; change: number }[] = []

  if (prevSnapshot) {
    const prevMap = new Map((prevSnapshot as { tool_id: string; tier_name: string; monthly_price: number }[]).map((p: { tool_id: string; tier_name: string; monthly_price: number }) => [`${p.tool_id}::${p.tier_name}`, p.monthly_price]))

    for (const tier of tiers) {
      const key = `${tier.tool_id}::${tier.tier_name}`
      const oldPrice = prevMap.get(key)
      if (oldPrice != null && oldPrice !== tier.monthly_price) {
        changes.push({
          tool_id: tier.tool_id,
          tier_name: tier.tier_name,
          oldPrice: Number(oldPrice),
          newPrice: tier.monthly_price,
          change: Math.round(((tier.monthly_price - Number(oldPrice)) / Number(oldPrice)) * 100),
        })
      }
    }
  }

  // Update pricing_last_verified_at on all tools that have tiers
  const toolIds = [...new Set(tiers.map(t => t.tool_id))]
  for (let i = 0; i < toolIds.length; i += 200) {
    await db
      .from('tools')
      .update({ pricing_last_verified_at: new Date().toISOString() })
      .in('id', toolIds.slice(i, i + 200))
  }

  return NextResponse.json({
    message: `Snapshot complete for ${today}`,
    tiersRecorded: inserted,
    priceChanges: changes.length,
    changes,
  })
}
