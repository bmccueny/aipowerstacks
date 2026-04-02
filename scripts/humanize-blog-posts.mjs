/**
 * Humanize all published blog posts in Supabase
 *
 * Phase 1: Deterministic fixes (apostrophes, AI phrases, formatting)
 * Phase 2: LLM rewrite via Grok for deeper humanization
 *
 * Usage:
 *   node scripts/humanize-blog-posts.mjs              # Dry run (preview changes)
 *   node scripts/humanize-blog-posts.mjs --apply      # Apply deterministic fixes only
 *   node scripts/humanize-blog-posts.mjs --deep       # Apply fixes + LLM rewrite
 *   node scripts/humanize-blog-posts.mjs --apply --limit=5  # Process only 5 posts
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
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, supabaseKey)

const args = process.argv.slice(2)
const apply = args.includes('--apply') || args.includes('--deep')
const deep = args.includes('--deep')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 999

/* ── Phase 1: Deterministic fixes ──────────────────────────────────────── */

/** Fix missing apostrophes in common contractions (outside HTML tags) */
function fixApostrophes(html) {
  // Split into tags and text
  const parts = html.split(/(<[^>]+>)/)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue // skip HTML tags

    let text = parts[i]
    // Common contractions - case insensitive with word boundaries
    const fixes = [
      [/\bIts\b(?!\s+own\b)/g, "It's"],       // "Its" -> "It's" (but not "Its own")
      [/\bits\b(?=\s+(?:a|an|the|not|no|been|going|hard|easy|like|about|just|really|pretty|clear|important|worth|possible|impossible|true|getting|becoming|starting|time|also|still|already|often|always|never|now))/gi, "it's"],
      [/\bDont\b/g, "Don't"],
      [/\bdont\b/g, "don't"],
      [/\bWont\b/g, "Won't"],
      [/\bwont\b/g, "won't"],
      [/\bCant\b/g, "Can't"],
      [/\bcant\b/g, "can't"],
      [/\bDidnt\b/g, "Didn't"],
      [/\bdidnt\b/g, "didn't"],
      [/\bDoesnt\b/g, "Doesn't"],
      [/\bdoesnt\b/g, "doesn't"],
      [/\bIsnt\b/g, "Isn't"],
      [/\bisnt\b/g, "isn't"],
      [/\bArent\b/g, "Aren't"],
      [/\barent\b/g, "aren't"],
      [/\bWasnt\b/g, "Wasn't"],
      [/\bwasnt\b/g, "wasn't"],
      [/\bWerent\b/g, "Weren't"],
      [/\bwerent\b/g, "weren't"],
      [/\bHasnt\b/g, "Hasn't"],
      [/\bhasnt\b/g, "hasn't"],
      [/\bHavent\b/g, "Haven't"],
      [/\bhavent\b/g, "haven't"],
      [/\bWouldnt\b/g, "Wouldn't"],
      [/\bwouldnt\b/g, "wouldn't"],
      [/\bCouldnt\b/g, "Couldn't"],
      [/\bcouldnt\b/g, "couldn't"],
      [/\bShouldnt\b/g, "Shouldn't"],
      [/\bshouldnt\b/g, "shouldn't"],
      [/\bThats\b/g, "That's"],
      [/\bthats\b/g, "that's"],
      [/\bWhats\b/g, "What's"],
      [/\bwhats\b/g, "what's"],
      [/\bHeres\b/g, "Here's"],
      [/\bheres\b/g, "here's"],
      [/\bTheres\b/g, "There's"],
      [/\btheres\b/g, "there's"],
      [/\bWhos\b/g, "Who's"],
      [/\bwhos\b/g, "who's"],
      [/\bYoure\b/g, "You're"],
      [/\byoure\b/g, "you're"],
      [/\bTheyre\b/g, "They're"],
      [/\btheyre\b/g, "they're"],
      [/\bWere\b(?=\s+(?:not|going|still|just|already|also|actually))/g, "We're"],
      [/\bwere\b(?=\s+(?:not|going|still|just|already|also|actually))/g, "we're"],
      [/\bIve\b/g, "I've"],
      [/\bIm\b(?=\s)/g, "I'm"],
      [/\bIll\b(?=\s)/g, "I'll"],
      [/\bId\b(?=\s+(?:say|argue|recommend|suggest|bet|love|rather|like))/g, "I'd"],
      [/\bYoud\b/g, "You'd"],
      [/\byoud\b/g, "you'd"],
      [/\bTheyd\b/g, "They'd"],
      [/\btheyd\b/g, "they'd"],
      [/\bWed\b(?=\s+(?:say|argue|recommend|suggest|bet|love|rather|like|all|be|need|have|get|see))/g, "We'd"],
    ]

    for (const [pattern, replacement] of fixes) {
      text = text.replace(pattern, replacement)
    }
    parts[i] = text
  }
  return parts.join('')
}

/** Remove/replace AI-sounding phrases */
function removeAIPhrases(html) {
  const parts = html.split(/(<[^>]+>)/)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue

    let text = parts[i]
    // Remove filler openers
    text = text.replace(/In this article,? we will (discuss|explore|cover|examine|look at)\s*/gi, '')
    text = text.replace(/Let's dive (in|into|deeper)\s*[.!]?\s*/gi, '')
    text = text.replace(/Without further ado,?\s*/gi, '')

    // Replace banned words with simpler alternatives
    text = text.replace(/\bseamless(ly)?\b/gi, 'smooth$1')
    text = text.replace(/\bleverage\b/gi, 'use')
    text = text.replace(/\brobust\b/gi, 'solid')
    text = text.replace(/\bnuanced\b/gi, 'subtle')
    text = text.replace(/\blandscape\b/gi, 'space')
    text = text.replace(/\bparadigm\b/gi, 'approach')
    text = text.replace(/\bdelve\b/gi, 'dig')
    text = text.replace(/\butilize\b/gi, 'use')
    text = text.replace(/\bholistic\b/gi, 'complete')
    text = text.replace(/\bmultifaceted\b/gi, 'complex')
    text = text.replace(/\bfurthermore\b/gi, 'Also')
    text = text.replace(/\btapestry\b/gi, 'mix')
    text = text.replace(/\bgame.changer\b/gi, 'big deal')
    text = text.replace(/\bcutting.edge\b/gi, 'latest')
    text = text.replace(/\bgroundbreaking\b/gi, 'major')
    text = text.replace(/\brevolutionize\b/gi, 'change')
    text = text.replace(/\bunlock(ing)?\b/gi, 'open$1')
    text = text.replace(/\bempower(ing|s)?\b/gi, 'help$1')
    text = text.replace(/\btransformative\b/gi, 'big')
    text = text.replace(/\bin today's (rapidly evolving|fast.paced|ever.changing)\b/gi, "in today's")

    parts[i] = text
  }
  return parts.join('')
}

/** Fix apostrophes in titles/excerpts (no banned-word replacement — those sound fine in headlines) */
function fixText(text) {
  if (!text) return text
  let fixed = text
  fixed = fixed.replace(/\bIts\b(?!\s+own\b)/g, "It's")
  fixed = fixed.replace(/\bDont\b/g, "Don't")
  fixed = fixed.replace(/\bdont\b/g, "don't")
  fixed = fixed.replace(/\bCant\b/g, "Can't")
  fixed = fixed.replace(/\bcant\b/g, "can't")
  fixed = fixed.replace(/\bThats\b/g, "That's")
  fixed = fixed.replace(/\bthats\b/g, "that's")
  fixed = fixed.replace(/\bDoesnt\b/g, "Doesn't")
  fixed = fixed.replace(/\bdoesnt\b/g, "doesn't")
  fixed = fixed.replace(/\bIsnt\b/g, "Isn't")
  fixed = fixed.replace(/\bisnt\b/g, "isn't")
  fixed = fixed.replace(/\bYoure\b/g, "You're")
  fixed = fixed.replace(/\byoure\b/g, "you're")
  fixed = fixed.replace(/\bIve\b/g, "I've")
  fixed = fixed.replace(/\bIm\b(?=\s)/g, "I'm")
  fixed = fixed.replace(/\bHeres\b/g, "Here's")
  fixed = fixed.replace(/\bheres\b/g, "here's")
  fixed = fixed.replace(/\bWhats\b/g, "What's")
  fixed = fixed.replace(/\bwhats\b/g, "what's")
  return fixed
}

/* ── Phase 2: LLM humanization (optional, --deep) ─────────────────────── */

const XAI_KEY = process.env.XAI_API_KEY
const GOOGLE_KEY = process.env.GOOGLE_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta'

async function llmHumanize(content, editorVoice) {
  if (!GOOGLE_KEY && !XAI_KEY) {
    console.warn('  ⚠ No API key set (GOOGLE_API_KEY or XAI_API_KEY), skipping')
    return content
  }

  const prompt = `You are a ruthless editor removing AI-generated writing patterns from a blog post. Your goal: make this read like a real human wrote it on their laptop at 11pm, not like an LLM performed "being human."

VOICE STYLE: ${editorVoice || 'Conversational, opinionated tech writer'}

AI PATTERNS TO KILL (these are the specific tells that make content scream "AI wrote this"):

1. PERFORMATIVE OPENERS: Delete any opening that performs personality before getting to the point. "Hey fellow humans", "Buckle up", "Grab your coffee", "[Name] here, ready to...", "Let me tell you...", "Picture this..." — CUT THEM. Start with the actual claim, news, or insight. A real writer leads with the thing they're excited about, not with throat-clearing.

2. META-COMMENTARY: Remove all self-aware asides about being a blog post. "I know what you're thinking", "Stay with me here", "Bear with me", "But wait, there's more", "(just kidding)", "(I promise this is going somewhere)". Real writers don't constantly reassure the reader that the article is worth reading.

3. STACKED ADJECTIVES: "The swirling, delightful, and utterly bewildering world of..." — kill these triple-adjective constructions. Pick ONE good adjective or use none. Real writing is specific, not decorative.

4. FORMULAIC TRANSITIONS: "But here's the thing:", "What most people don't realize is...", "The trick is...", "Here's where it gets interesting:" — these are LLM transition templates. Replace with actual transitions that flow from the previous paragraph, or just start the next point directly.

5. MANUFACTURED ENTHUSIASM: "This is genuinely mind-bending!", "I was absolutely blown away", "This changes EVERYTHING" — tone down the hype. Real writers express excitement through specificity ("the latency dropped from 2s to 40ms") not through adjective inflation.

6. FAKE PERSONAL ANECDOTES: If a story feels generic ("I tried this last week and was surprised...") with no specific details (what exactly? what happened? what version?), either add concrete details or remove the fake story entirely. A missing anecdote is better than an obviously invented one.

7. HEDGING SANDWICHES: The pattern of [bold claim] + [immediate hedge] + [reassurance]. Example: "AI will replace most jobs. Well, maybe not all of them. But the ones it does replace..." — just pick a position and argue it.

8. NUMBERED LIST ADDICTION: If the post is basically "Here are 7 reasons..." with each section being one paragraph, restructure some sections into flowing prose. Not everything needs to be a list.

9. IDENTICAL PARAGRAPH STRUCTURE: If 3+ paragraphs in a row follow the same pattern (topic sentence → explanation → example → conclusion), break the pattern. Vary it. Some paragraphs should be 1 sentence. Some should be 5.

STRICT RULES:
- KEEP all <a href="..."> links exactly as they are — do not change URLs or link text
- KEEP all <table>, <thead>, <tbody>, <tr>, <td>, <th> content intact
- KEEP all <h2> and <h3> headers (you may slightly rephrase them if they sound AI-generated)
- KEEP all factual claims, tool names, pricing data, and statistics
- KEEP the overall structure (same number of sections, same topics covered)
- The output MUST be valid HTML — do not break tags
- Do NOT add any new sections, disclaimers, or conclusions that weren't there
- Do NOT wrap your response in markdown code blocks

Return ONLY the transformed HTML content.`

  let result = ''

  if (GOOGLE_KEY) {
    // Use Gemini
    const res = await fetch(
      `${GEMINI_URL}/models/gemini-2.5-flash:generateContent?key=${GOOGLE_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\nHere is the blog post HTML to rewrite:\n\n${content}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 16000 },
        }),
        signal: AbortSignal.timeout(120_000),
      },
    )
    if (!res.ok) {
      console.warn(`  ⚠ Gemini failed: ${res.status}`)
      return content
    }
    const data = await res.json()
    result = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
  } else {
    // Fallback: XAI
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${XAI_KEY}` },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        max_tokens: 16000,
        temperature: 0.7,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Here is the blog post HTML to rewrite:\n\n${content}` },
        ],
      }),
    })
    if (!res.ok) {
      console.warn(`  ⚠ XAI failed: ${res.status}`)
      return content
    }
    const data = await res.json()
    result = (data.choices?.[0]?.message?.content ?? '').trim()
  }

  // Strip markdown code fences if LLM wrapped output
  result = result.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  // Safety: reject if the LLM stripped too much content or broke HTML
  if (result.length < content.length * 0.7) {
    console.warn('  ⚠ LLM output too short, keeping original')
    return content
  }
  if (!result.includes('<h2') && content.includes('<h2')) {
    console.warn('  ⚠ LLM stripped headers, keeping original')
    return content
  }

  return result
}

/* ── Main ──────────────────────────────────────────────────────────────── */

// Editor voice lookup for LLM phase
const EDITOR_VOICES = {
  'c131993d-8710-43f9-91ef-fb194d7113c0': 'Morgan Housel storyteller style',
  '54cd616d-c866-4f41-8ec9-f6cd57190b4a': 'Paul Graham conversational essay style',
  '8d0cf351-70ee-428c-bc76-164f1ee1b929': 'Tim Urban funny explainer style',
  '21b72dfb-882c-44ec-afc0-3a7f5391af70': 'Lenny Rachitsky data-driven with frameworks',
  '4cc6e534-b024-4bf4-bd26-c382412e5802': 'Ben Thompson strategic analysis style',
  '6e9bf129-5598-4947-9282-c4fe5ed40ef7': 'Kyla Scanlon Gen Z energy meets tech literacy',
  'be2d6e6d-5ac7-4eed-a37e-1125dd05f964': 'Casey Newton tech journalist style',
  '1a089886-3a67-4332-8fc9-849561897b8c': 'Simon Willison developer-who-tests-everything style',
  '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8': 'Anne-Laure Le Cunff neuroscience meets productivity',
}

async function main() {
  console.log(`\n📝 Humanize Blog Posts${apply ? (deep ? ' (DEEP MODE)' : ' (APPLY MODE)') : ' (DRY RUN)'}\n`)

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, author_id')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to fetch posts:', error.message)
    process.exit(1)
  }

  console.log(`Found ${posts.length} published posts\n`)

  let changed = 0
  let unchanged = 0

  for (const post of posts) {
    // Phase 1: Deterministic fixes
    const fixedContent = removeAIPhrases(fixApostrophes(post.content))
    const fixedTitle = fixText(post.title)
    const fixedExcerpt = fixText(post.excerpt)

    const contentChanged = fixedContent !== post.content
    const titleChanged = fixedTitle !== post.title
    const excerptChanged = fixedExcerpt !== post.excerpt

    if (!contentChanged && !titleChanged && !excerptChanged && !deep) {
      unchanged++
      continue
    }

    // Count what changed
    const contentDiffs = []
    if (contentChanged) {
      const origWords = post.content.replace(/<[^>]+>/g, '').split(/\s+/).length
      const fixedWords = fixedContent.replace(/<[^>]+>/g, '').split(/\s+/).length
      contentDiffs.push(`content (${origWords} → ${fixedWords} words)`)
    }
    if (titleChanged) contentDiffs.push(`title: "${post.title}" → "${fixedTitle}"`)
    if (excerptChanged) contentDiffs.push(`excerpt changed`)

    console.log(`✏️  ${post.slug}`)
    if (contentDiffs.length > 0) console.log(`   Phase 1: ${contentDiffs.join(', ')}`)

    let finalContent = fixedContent

    // Phase 2: LLM humanization (if --deep)
    if (deep) {
      console.log('   Phase 2: LLM humanizing...')
      const voice = EDITOR_VOICES[post.author_id] || 'Conversational tech writer'
      finalContent = await llmHumanize(fixedContent, voice)
      console.log('   Phase 2: done')
      // Rate limit
      await new Promise(r => setTimeout(r, 2000))
    }

    if (apply) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          content: finalContent,
          title: fixedTitle,
          excerpt: fixedExcerpt,
        })
        .eq('id', post.id)

      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`)
      } else {
        console.log('   ✅ Updated')
      }
    }

    changed++
  }

  console.log(`\n${apply ? 'Updated' : 'Would update'}: ${changed} posts`)
  console.log(`Unchanged: ${unchanged} posts`)
  if (!apply) console.log('\nRun with --apply to save changes, or --deep for LLM rewrite too')
}

main().catch(console.error)
