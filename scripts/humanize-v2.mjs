/**
 * Humanize all blog posts using the metrics-driven humanizer module.
 * Uses the same lib/utils/humanizer.ts that the cron uses.
 *
 * Usage:
 *   node scripts/humanize-v2.mjs              # Dry run (show scores)
 *   node scripts/humanize-v2.mjs --apply      # Apply changes
 *   node scripts/humanize-v2.mjs --apply --limit=5
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      val = val.replace(/\\n$/, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* ok */ }
}
loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const googleKey = process.env.GOOGLE_API_KEY

if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase env'); process.exit(1) }
if (!googleKey) { console.error('Missing GOOGLE_API_KEY'); process.exit(1) }

const supabase = createClient(supabaseUrl, supabaseKey)
const args = process.argv.slice(2)
const apply = args.includes('--apply')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 999

/* ── Import humanizer (compiled from TS via dynamic import workaround) ── */

// We can't directly import TS, so we inline the core logic here
// matching lib/utils/humanizer.ts exactly

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta'

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
  /^<p>\s*[A-Z][a-z]+ [A-Z][a-z]+ here[,.]?\s/i,
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

const APOSTROPHE_FIXES = [
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

function extractText(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim()
}

function getSentences(text) {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5)
}

function getParagraphs(html) {
  return html.split(/<\/p>|<br\s*\/?>/).map(p => extractText(p).trim()).filter(p => p.length > 20)
}

function stdDev(arr) {
  if (arr.length < 2) return 0
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length
  const variance = arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

function analyze(html) {
  const text = extractText(html)
  const sentences = getSentences(text)
  const paragraphs = getParagraphs(html)

  const sentenceLengths = sentences.map(s => s.split(/\s+/).length)
  const slStdDev = stdDev(sentenceLengths)
  const avgSL = sentenceLengths.length > 0 ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length : 0
  const shortRatio = sentenceLengths.length > 0 ? sentenceLengths.filter(l => l <= 6).length / sentenceLengths.length : 0
  const longRatio = sentenceLengths.length > 0 ? sentenceLengths.filter(l => l >= 25).length / sentenceLengths.length : 0

  const paraLengths = paragraphs.map(p => p.split(/[.!?]+/).filter(s => s.trim().length > 5).length)
  const paraVariance = stdDev(paraLengths)

  let sameStarts = 0
  const firstWords = paragraphs.map(p => (p.split(/\s+/)[0] ?? '').toLowerCase())
  for (let i = 1; i < firstWords.length; i++) {
    if (firstWords[i] === firstWords[i - 1] && firstWords[i].length > 2) sameStarts++
  }

  let formulaic = 0
  for (const p of FORMULAIC_TRANSITIONS) {
    const m = text.match(new RegExp(p.source, 'gi'))
    if (m) formulaic += m.length
  }

  let banned = 0
  const lower = text.toLowerCase()
  for (const w of BANNED_WORDS) {
    const r = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const m = lower.match(r)
    if (m) banned += m.length
  }

  const emDashes = (text.match(/[\u2014\u2013]|(\s--\s)/g) ?? []).length
  const questions = (text.match(/\?\s/g) ?? []).length

  let score = 45
  score += Math.min(15, (slStdDev - 4) * 3)
  score += Math.min(10, shortRatio * 50)
  score += Math.min(10, longRatio * 50)
  score += Math.min(10, (paraVariance - 1) * 5)
  score += Math.min(8, questions * 2)
  score -= sameStarts * 3
  score -= formulaic * 5
  score -= banned * 3
  score -= emDashes * 2
  score = Math.max(0, Math.min(100, Math.round(score)))

  return { slStdDev: Math.round(slStdDev * 10) / 10, avgSL: Math.round(avgSL * 10) / 10, shortRatio: Math.round(shortRatio * 100), longRatio: Math.round(longRatio * 100), paraVariance: Math.round(paraVariance * 10) / 10, sameStarts, formulaic, banned, score }
}

function deterministicFixes(html) {
  const parts = html.split(/(<[^>]+>)/)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue
    for (const [pattern, replacement] of APOSTROPHE_FIXES) {
      parts[i] = parts[i].replace(pattern, replacement)
    }
    // Banned word replacements
    parts[i] = parts[i].replace(/\bseamless(ly)?\b/gi, 'smooth$1')
    parts[i] = parts[i].replace(/\bleverage\b/gi, 'use')
    parts[i] = parts[i].replace(/\brobust\b/gi, 'solid')
    parts[i] = parts[i].replace(/\bnuanced\b/gi, 'subtle')
    parts[i] = parts[i].replace(/\blandscape\b/gi, 'space')
    parts[i] = parts[i].replace(/\bparadigm\b/gi, 'approach')
    parts[i] = parts[i].replace(/\bdelve\b/gi, 'dig')
    parts[i] = parts[i].replace(/\butilize\b/gi, 'use')
    parts[i] = parts[i].replace(/\bholistic\b/gi, 'complete')
    parts[i] = parts[i].replace(/\bmultifaceted\b/gi, 'complex')
    parts[i] = parts[i].replace(/\bfurthermore\b/gi, 'Also')
    parts[i] = parts[i].replace(/\btapestry\b/gi, 'mix')
    parts[i] = parts[i].replace(/\bcutting.edge\b/gi, 'latest')
    parts[i] = parts[i].replace(/\bgroundbreaking\b/gi, 'major')
    parts[i] = parts[i].replace(/\btransformative\b/gi, 'big')
    parts[i] = parts[i].replace(/\bsynergy\b/gi, 'overlap')
    parts[i] = parts[i].replace(/\bstreamline\b/gi, 'simplify')
    parts[i] = parts[i].replace(/\bsupercharg(e|ing)\b/gi, 'boost$1')
    parts[i] = parts[i].replace(/\bharness(ing)?\b/gi, 'use$1')
    parts[i] = parts[i].replace(/\bIn this article,? we will (discuss|explore|cover|examine|look at)\s*/gi, '')
    parts[i] = parts[i].replace(/\bLet's dive (in|into|deeper)\s*[.!]?\s*/gi, '')
    parts[i] = parts[i].replace(/\bin today's (rapidly evolving|fast.paced|ever.changing)\b/gi, "in today's")
    // Meta commentary
    for (const p of META_COMMENTARY) parts[i] = parts[i].replace(p, '')
    parts[i] = parts[i].replace(/\s{2,}/g, ' ')
  }
  // Performative openers
  let result = parts.join('')
  for (const p of PERFORMATIVE_OPENERS) result = result.replace(p, '<p>')
  // Em-dashes (major AI fingerprint)
  result = result.replace(/\u2014/g, '. ')
  result = result.replace(/\u2013/g, ', ')
  result = result.replace(/\s*--\s*/g, '. ')
  result = result.replace(/\.\.\s/g, '. ')
  result = result.replace(/<p>\s*<\/p>/g, '')
  return result
}

function fixText(text) {
  if (!text) return text
  let f = text
  for (const [p, r] of APOSTROPHE_FIXES) f = f.replace(p, r)
  return f
}

function buildPrompt(metrics) {
  const issues = []
  if (metrics.slStdDev < 7) {
    issues.push(
      `SENTENCE LENGTH TOO UNIFORM (std dev: ${metrics.slStdDev}, need >7). ` +
      `Add variety: "That's it." (3 words) mixed with 25-35 word sentences. ` +
      `Currently ${metrics.shortRatio}% short (need >15%), ${metrics.longRatio}% long (need >10%).`
    )
  }
  if (metrics.paraVariance < 2.5) {
    issues.push(`PARAGRAPHS TOO UNIFORM (variance: ${metrics.paraVariance}). Some should be 1 sentence. Others 4-6.`)
  }
  if (metrics.sameStarts > 1) {
    issues.push(`${metrics.sameStarts} CONSECUTIVE PARAGRAPHS START WITH SAME WORD. Restructure openings.`)
  }
  if (metrics.formulaic > 0) {
    issues.push(`${metrics.formulaic} FORMULAIC TRANSITIONS. Replace with natural flow or just start the next point.`)
  }

  return `You are rewriting a blog post to defeat AI detectors. This is a technical task, not creative writing.

HOW AI DETECTORS ACTUALLY WORK (from GPTZero's own documentation):
- PERPLEXITY: They run each sentence through a language model and measure how predictable each word is. "The sky is blue" = low perplexity (AI). "The sky is remembering the rain we never had" = high perplexity (human). Score above 85 per sentence = human.
- BURSTINESS: The VARIANCE of perplexity across sentences. Humans write some predictable AND some unpredictable sentences. AI keeps it uniform. HIGH burstiness = human.
- You need BOTH boring predictable sentences AND weird surprising ones. The MIX reads as human.

SPECIFIC METRICS TO FIX:
${issues.length > 0 ? issues.map((iss, i) => `${i + 1}. ${iss}`).join('\n') : 'Focus on increasing perplexity variance.'}

TECHNIQUES THAT BEAT DETECTORS:

1. WORD-LEVEL SURPRISE: Replace the most predictable word with something unexpected but correct. "significant improvement" → "ridiculous improvement". "excellent results" → "weirdly good results". One unexpected word per 2-3 sentences.

2. SENTENCE RHYTHM: Some dead simple. Then a long winding one with tangents. The CONTRAST matters.
   Bad: "The model is fast. The accuracy is high. The pricing is fair."
   Good: "Fast. Like, unreasonably fast for what you're paying, which is $20/mo if you go annual."

3. RHETORICAL QUESTIONS: Scatter 3-5 throughout. "Why does this matter?" "Sound familiar?"

4. IDIOMS AND CULTURAL REFERENCES: 2-3 per post. "That's like bringing a knife to a gunfight." "This is the Toyota Corolla of AI tools."

5. INTERRUPTED THOUGHTS: Start a point, abandon it. "The pricing is. actually, let me talk about the free tier first."

6. DELIBERATE IMPERFECTIONS: Start sentences with "And"/"But"/"So". Use a comma splice. End a paragraph abruptly. Use "like" as filler once.

7. SPECIFIC DETAILS: "there's a blue dropdown in the top-left that took me 3 clicks to find" instead of "the interface is intuitive".

8. PARAGRAPH VARIETY: One single-sentence paragraph. One 5+ sentence paragraph. One that starts mid-thought. One that's a question.

ABSOLUTE RULES:
- KEEP all <a href="..."> links with exact URLs and text
- KEEP all <table> content identical
- KEEP all <h2>/<h3> headers (minor rephrasing OK)
- KEEP all facts, tool names, pricing, statistics
- Same word count within 15%
- Valid HTML only, no markdown code fences
- Do NOT add new sections or conclusions

Return ONLY the rewritten HTML.`
}

async function llmRewrite(content, metrics) {
  const prompt = buildPrompt(metrics)
  const res = await fetch(
    `${GEMINI_URL}/models/gemini-2.5-flash:generateContent?key=${googleKey}`,
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
  if (!res.ok) { console.warn(`  ⚠ Gemini ${res.status}`); return content }
  const data = await res.json()
  let result = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
  result = result.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
  if (result.length < content.length * 0.7 || result.length > content.length * 1.3) { console.warn('  ⚠ Length mismatch, keeping original'); return content }
  if (!result.includes('<h2') && content.includes('<h2')) { console.warn('  ⚠ Headers stripped, keeping original'); return content }
  if (!result.includes('<p')) { console.warn('  ⚠ No paragraphs, keeping original'); return content }
  return result
}

const PASSING_SCORE = 75

async function main() {
  console.log(`\n📝 Humanize V2 — Metrics-Driven${apply ? ' (APPLY)' : ' (DRY RUN)'}\n`)

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) { console.error('Fetch failed:', error.message); process.exit(1) }
  console.log(`Found ${posts.length} posts\n`)

  let improved = 0, skipped = 0, failed = 0

  for (const post of posts) {
    const before = analyze(post.content)
    console.log(`📊 ${post.slug}`)
    console.log(`   Before: score=${before.score} slStdDev=${before.slStdDev} short=${before.shortRatio}% long=${before.longRatio}% formulaic=${before.formulaic} banned=${before.banned}`)

    // Phase 1: deterministic
    let current = deterministicFixes(post.content)
    let metrics = analyze(current)

    // Phase 2+: LLM rewrite if needed
    let passes = 1
    while (metrics.score < PASSING_SCORE && passes <= 3) {
      console.log(`   Pass ${passes}: score=${metrics.score} < ${PASSING_SCORE}, rewriting...`)
      current = await llmRewrite(current, metrics)
      current = deterministicFixes(current) // re-clean after LLM
      metrics = analyze(current)
      passes++
      await new Promise(r => setTimeout(r, 1500))
    }

    const fixedTitle = fixText(post.title)
    const fixedExcerpt = fixText(post.excerpt)

    console.log(`   After:  score=${metrics.score} slStdDev=${metrics.slStdDev} short=${metrics.shortRatio}% long=${metrics.longRatio}% (${passes} passes)`)

    if (metrics.score <= before.score && current === post.content) {
      console.log('   ⏭ No improvement, skipping')
      skipped++
      continue
    }

    if (apply) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ content: current, title: fixedTitle, excerpt: fixedExcerpt })
        .eq('id', post.id)

      if (updateError) {
        console.log(`   ❌ ${updateError.message}`)
        failed++
      } else {
        console.log(`   ✅ Updated (${before.score} → ${metrics.score})`)
        improved++
      }
    } else {
      console.log(`   Would update (${before.score} → ${metrics.score})`)
      improved++
    }
  }

  console.log(`\n✅ ${improved} improved | ⏭ ${skipped} skipped | ❌ ${failed} failed`)
  if (!apply) console.log('Run with --apply to save changes')
}

main().catch(console.error)
