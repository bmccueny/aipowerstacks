/**
 * Multi-pass content humanizer that targets the specific statistical
 * patterns AI detectors flag: uniform sentence length, low burstiness,
 * predictable structure, and formulaic transitions.
 *
 * Pipeline:
 *   1. Analyze → measure AI-pattern metrics
 *   2. Deterministic fixes → apostrophes, banned words, structural variety
 *   3. LLM rewrite → targeted rewrites based on specific detected issues
 *   4. Validate → re-measure, reject if metrics didn't improve
 *   5. Loop up to 2 times if still flagged
 */

/* ── Types ─────────────────────────────────────────────────────────────── */

export interface HumanizeMetrics {
  sentenceLengthStdDev: number     // target: > 8 (AI is typically 3-5)
  avgSentenceLength: number
  shortSentenceRatio: number       // % of sentences <= 6 words. target: > 0.15
  longSentenceRatio: number        // % of sentences >= 25 words. target: > 0.10
  paragraphLengthVariance: number  // target: > 3
  startsWithSameWord: number       // consecutive paragraphs starting with same word
  formulaicTransitions: number     // count of detected formulaic transitions
  bannedWords: number              // count of AI-tell words
  missingApostrophes: number       // count of fixable contractions
  score: number                    // 0-100, higher = more human
}

export interface HumanizeResult {
  content: string
  title: string
  excerpt: string
  before: HumanizeMetrics
  after: HumanizeMetrics
  passes: number
}

/* ── Constants ─────────────────────────────────────────────────────────── */

const FORMULAIC_TRANSITIONS = [
  /but here'?s the thing:?/i,
  /what most people don'?t realize/i,
  /here'?s where it gets interesting/i,
  /the (real|important|key) (thing|question|point) is/i,
  /let me (explain|break this down|put it this way)/i,
  /in (other words|a nutshell|short)/i,
  /at the end of the day/i,
  /it'?s worth (noting|mentioning|pointing out)/i,
  /the bottom line is/i,
  /when it comes to/i,
  /it goes without saying/i,
  /needless to say/i,
  /that said,/i,
  /that being said,/i,
  /having said that,/i,
  /with that in mind,/i,
  /on the flip side,/i,
]

const PERFORMATIVE_OPENERS = [
  /^<p>\s*(hey |hello |hi |greetings |fellow |buckle up|picture this|let me tell you|grab your coffee|imagine this)/i,
  /^<p>\s*[A-Z][a-z]+ [A-Z][a-z]+ here[,.]?\s/i, // "Kofi Asante here,"
]

const META_COMMENTARY = [
  /i know what you'?re thinking/i,
  /stay with me (here|on this)/i,
  /bear with me/i,
  /but wait,? there'?s more/i,
  /\(just kidding[^)]*\)/i,
  /\(I promise[^)]*\)/i,
  /\(no,? really[^)]*\)/i,
  /\(pun intended\)/i,
  /\(see what I did there\)/i,
  /spoiler alert:?/i,
]

const BANNED_WORDS = [
  'seamless', 'seamlessly', 'leverage', 'robust', 'nuanced', 'landscape',
  'paradigm', 'delve', 'utilize', 'holistic', 'multifaceted', 'furthermore',
  'tapestry', 'game-changer', 'cutting-edge', 'groundbreaking', 'revolutionize',
  'revolutionizing', 'transformative', 'empower', 'empowering', 'unlock',
  'unlocking', 'harness', 'harnessing', 'spearhead', 'spearheading',
  'supercharge', 'supercharging', 'skyrocket', 'catapult', 'navigate',
  'navigating', 'streamline', 'streamlining', 'synergy', 'ecosystem',
  'deep dive', 'double down', 'move the needle', 'game changer',
]

const APOSTROPHE_FIXES: [RegExp, string][] = [
  [/\bIts\b(?!\s+own\b)/g, "It's"],
  [/\bits\b(?=\s+(?:a|an|the|not|no|been|going|hard|easy|like|about|just|really|pretty|clear|important|worth|possible|true|getting|becoming|starting|time|also|still|already|often|always|never|now))/gi, "it's"],
  [/\bDont\b/g, "Don't"], [/\bdont\b/g, "don't"],
  [/\bWont\b/g, "Won't"], [/\bwont\b/g, "won't"],
  [/\bCant\b/g, "Can't"], [/\bcant\b/g, "can't"],
  [/\bDidnt\b/g, "Didn't"], [/\bdidnt\b/g, "didn't"],
  [/\bDoesnt\b/g, "Doesn't"], [/\bdoesnt\b/g, "doesn't"],
  [/\bIsnt\b/g, "Isn't"], [/\bisnt\b/g, "isn't"],
  [/\bArent\b/g, "Aren't"], [/\barent\b/g, "aren't"],
  [/\bWasnt\b/g, "Wasn't"], [/\bwasnt\b/g, "wasn't"],
  [/\bHasnt\b/g, "Hasn't"], [/\bhasnt\b/g, "hasn't"],
  [/\bHavent\b/g, "Haven't"], [/\bhavent\b/g, "haven't"],
  [/\bWouldnt\b/g, "Wouldn't"], [/\bwouldnt\b/g, "wouldn't"],
  [/\bCouldnt\b/g, "Couldn't"], [/\bcouldnt\b/g, "couldn't"],
  [/\bShouldnt\b/g, "Shouldn't"], [/\bshouldnt\b/g, "shouldn't"],
  [/\bThats\b/g, "That's"], [/\bthats\b/g, "that's"],
  [/\bWhats\b/g, "What's"], [/\bwhats\b/g, "what's"],
  [/\bHeres\b/g, "Here's"], [/\bheres\b/g, "here's"],
  [/\bTheres\b/g, "There's"], [/\btheres\b/g, "there's"],
  [/\bYoure\b/g, "You're"], [/\byoure\b/g, "you're"],
  [/\bTheyre\b/g, "They're"], [/\btheyre\b/g, "they're"],
  [/\bIve\b/g, "I've"], [/\bIm\b(?=\s)/g, "I'm"], [/\bIll\b(?=\s)/g, "I'll"],
]

/* ── Analysis ──────────────────────────────────────────────────────────── */

function extractText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim()
}

function getSentences(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5)
}

function getParagraphs(html: string): string[] {
  return html.split(/<\/p>|<br\s*\/?>/).map(p => extractText(p).trim()).filter(p => p.length > 20)
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

export function analyzeContent(html: string): HumanizeMetrics {
  const text = extractText(html)
  const sentences = getSentences(text)
  const paragraphs = getParagraphs(html)

  const sentenceLengths = sentences.map(s => s.split(/\s+/).length)
  const sentenceLengthStdDev = stdDev(sentenceLengths)
  const avgSentenceLength = sentenceLengths.length > 0
    ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
    : 0

  const shortSentenceRatio = sentenceLengths.length > 0
    ? sentenceLengths.filter(l => l <= 6).length / sentenceLengths.length
    : 0
  const longSentenceRatio = sentenceLengths.length > 0
    ? sentenceLengths.filter(l => l >= 25).length / sentenceLengths.length
    : 0

  const paragraphLengths = paragraphs.map(p => p.split(/[.!?]+/).filter(s => s.trim().length > 5).length)
  const paragraphLengthVariance = stdDev(paragraphLengths)

  // Check consecutive paragraphs starting with the same word
  let startsWithSameWord = 0
  const paraFirstWords = paragraphs.map(p => (p.split(/\s+/)[0] ?? '').toLowerCase())
  for (let i = 1; i < paraFirstWords.length; i++) {
    if (paraFirstWords[i] === paraFirstWords[i - 1] && paraFirstWords[i].length > 2) {
      startsWithSameWord++
    }
  }

  // Count formulaic transitions
  let formulaicTransitions = 0
  for (const pattern of FORMULAIC_TRANSITIONS) {
    const matches = text.match(new RegExp(pattern.source, 'gi'))
    if (matches) formulaicTransitions += matches.length
  }

  // Count banned words
  let bannedWords = 0
  const lower = text.toLowerCase()
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const matches = lower.match(regex)
    if (matches) bannedWords += matches.length
  }

  // Count missing apostrophes
  let missingApostrophes = 0
  for (const [pattern] of APOSTROPHE_FIXES) {
    const matches = text.match(pattern)
    if (matches) missingApostrophes += matches.length
  }

  // Composite score (0-100, higher = more human)
  let score = 50
  score += Math.min(15, (sentenceLengthStdDev - 4) * 3)     // reward high variance
  score += Math.min(10, shortSentenceRatio * 50)              // reward short sentences
  score += Math.min(10, longSentenceRatio * 50)               // reward long sentences
  score += Math.min(10, (paragraphLengthVariance - 1) * 5)   // reward varied paragraphs
  score -= startsWithSameWord * 3                              // penalize same-start
  score -= formulaicTransitions * 4                            // penalize formulaic transitions
  score -= bannedWords * 2                                     // penalize AI words
  score -= missingApostrophes * 1                              // penalize missing apostrophes
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    sentenceLengthStdDev: Math.round(sentenceLengthStdDev * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    shortSentenceRatio: Math.round(shortSentenceRatio * 100) / 100,
    longSentenceRatio: Math.round(longSentenceRatio * 100) / 100,
    paragraphLengthVariance: Math.round(paragraphLengthVariance * 10) / 10,
    startsWithSameWord,
    formulaicTransitions,
    bannedWords,
    missingApostrophes,
    score,
  }
}

/* ── Deterministic Fixes ───────────────────────────────────────────────── */

function fixApostrophesHtml(html: string): string {
  const parts = html.split(/(<[^>]+>)/)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue
    for (const [pattern, replacement] of APOSTROPHE_FIXES) {
      parts[i] = parts[i].replace(pattern, replacement)
    }
  }
  return parts.join('')
}

function removeBannedWords(html: string): string {
  const replacements: [RegExp, string][] = [
    [/\bseamless(ly)?\b/gi, 'smooth$1'],
    [/\bleverage\b/gi, 'use'],
    [/\brobust\b/gi, 'solid'],
    [/\bnuanced\b/gi, 'subtle'],
    [/\blandscape\b/gi, 'space'],
    [/\bparadigm\b/gi, 'approach'],
    [/\bdelve\b/gi, 'dig'],
    [/\butilize\b/gi, 'use'],
    [/\bholistic\b/gi, 'complete'],
    [/\bmultifaceted\b/gi, 'complex'],
    [/\bfurthermore\b/gi, 'Also'],
    [/\btapestry\b/gi, 'mix'],
    [/\bcutting.edge\b/gi, 'latest'],
    [/\bgroundbreaking\b/gi, 'major'],
    [/\btransformative\b/gi, 'big'],
    [/\bsynergy\b/gi, 'overlap'],
    [/\bstreamline\b/gi, 'simplify'],
    [/\bstreamlining\b/gi, 'simplifying'],
    [/\bsupercharg(e|ing)\b/gi, 'boost$1'],
    [/\bspearhead(ing)?\b/gi, 'lead$1'],
    [/\bharness(ing)?\b/gi, 'use$1'],
    [/\bnavigate\b/gi, 'work through'],
    [/\bnavigating\b/gi, 'working through'],
    [/\bIn this article,? we will (discuss|explore|cover|examine|look at)\s*/gi, ''],
    [/\bLet's dive (in|into|deeper)\s*[.!]?\s*/gi, ''],
    [/\bWithout further ado,?\s*/gi, ''],
    [/\bin today's (rapidly evolving|fast.paced|ever.changing)\b/gi, "in today's"],
  ]

  const parts = html.split(/(<[^>]+>)/)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue
    for (const [pattern, replacement] of replacements) {
      parts[i] = parts[i].replace(pattern, replacement)
    }
  }
  return parts.join('')
}

function removePerformativeOpeners(html: string): string {
  for (const pattern of PERFORMATIVE_OPENERS) {
    html = html.replace(pattern, '<p>')
  }
  return html
}

function removeMetaCommentary(html: string): string {
  const parts = html.split(/(<[^>]+>)/)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue
    for (const pattern of META_COMMENTARY) {
      parts[i] = parts[i].replace(pattern, '')
    }
    // Clean up double spaces left behind
    parts[i] = parts[i].replace(/\s{2,}/g, ' ')
  }
  return parts.join('')
}

export function deterministicFixes(html: string): string {
  let result = html
  result = fixApostrophesHtml(result)
  result = removeBannedWords(result)
  result = removePerformativeOpeners(result)
  result = removeMetaCommentary(result)
  // Clean up empty paragraphs left behind
  result = result.replace(/<p>\s*<\/p>/g, '')
  return result
}

export function deterministicFixesText(text: string): string {
  if (!text) return text
  let fixed = text
  for (const [pattern, replacement] of APOSTROPHE_FIXES) {
    fixed = fixed.replace(pattern, replacement)
  }
  return fixed
}

/* ── LLM Rewrite (targeted, metrics-driven) ────────────────────────────── */

function buildRewritePrompt(metrics: HumanizeMetrics): string {
  const issues: string[] = []

  if (metrics.sentenceLengthStdDev < 7) {
    issues.push(
      `SENTENCE LENGTH IS TOO UNIFORM (std dev: ${metrics.sentenceLengthStdDev}, need >7). ` +
      `You MUST add variety: some sentences should be 3-5 words ("That's the real problem."), ` +
      `others 25-35 words with subclauses. Currently ${Math.round(metrics.shortSentenceRatio * 100)}% ` +
      `of sentences are short (need >15%) and ${Math.round(metrics.longSentenceRatio * 100)}% are ` +
      `long (need >10%).`
    )
  }

  if (metrics.paragraphLengthVariance < 2.5) {
    issues.push(
      `PARAGRAPHS ARE TOO UNIFORM IN LENGTH (variance: ${metrics.paragraphLengthVariance}). ` +
      `Some paragraphs should be a single sentence. Others should be 4-6 sentences. ` +
      `Mix dramatically.`
    )
  }

  if (metrics.startsWithSameWord > 1) {
    issues.push(
      `${metrics.startsWithSameWord} CONSECUTIVE PARAGRAPHS START WITH THE SAME WORD. ` +
      `Restructure openings. Start some paragraphs mid-thought: "Which is exactly why...", ` +
      `"Not that anyone asked, but...", or just jump to the data.`
    )
  }

  if (metrics.formulaicTransitions > 0) {
    issues.push(
      `${metrics.formulaicTransitions} FORMULAIC TRANSITIONS DETECTED (e.g. "But here's the thing:", ` +
      `"What most people don't realize"). Replace with natural flow or just start the next point directly.`
    )
  }

  return `You are a human editor. Your job is to rewrite this blog post so it passes AI detection tools.

AI DETECTORS WORK BY MEASURING:
1. PERPLEXITY: How predictable the next word is. AI text is very predictable. Human text has surprises.
2. BURSTINESS: Humans write in bursts — short punchy sentences mixed with long rambling ones. AI keeps sentences uniform.
3. STRUCTURAL REPETITION: AI repeats the same paragraph structure. Humans are messy and inconsistent.

SPECIFIC ISSUES TO FIX IN THIS POST:
${issues.length > 0 ? issues.map((iss, i) => `${i + 1}. ${iss}`).join('\n') : 'No specific structural issues detected — focus on reducing predictability.'}

REWRITE RULES:
- VARY SENTENCE LENGTH DRAMATICALLY. Aim for a mix: "No." (1 word), "That changes things." (3 words), then a 30-word sentence with subclauses. The standard deviation of sentence lengths should be above 8 words.
- ADD SENTENCE FRAGMENTS. Real people write fragments. On purpose. Especially for emphasis.
- BREAK PARAGRAPH PATTERNS. If you see three paragraphs in a row with the same structure (topic → explanation → example), restructure at least one. Start mid-thought. Combine two short paragraphs. Split a long one unexpectedly.
- USE UNEXPECTED WORD CHOICES. Instead of "significant" use "wild" or "weird" or "ridiculous". Instead of "demonstrates" use "shows" or "proves" or just cut it.
- START SENTENCES WITH CONJUNCTIONS: "And", "But", "So", "Or". Real writers do this constantly.
- ADD SPECIFICITY THAT CREATES SURPRISE. Exact version numbers, specific dates, named UI elements, precise dollar amounts. These lower perplexity because detectors don't expect them.
- LEAVE SOME IMPERFECTIONS. A comma splice here. A sentence that ends abruptly. A thought that continues across two paragraphs without a clean break.

ABSOLUTE RULES (violating these = rejection):
- KEEP all <a href="..."> links with exact same URLs and link text
- KEEP all <table>, <thead>, <tbody>, <tr>, <td>, <th> content identical
- KEEP all <h2> and <h3> text (minor rephrasing OK if it sounds AI-generated)
- KEEP all factual claims, tool names, pricing, statistics
- KEEP approximately the same word count (within 15%)
- Output valid HTML only — no markdown, no code fences, no commentary
- Do NOT add sections, disclaimers, or conclusions that weren't in the original

Return ONLY the rewritten HTML.`
}

export async function llmRewrite(
  content: string,
  metrics: HumanizeMetrics,
  googleApiKey: string,
): Promise<string> {
  const prompt = buildRewritePrompt(metrics)

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}\n\nHTML TO REWRITE:\n\n${content}` }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 16000 },
      }),
      signal: AbortSignal.timeout(120_000),
    },
  )

  if (!res.ok) return content

  const data = await res.json()
  let result = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
  result = result.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  // Safety checks
  if (result.length < content.length * 0.7 || result.length > content.length * 1.3) return content
  if (!result.includes('<h2') && content.includes('<h2')) return content
  if (!result.includes('<p')) return content

  return result
}

/* ── Full Pipeline ─────────────────────────────────────────────────────── */

const PASSING_SCORE = 68

export async function humanize(
  content: string,
  title: string,
  excerpt: string,
  googleApiKey: string,
  maxPasses = 2,
): Promise<HumanizeResult> {
  let current = content
  const before = analyzeContent(content)

  // Pass 1: Deterministic fixes (always run)
  current = deterministicFixes(current)
  const fixedTitle = deterministicFixesText(title)
  const fixedExcerpt = deterministicFixesText(excerpt)

  let metrics = analyzeContent(current)
  let passes = 1

  // Pass 2+: LLM rewrite if score is below threshold
  while (metrics.score < PASSING_SCORE && passes <= maxPasses) {
    current = await llmRewrite(current, metrics, googleApiKey)
    // Re-apply deterministic fixes after LLM (it might re-introduce banned words)
    current = deterministicFixes(current)
    metrics = analyzeContent(current)
    passes++
  }

  return {
    content: current,
    title: fixedTitle,
    excerpt: fixedExcerpt,
    before,
    after: metrics,
    passes,
  }
}
