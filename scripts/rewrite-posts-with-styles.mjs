import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const XAI = 'https://api.x.ai/v1'
const KEY = process.env.XAI_API_KEY

// Load style guides
const styleGuides = {}
const files = fs.readdirSync('docs/writing-styles').filter(f => f.endsWith('.md') && f !== 'README.md')
for (const file of files) {
  const content = fs.readFileSync(`docs/writing-styles/${file}`, 'utf-8')
  const editorMatch = content.match(/Mapped to editor:\*\* (.+?) \(/)
  if (editorMatch) {
    styleGuides[editorMatch[1].trim()] = content
  }
}
console.log('Loaded style guides for:', Object.keys(styleGuides).join(', '))

// Editor ID to name mapping
const editorNames = {
  'c131993d-8710-43f9-91ef-fb194d7113c0': 'Rina Takahashi',
  '54cd616d-c866-4f41-8ec9-f6cd57190b4a': 'Tomás Herrera',
  '8d0cf351-70ee-428c-bc76-164f1ee1b929': 'Kofi Asante',
  '21b72dfb-882c-44ec-afc0-3a7f5391af70': 'Mila Orozco',
  '4cc6e534-b024-4bf4-bd26-c382412e5802': 'Idris Mensah',
  '6e9bf129-5598-4947-9282-c4fe5ed40ef7': 'Suki Watanabe',
  'be2d6e6d-5ac7-4eed-a37e-1125dd05f964': 'Yara Dominguez',
  '1a089886-3a67-4332-8fc9-849561897b8c': 'Niko Petrov',
  '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8': 'Amara Chen',
  'db388dbe-ce6a-4bc3-876d-793e4ce37904': 'Jalen Okafor',
  'af08a3d0-f4fa-42c1-b24f-7bf87b510105': 'Davi Santos',
  '4789889d-7077-445c-a7fb-63bbee7e1a74': 'Priya Nadeem',
}

// Extra style guides for editors not in the blog cron
const extraStyles = {
  'Jalen Okafor': 'Writes like Packy McCormick (Not Boring). Pop culture references, tech optimism, "Lets go." transitions. Mix of one-word sentences ("Wild.") and deep analytical paragraphs. Uses italics for emphasis. Starts paragraphs with "Look," or "Heres the thing:". Never pessimistic without a counterpoint. Never boring.',
  'Davi Santos': 'Writes like Sahil Bloom. Framework builder. Numbered lists. Each point is a mini-essay. "Heres the truth:" before key insights. Personal anecdotes. Bold headers for each framework point. Ends with "The bottom line:" and one actionable sentence. Thread-style formatting. Short to medium sentences. Punchy. Direct.',
  'Priya Nadeem': 'Writes like James Clear. Minimalist. Says more with less. Every sentence earns its place. Opens with a quote or one-sentence insight. Extremely short paragraphs. Rule of three. Creates memorable one-liners. Strips everything to essentials. 8-15 words average. No qualifiers. Active voice exclusively.',
}

// Get tool list for internal linking
const { data: toolRows } = await c.from('tools').select('name, slug').eq('status', 'published').order('upvote_count', { ascending: false }).limit(100)
const toolList = (toolRows ?? []).map(t => `${t.name} -> /tools/${t.slug}`).join('\n')

// Get all published posts
const { data: posts } = await c.from('blog_posts').select('id, title, content, author_id, excerpt, tags')
  .eq('status', 'published')
  .order('published_at', { ascending: false })

console.log(`\nRewriting ${posts.length} posts...\n`)

let rewritten = 0
for (let i = 0; i < posts.length; i++) {
  const post = posts[i]
  const editorName = editorNames[post.author_id]
  if (!editorName) { console.log(`${i+1}/${posts.length}: ${post.title.substring(0,40)} - NO EDITOR FOUND`); continue }

  const styleGuide = styleGuides[editorName] || extraStyles[editorName] || ''
  if (!styleGuide) { console.log(`${i+1}/${posts.length}: ${post.title.substring(0,40)} - NO STYLE GUIDE`); continue }

  console.log(`${i+1}/${posts.length}: ${post.title.substring(0,45)} [${editorName}]`)

  const currentWords = post.content.replace(/<[^>]+>/g, '').split(/\s+/).length

  const prompt = `You are rewriting an existing blog post to match a specific writer's voice and style. Keep the same topic, facts, and structure but completely change the WRITING STYLE to match the guide below.

WRITER STYLE GUIDE:
${typeof styleGuide === 'string' && styleGuide.length > 200 ? styleGuide.substring(0, 1500) : styleGuide}

TITLE: ${post.title}
CURRENT CONTENT:
${post.content.substring(0, 4000)}

REWRITE RULES:
- Keep the same topic, key facts, tool mentions, and internal links
- COMPLETELY change the voice, sentence structure, and personality to match the style guide
- Maintain 1500-2000 words minimum
- Keep all existing <a href="/tools/..."> internal links
- HTML format (h2, h3, p, ul/li, table, a, strong, em). Wrap in <article> tags. No h1.
- Keep any FAQ sections at the end
- BANNED WORDS: seamless, leverage, robust, nuanced, landscape, paradigm, delve, utilize, holistic, multifaceted, furthermore
- No em dashes, en dashes, semicolons
- The rewrite should sound like a COMPLETELY DIFFERENT PERSON wrote it

TOOLS ON OUR SITE (for any new internal links):
${toolList.substring(0, 2000)}

Return ONLY the rewritten HTML content. Nothing else.`

  try {
    const res = await fetch(`${XAI}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: 'grok-3-mini-fast', max_tokens: 8000, temperature: 0.85, messages: [{ role: 'user', content: prompt }] }),
    })

    if (!res.ok) { console.log(`  Grok failed: ${res.status}`); continue }
    const data = await res.json()
    let rewrittenContent = (data.choices?.[0]?.message?.content ?? '').trim()

    // Ensure it has article tags
    if (!rewrittenContent.startsWith('<article>')) {
      const match = rewrittenContent.match(/<article>[\s\S]*<\/article>/)
      if (match) rewrittenContent = match[0]
      else { console.log('  No article tags'); continue }
    }

    const newWords = rewrittenContent.replace(/<[^>]+>/g, '').split(/\s+/).length
    if (newWords < 500) { console.log(`  Too short (${newWords}), skipping`); continue }

    await c.from('blog_posts').update({
      content: rewrittenContent,
      reading_time_min: Math.max(4, Math.ceil(newWords / 250)),
      updated_at: new Date().toISOString(),
    }).eq('id', post.id)

    console.log(`  ${currentWords} -> ${newWords} words`)
    rewritten++
  } catch (err) {
    console.log(`  Error: ${err.message?.substring(0, 60)}`)
  }

  await new Promise(r => setTimeout(r, 4000))
}

console.log(`\nDone! Rewritten ${rewritten}/${posts.length} posts`)
