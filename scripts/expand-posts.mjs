import { createClient } from '@supabase/supabase-js'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const XAI = 'https://api.x.ai/v1'
const KEY = process.env.XAI_API_KEY

// Get tool list for internal linking
const { data: toolRows } = await c.from('tools').select('name, slug').eq('status', 'published').order('upvote_count', { ascending: false }).limit(100)
const toolList = (toolRows ?? []).map(t => `${t.name} -> /tools/${t.slug}`).join('\n')

// Get all short posts
const { data: posts } = await c.from('blog_posts').select('id, title, content, excerpt, tags')
  .eq('status', 'published')

const shortPosts = posts.filter(p => {
  const words = p.content.replace(/<[^>]+>/g, '').split(/\s+/).length
  return words < 1200
})

console.log(`Expanding ${shortPosts.length} posts under 1200 words...\n`)

for (let i = 0; i < shortPosts.length; i++) {
  const post = shortPosts[i]
  const currentWords = post.content.replace(/<[^>]+>/g, '').split(/\s+/).length
  console.log(`${i + 1}/${shortPosts.length}: ${post.title.substring(0, 50)} (${currentWords} words)`)

  const prompt = `You are expanding an existing blog post to make it rank better on Google. The current post is too short at ${currentWords} words. Google's top-ranking informational content averages 1,500-2,500 words.

CURRENT TITLE: ${post.title}
CURRENT CONTENT:
${post.content}

EXPAND this post to 1,500-2,000 words. Keep the existing content but ADD:

1. More depth to each existing section (specific examples, data points, comparisons)
2. 2-3 new H2 sections that explore related angles people search for
3. A practical "How to get started" or "Step by step" section with numbered steps
4. A comparison table if the topic involves multiple tools or approaches
5. A FAQ section at the end with 3 H3 questions ending in ? and direct answer paragraphs
6. 4-6 internal links to tools using <a href="/tools/SLUG">Tool Name</a> format

TOOLS ON OUR SITE (for internal linking):
${toolList.substring(0, 2500)}

WRITING RULES:
- Keep the original voice and tone
- No em dashes, en dashes, semicolons, or spaced hyphens
- No AI giveaway words: seamless, leverage, robust, nuanced, landscape, paradigm, delve, utilize, holistic, multifaceted, furthermore
- Write like a knowledgeable person who types fast, not a polished journalist
- Include specific tool names, pricing, features. Not vague statements.
- HTML format: h2, h3, p, ul/li, table, blockquote, strong, em, a tags
- Wrap in <article> tags. No h1.

Return ONLY the expanded HTML content. Nothing else.`

  try {
    const res = await fetch(`${XAI}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: 'grok-3-mini-fast', max_tokens: 8000, temperature: 0.8, messages: [{ role: 'user', content: prompt }] }),
    })

    if (!res.ok) { console.log(`  Grok failed: ${res.status}`); continue }
    const data = await res.json()
    let expanded = (data.choices?.[0]?.message?.content ?? '').trim()

    // Clean up: ensure it starts with <article> and ends with </article>
    if (!expanded.startsWith('<article>')) {
      const match = expanded.match(/<article>[\s\S]*<\/article>/)
      if (match) expanded = match[0]
      else { console.log('  No article tags found'); continue }
    }

    const newWords = expanded.replace(/<[^>]+>/g, '').split(/\s+/).length
    if (newWords < currentWords) { console.log(`  Shorter than original (${newWords}), skipping`); continue }

    await c.from('blog_posts').update({
      content: expanded,
      reading_time_min: Math.max(4, Math.ceil(newWords / 250)),
      updated_at: new Date().toISOString(),
    }).eq('id', post.id)

    console.log(`  ${currentWords} -> ${newWords} words`)
  } catch (err) {
    console.log(`  Error: ${err.message?.substring(0, 60)}`)
  }

  await new Promise(r => setTimeout(r, 3000))
}

console.log('\nDone!')
