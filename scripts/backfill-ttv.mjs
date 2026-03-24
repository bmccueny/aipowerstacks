import { createClient } from '@supabase/supabase-js'

const c = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bynjsccnclkvcqulukij.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

function inferTimeToValue(tool) {
  const name = tool.name.toLowerCase()
  const tagline = (tool.tagline || '').toLowerCase()
  const desc = (tool.description || '').toLowerCase()
  const text = name + ' ' + tagline + ' ' + desc

  // Instant: browser-based tools, generators, no signup needed
  if (tool.pricing_model === 'free' && text.match(/generat|remov|convert|detect|check|test|quiz|maker|creator/)) return 'instant'
  if (text.match(/no sign.?up|instant|one.click|paste.*get|upload.*get/)) return 'instant'

  // Minutes: SaaS with quick onboarding
  if (text.match(/browser extension|chrome extension|plugin/)) return 'minutes'
  if (tool.pricing_model === 'freemium' && !tool.has_api && !text.match(/enterprise|deploy|infra/)) return 'minutes'
  if (text.match(/sign up.*start|get started.*free|try.*free/)) return 'minutes'

  // Hours: coding tools, self-hosted, API-based
  if (tool.has_api && !text.match(/no.code|instant|seconds/)) return 'hours'
  if (tool.is_open_source && tool.deployment_type === 'both') return 'hours'
  if (text.match(/cli|terminal|install|setup|config|deploy|docker|self.host/)) return 'hours'
  if (text.match(/ide|code editor|development environment/)) return 'minutes'

  // Days: enterprise, complex setup
  if (tool.has_sso || text.match(/enterprise|compliance|soc.?2|hipaa/)) return 'days'
  if (tool.pricing_model === 'contact') return 'days'

  // Default based on pricing
  if (tool.pricing_model === 'free') return 'instant'
  if (tool.pricing_model === 'freemium') return 'minutes'
  if (tool.pricing_model === 'trial') return 'minutes'
  if (tool.pricing_model === 'paid') return 'hours'

  return 'minutes'
}

function inferNotFor(tool) {
  const text = (tool.tagline + ' ' + (tool.description || '')).toLowerCase()

  const reasons = []

  // Technical barrier
  if (tool.has_api && !text.match(/no.code|visual|drag.drop/)) {
    if (text.match(/api|sdk|developer|cli|terminal|code/)) {
      reasons.push('non-technical users')
    }
  }
  if (text.match(/cli|command.line|terminal|self.host|docker/)) {
    reasons.push('users who want a hosted solution')
  }

  // Price barrier
  if (tool.pricing_model === 'paid' && !text.match(/free trial/)) {
    if (tool.has_sso || text.match(/enterprise|team|organization/)) {
      reasons.push('solo users or small budgets')
    }
  }
  if (tool.pricing_model === 'contact') {
    reasons.push('individual users or small teams')
  }

  // Privacy concerns
  if (tool.trains_on_data) {
    reasons.push('users with strict data privacy requirements')
  }

  // Platform lock-in
  if (text.match(/shopify only|wordpress only|chrome only/)) {
    const platform = text.match(/(shopify|wordpress|chrome|slack|notion)/)?.[1]
    if (platform) reasons.push(`users not on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)
  }

  if (reasons.length === 0) return null
  return 'Not for ' + reasons.slice(0, 2).join(' or ')
}

const { data: tools } = await c.from('tools')
  .select('id, name, slug, tagline, description, pricing_model, has_api, is_open_source, has_sso, trains_on_data, deployment_type, time_to_value, not_for')
  .eq('status', 'published')

let ttvCount = 0
let notForCount = 0

for (const tool of tools) {
  const updates = {}

  if (!tool.time_to_value) {
    const ttv = inferTimeToValue(tool)
    if (ttv) {
      updates.time_to_value = ttv
      ttvCount++
    }
  }

  if (!tool.not_for) {
    const nf = inferNotFor(tool)
    if (nf) {
      updates.not_for = nf
      notForCount++
    }
  }

  if (Object.keys(updates).length > 0) {
    await c.from('tools').update(updates).eq('id', tool.id)
  }
}

console.log(`Backfilled time_to_value: ${ttvCount}`)
console.log(`Backfilled not_for: ${notForCount}`)
console.log(`Total tools: ${tools.length}`)
