import type { StackEntry } from './scoring'

const DOMAIN_LABELS: Record<string, string> = {
  code: 'software development', mobile: 'mobile app development',
  video: 'video creation', audio: 'audio production',
  image: 'image generation', writing: 'content writing',
  design: 'design and prototyping', marketing: 'marketing and growth',
  data: 'data and research', ai_agent: 'AI agent development',
  automation: 'workflow automation', security: 'security and compliance',
  ecommerce: 'e-commerce', general: 'your project',
}

/**
 * Build a narrative string describing the recommended stack.
 *
 * When called from the heuristic fallback path, pass `message` and
 * `primaryDomain` to auto-generate the intro line.  When called from
 * the Claude path (or any caller that already has an intro), pass
 * `intro` directly and omit the other two.
 */
export function buildNarrative(
  stack: StackEntry[],
  options: { intro: string } | { message: string; primaryDomain: string },
): string {
  let intro: string
  if ('intro' in options) {
    intro = options.intro
  } else {
    const domainLabel = DOMAIN_LABELS[options.primaryDomain] ?? 'your project'
    intro = `${stack.length} tools curated for "${options.message}" — optimized for ${domainLabel}.`
  }

  let narrative = intro
  for (const { tool, role, description } of stack) {
    const highlights: string[] = []
    if (tool.is_verified) highlights.push('verified')
    if (tool.has_api) highlights.push('API-ready')
    if (tool.trains_on_data === false) highlights.push('privacy-first')
    if (tool.pricing_model === 'free' || tool.pricing_model === 'freemium') highlights.push('free to start')
    if (tool.is_open_source) highlights.push('open source')

    const note = highlights.length > 0 ? ` — ${highlights.slice(0, 2).join(', ')}` : ''
    const desc = (description || tool.tagline || role).replace(/\*\*/g, '')
    narrative += `\n\n**${role}: ${tool.name}**\n${desc}${note}`
  }

  return narrative
}

// ── Wizard Explanation ─────────────────────────────────────────────────────────
export function buildWizardExplanation(useCase: string, pricing: string, persona: string, count: number): string {
  const useCaseLabels: Record<string, string> = {
    'content-creation': 'content creation', 'coding': 'software development',
    'video': 'video production', 'marketing': 'business growth', 'research': 'research and data',
  }
  const personaLabels: Record<string, string> = {
    'solo-creator': 'solo creators', 'lean-startup': 'startup teams', 'enterprise-ready': 'enterprise teams',
  }
  const pricingLabel = pricing === 'free' ? 'free tools only' : pricing === 'paid' ? 'paid tools' : 'any budget'
  const domainLabel = useCaseLabels[useCase] || useCase.replace(/-/g, ' ')
  const personaLabel = personaLabels[persona] || persona.replace(/-/g, ' ')
  return `${count} top tools for ${domainLabel}, curated for ${personaLabel} at ${pricingLabel}.`
}
