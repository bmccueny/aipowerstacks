export const PAGE_SIZE = 24

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

export const PRICING_BADGE_COLORS: Record<string, string> = {
  free: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  freemium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  paid: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  trial: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  contact: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export const PRICING_LABELS: Record<string, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
  trial: 'Free Trial',
  contact: 'Contact',
  unknown: 'Unknown',
}
