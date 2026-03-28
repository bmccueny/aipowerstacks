import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { SITE_URL } from '@/lib/constants/site'

const JINA_BASE = 'https://r.jina.ai'
const XAI_BASE = 'https://api.x.ai/v1'

export const maxDuration = 300

// Known pricing page URLs for popular tools
const PRICING_URLS: Record<string, string> = {
  'chatgpt': 'https://openai.com/chatgpt/pricing/',
  'claude-code': 'https://www.anthropic.com/pricing',
  'cursor-editor': 'https://www.cursor.com/pricing',
  'midjourney-v7': 'https://www.midjourney.com/account/',
  'github-copilot': 'https://github.com/features/copilot#pricing',
  'perplexity-ai': 'https://www.perplexity.ai/pro',
  'notion-ai': 'https://www.notion.com/pricing',
  'jasper-brand-voice': 'https://www.jasper.ai/pricing',
  'copy-ai': 'https://www.copy.ai/pricing',
  'elevenlabs-dubbing': 'https://elevenlabs.io/pricing',
  'fireflies-ai': 'https://fireflies.ai/pricing',
  'otter-ai': 'https://otter.ai/pricing',
  'heygen': 'https://www.heygen.com/pricing',
  'descript-ai': 'https://www.descript.com/pricing',
  'canva': 'https://www.canva.com/pricing/',
  'grammarly': 'https://www.grammarly.com/plans',
  'zapier': 'https://zapier.com/pricing',
  'replit': 'https://replit.com/pricing',
  'windsurf': 'https://windsurf.com/pricing',
  'suno': 'https://suno.com/pricing',
  'bolt-new': 'https://bolt.new/pricing',
  'lovable': 'https://lovable.dev/pricing',
  'semrush-one': 'https://www.semrush.com/prices/',
}

type Tier = { tier_name: string; monthly_price: number; features: string | null }
type PriceChange = {
  tool_id: string
  tool_name: string
  tool_slug: string
  tier_name: string
  old_price: number
  new_price: number
  change_pct: number
}

async function scrape(url: string): Promise<string | null> {
  try {
    const res = await fetch(`${JINA_BASE}/${url}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    return (await res.text()).slice(0, 8000)
  } catch {
    return null
  }
}

async function extractTiers(toolName: string, content: string): Promise<Tier[]> {
  const prompt = `Extract pricing tiers for "${toolName}" from this content. Return a JSON array of objects with: tier_name (string), monthly_price (number, 0 for free), features (string, brief).

Rules:
- Only include tiers with clear monthly prices
- Convert annual prices to monthly (divide by 12, round to nearest dollar)
- If price says "Custom" or "Contact us", set monthly_price to 0 and tier_name to "Enterprise"
- Max 6 tiers
- Return ONLY the JSON array, no other text

Content:
${content.slice(0, 4000)}`

  try {
    const res = await fetch(`${XAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        max_tokens: 1000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    const text = (data.choices?.[0]?.message?.content ?? '').trim()
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0])
  } catch {
    return []
  }
}

function buildAlertEmail(changes: PriceChange[]): { subject: string; html: string } {
  const increases = changes.filter(c => c.new_price > c.old_price)
  const decreases = changes.filter(c => c.new_price < c.old_price)

  const subject = increases.length > 0
    ? `🚨 ${increases.length} AI tool${increases.length > 1 ? 's' : ''} raised prices`
    : `💰 ${decreases.length} AI tool${decreases.length > 1 ? 's' : ''} dropped prices`

  const rows = changes.map(c => {
    const direction = c.new_price > c.old_price ? '📈' : '📉'
    const color = c.new_price > c.old_price ? '#ef4444' : '#22c55e'
    const sign = c.change_pct > 0 ? '+' : ''
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0">
          <strong>${c.tool_name}</strong><br>
          <span style="color:#666;font-size:13px">${c.tier_name}</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:right">
          <span style="color:#999;text-decoration:line-through">$${c.old_price}/mo</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:right">
          <strong>$${c.new_price}/mo</strong>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:right">
          <span style="color:${color};font-weight:bold">${direction} ${sign}${c.change_pct}%</span>
        </td>
      </tr>`
  }).join('')

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
      <div style="padding:24px 0;border-bottom:2px solid #000">
        <strong style="font-size:18px">AIPowerStacks</strong>
        <span style="color:#666;margin-left:8px;font-size:14px">Price Alert</span>
      </div>
      <div style="padding:24px 0">
        <p style="font-size:15px;line-height:1.6;margin:0 0 16px">
          ${increases.length > 0 && decreases.length > 0
            ? `${increases.length} tool${increases.length > 1 ? 's' : ''} raised prices and ${decreases.length} dropped.`
            : increases.length > 0
              ? `${increases.length} tool${increases.length > 1 ? 's' : ''} in your stack raised prices. Review your subscriptions.`
              : `Good news — ${decreases.length} tool${decreases.length > 1 ? 's' : ''} in your stack dropped prices.`
          }
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead>
            <tr style="background:#f8f8f8">
              <th style="padding:8px 16px;text-align:left;font-size:11px;text-transform:uppercase;color:#999">Tool</th>
              <th style="padding:8px 16px;text-align:right;font-size:11px;text-transform:uppercase;color:#999">Was</th>
              <th style="padding:8px 16px;text-align:right;font-size:11px;text-transform:uppercase;color:#999">Now</th>
              <th style="padding:8px 16px;text-align:right;font-size:11px;text-transform:uppercase;color:#999">Change</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:24px;text-align:center">
          <a href="${SITE_URL}/tracker" style="display:inline-block;padding:12px 32px;background:#000;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
            Review Your Stack →
          </a>
        </div>
      </div>
      <div style="padding:16px 0;border-top:1px solid #eee;font-size:12px;color:#999">
        <a href="${SITE_URL}/settings" style="color:#999">Unsubscribe</a> · <a href="${SITE_URL}" style="color:#999">AIPowerStacks</a>
      </div>
    </div>`

  return { subject, html }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.XAI_API_KEY) {
    return NextResponse.json({ error: 'XAI_API_KEY not set' }, { status: 500 })
  }

  const supabase = createAdminClient()

  // 1. Get tools that users are actively tracking (most popular first)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trackedRaw } = await (supabase as any)
    .from('user_subscriptions')
    .select('tool_id, tools!inner(id, name, slug, website_url)')

  if (!trackedRaw || trackedRaw.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, changes: 0 })
  }

  // Deduplicate and count
  const toolCounts = new Map<string, { count: number; tool: { id: string; name: string; slug: string; website_url: string } }>()
  for (const row of trackedRaw) {
    const t = row.tools
    if (!t?.id) continue
    const existing = toolCounts.get(t.id)
    if (existing) existing.count++
    else toolCounts.set(t.id, { count: 1, tool: t })
  }

  // Check top 20 most-tracked tools per run
  const toolsToCheck = [...toolCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(e => e.tool)

  // 2. Get current stored tiers for these tools
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentTiers } = await (supabase as any)
    .from('tool_pricing_tiers')
    .select('tool_id, tier_name, monthly_price, features')
    .in('tool_id', toolsToCheck.map(t => t.id))

  const tiersByTool = new Map<string, Tier[]>()
  for (const tier of currentTiers ?? []) {
    const list = tiersByTool.get(tier.tool_id) || []
    list.push(tier)
    tiersByTool.set(tier.tool_id, list)
  }

  // 3. Scrape and compare
  const allChanges: PriceChange[] = []
  let checked = 0

  for (const tool of toolsToCheck) {
    const pricingUrl = PRICING_URLS[tool.slug] || (tool.website_url?.replace(/\/$/, '') + '/pricing')
    const content = await scrape(pricingUrl)
    if (!content) continue

    const newTiers = await extractTiers(tool.name, content)
    if (newTiers.length === 0) continue
    checked++

    const oldTiers = tiersByTool.get(tool.id) || []

    // Compare each new tier against stored tier
    for (const newTier of newTiers) {
      const oldTier = oldTiers.find(t =>
        t.tier_name.toLowerCase() === newTier.tier_name.toLowerCase()
      )

      if (oldTier && Math.abs(oldTier.monthly_price - newTier.monthly_price) >= 1) {
        const changePct = oldTier.monthly_price > 0
          ? Math.round(((newTier.monthly_price - oldTier.monthly_price) / oldTier.monthly_price) * 100)
          : newTier.monthly_price > 0 ? 100 : 0

        if (changePct !== 0) {
          allChanges.push({
            tool_id: tool.id,
            tool_name: tool.name,
            tool_slug: tool.slug,
            tier_name: newTier.tier_name,
            old_price: oldTier.monthly_price,
            new_price: newTier.monthly_price,
            change_pct: changePct,
          })
        }
      }
    }

    // 4. Update stored tiers with new data
    for (const tier of newTiers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('tool_pricing_tiers')
        .upsert({
          tool_id: tool.id,
          tier_name: tier.tier_name,
          monthly_price: tier.monthly_price,
          features: tier.features,
        }, { onConflict: 'tool_id,tier_name' })
    }

    // Rate limit scraping
    await new Promise(r => setTimeout(r, 2000))
  }

  // 5. Send alerts if changes found
  let emailsSent = 0
  if (allChanges.length > 0 && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Find users who track tools with price changes
    const changedToolIds = [...new Set(allChanges.map(c => c.tool_id))]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: affectedSubs } = await (supabase as any)
      .from('user_subscriptions')
      .select('user_id, tool_id')
      .in('tool_id', changedToolIds)

    // Group changes by user
    const changesByUser = new Map<string, PriceChange[]>()
    for (const sub of affectedSubs ?? []) {
      const userChanges = allChanges.filter(c => c.tool_id === sub.tool_id)
      if (userChanges.length === 0) continue
      const existing = changesByUser.get(sub.user_id) || []
      existing.push(...userChanges)
      changesByUser.set(sub.user_id, existing)
    }

    // Deduplicate changes per user (same tool+tier)
    for (const [userId, changes] of changesByUser) {
      const seen = new Set<string>()
      const deduped = changes.filter(c => {
        const key = `${c.tool_id}:${c.tier_name}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      changesByUser.set(userId, deduped)
    }

    // Send emails
    for (const [userId, userChanges] of changesByUser) {
      const { data: { user } } = await supabase.auth.admin.getUserById(userId)
      if (!user?.email) continue

      const { subject, html } = buildAlertEmail(userChanges)

      try {
        await resend.emails.send({
          from: 'AIPowerStacks <alerts@aipowerstacks.com>',
          to: user.email,
          subject,
          html,
        })
        emailsSent++
      } catch {
        // Email send failed, continue
      }
    }

    // 6. Log changes to price history
    for (const change of allChanges) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('tool_price_history')
        .insert({
          tool_id: change.tool_id,
          price: change.new_price,
        })
    }
  }

  return NextResponse.json({
    ok: true,
    checked,
    changes: allChanges.length,
    emailsSent,
    details: allChanges.map(c => `${c.tool_name} ${c.tier_name}: $${c.old_price} → $${c.new_price} (${c.change_pct > 0 ? '+' : ''}${c.change_pct}%)`),
  })
}
