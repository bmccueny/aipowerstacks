import { describe, it, expect } from 'vitest'

// Test the keyword extraction logic directly
// We re-implement the pure functions here since they're not exported

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'a', 'an', 'the',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'can', 'may', 'might',
  'need', 'want', 'looking', 'find', 'help', 'get', 'give', 'use', 'using',
  'replace', 'switch', 'try', 'start', 'know', 'think',
  'write', 'writes', 'run', 'runs', 'work', 'works',
  'that', 'which', 'who', 'whom', 'this', 'these', 'those',
  'it', 'its', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with',
  'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'and', 'but', 'or', 'nor', 'not', 'so', 'very', 'really', 'just',
  'than', 'then', 'also', 'some', 'any', 'all', 'most', 'more',
  'much', 'many', 'something', 'anything', 'thing', 'things',
  'like', 'make', 'makes', 'made',
  'way', 'best', 'good', 'great', 'better', 'faster', 'slower',
  'ever', 'never', 'always', 'every', 'still', 'even',
  'tool', 'tools', 'app', 'apps', 'software', 'platform', 'service',
  'solution', 'product', 'program', 'website', 'site',
  'please', 'recommend', 'suggest', 'show', 'tell',
])

const DOMAIN_SIGNAL_WORDS = new Set([
  'ai', 'code', 'coding', 'video', 'audio', 'image', 'design', 'writing',
  'seo', 'marketing', 'data', 'api', 'mobile', 'agent', 'chat', 'bot', 'llm',
])

const MODIFIER_WORDS = new Set([
  'fast', 'speed', 'quick', 'realtime', 'real-time', 'cheap', 'simple',
  'easy', 'powerful', 'advanced', 'smart', 'intelligent', 'modern',
])

function extractKeywordsLocal(query: string): string | null {
  const words = query.toLowerCase().trim().split(/\s+/)
  const domainWords: string[] = []
  const modifierWords: string[] = []
  const otherWords: string[] = []

  for (const w of words) {
    if (DOMAIN_SIGNAL_WORDS.has(w)) domainWords.push(w)
    else if (MODIFIER_WORDS.has(w)) modifierWords.push(w)
    else if (!STOP_WORDS.has(w) && w.length >= 3) otherWords.push(w)
  }

  const result = [...domainWords, ...otherWords]
  if (result.length < 2 && modifierWords.length > 0) result.push(modifierWords[0])
  if (result.length === 0) return null
  return result.join(' ')
}

function looksLikeNaturalLanguage(q: string): boolean {
  const words = q.trim().split(/\s+/)
  if (words.length < 3) return false
  const nlSignals = /\b(i |i'm|my |me |we |our |need|want|looking|find|help|can|how|what|which|best|recommend|suggest|tool to|app for|app that|something|anything)\b/i
  if (nlSignals.test(q)) return true
  if (words.length >= 4) return true
  return false
}

describe('extractKeywordsLocal', () => {
  it('extracts domain words from natural language', () => {
    expect(extractKeywordsLocal('i need an ai tool for coding')).toBe('ai coding')
  })

  it('strips stop words', () => {
    expect(extractKeywordsLocal('help me find the best video editing tool')).toBe('video editing')
  })

  it('returns null for pure stop words', () => {
    expect(extractKeywordsLocal('i need a tool')).toBeNull()
  })

  it('includes modifiers when only one domain word', () => {
    expect(extractKeywordsLocal('i need a fast ai tool')).toBe('ai fast')
  })

  it('handles single keyword queries', () => {
    expect(extractKeywordsLocal('chatbot')).toBe('chatbot')
  })
})

describe('looksLikeNaturalLanguage', () => {
  it('returns false for short queries', () => {
    expect(looksLikeNaturalLanguage('ai tools')).toBe(false)
  })

  it('detects NL signals', () => {
    expect(looksLikeNaturalLanguage('i need a tool for coding')).toBe(true)
  })

  it('detects 4+ word queries as NL', () => {
    expect(looksLikeNaturalLanguage('transcription audio speech text')).toBe(true)
  })

  it('rejects 2-word queries without NL signals', () => {
    expect(looksLikeNaturalLanguage('code editor')).toBe(false)
  })
})
