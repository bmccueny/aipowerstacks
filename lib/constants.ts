export const PAGE_SIZE = 24
export const BLOG_PAGE_SIZE = 10
export const NEWS_PAGE_SIZE = 10

export const PRICING_MODELS = [
  { value: 'free', label: 'Free' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'paid', label: 'Paid' },
  { value: 'trial', label: 'Free Trial' },
  { value: 'contact', label: 'Contact Us' },
] as const

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
] as const

export const USE_CASE_OPTIONS = [
  { value: 'content-creation', label: 'Content Creation' },
  { value: 'coding', label: 'Coding' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'video', label: 'Video' },
  { value: 'sales', label: 'Sales' },
  { value: 'customer-support', label: 'Customer Support' },
] as const

export const TEAM_SIZE_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: 'small-team', label: 'Small Team (2-10)' },
  { value: 'mid-size', label: 'Mid-size Team (11-50)' },
  { value: 'enterprise', label: 'Enterprise (50+)' },
] as const

export const INTEGRATION_OPTIONS = [
  { value: 'slack', label: 'Slack' },
  { value: 'notion', label: 'Notion' },
  { value: 'zapier', label: 'Zapier' },
  { value: 'google-drive', label: 'Google Drive' },
  { value: 'github', label: 'GitHub' },
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'figma', label: 'Figma' },
] as const

export const MODEL_PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI (GPT-4, etc.)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'meta', label: 'Meta (Llama)' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'cohere', label: 'Cohere' },
  { value: 'stability', label: 'Stability AI' },
  { value: 'eleven-labs', label: 'ElevenLabs' },
  { value: 'midjourney', label: 'Midjourney' },
  { value: 'multiple', label: 'Multiple Providers' },
  { value: 'proprietary', label: 'Proprietary Model' },
  { value: 'other', label: 'Other' },
] as const

export const MODEL_PROVIDER_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  meta: 'Meta',
  mistral: 'Mistral',
  cohere: 'Cohere',
  stability: 'Stability AI',
  'eleven-labs': 'ElevenLabs',
  midjourney: 'Midjourney',
  multiple: 'Multiple',
  proprietary: 'Proprietary',
  other: 'Other',
}

export const USE_CASE_LABELS: Record<string, string> = {
  'content-creation': 'Content',
  coding: 'Coding',
  marketing: 'Marketing',
  design: 'Design',
  research: 'Research',
  video: 'Video',
  sales: 'Sales',
  'customer-support': 'Support',
}

export const DEPLOYMENT_TYPE_OPTIONS = [
  { value: 'cloud', label: 'Cloud' },
  { value: 'self-hosted', label: 'Self-Hosted' },
  { value: 'both', label: 'Local + Cloud' },
] as const

export const FEATURE_FILTERS = [
  { key: 'has_api', label: 'API', param: 'has_api' },
  { key: 'has_mobile', label: 'Mobile', param: 'has_mobile' },
  { key: 'open_source', label: 'Open Source', param: 'open_source' },
  { key: 'privacy_first', label: 'Privacy-First', param: 'privacy_first' },
  { key: 'enterprise_ready', label: 'Enterprise', param: 'enterprise_ready' },
] as const

export const TIME_TO_VALUE_OPTIONS = [
  { value: 'instant', label: 'Instant (seconds)' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
] as const

export const TIME_TO_VALUE_LABELS: Record<string, { label: string; cls: string }> = {
  instant: { label: 'First win in seconds', cls: 'text-emerald-600 dark:text-emerald-400' },
  minutes: { label: 'First win in minutes', cls: 'text-emerald-600 dark:text-emerald-400' },
  hours: { label: 'Set up in hours', cls: 'text-amber-600 dark:text-amber-400' },
  days: { label: 'Takes days to set up', cls: 'text-orange-600 dark:text-orange-400' },
  weeks: { label: 'Weeks to full value', cls: 'text-orange-600 dark:text-orange-400' },
}

export const PRICING_BADGE_COLORS: Record<string, string> = {
  free: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  freemium: 'bg-sky-100 text-sky-800 border-sky-300',
  paid: 'bg-amber-100 text-amber-800 border-amber-300',
  trial: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  contact: 'bg-stone-100 text-stone-800 border-stone-300',
  unknown: 'bg-stone-100 text-stone-800 border-stone-300',
}

export const PRICING_LABELS: Record<string, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  trial: 'Free Trial',
  contact: 'Contact',
  unknown: 'Unknown',
}
