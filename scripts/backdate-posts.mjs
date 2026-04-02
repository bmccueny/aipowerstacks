import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const XAI = 'https://api.x.ai/v1'
const KEY = process.env.XAI_API_KEY

const editors = {
  andrew: 'c131993d-8710-43f9-91ef-fb194d7113c0',
  cassie: '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
  ethan: '8d0cf351-70ee-428c-bc76-164f1ee1b929',
  zain: '21b72dfb-882c-44ec-afc0-3a7f5391af70',
  marcus: '4cc6e534-b024-4bf4-bd26-c382412e5802',
  lena: '6e9bf129-5598-4947-9282-c4fe5ed40ef7',
  aisha: 'be2d6e6d-5ac7-4eed-a37e-1125dd05f964',
  dev: '1a089886-3a67-4332-8fc9-849561897b8c',
  sofia: '1c882cdc-fcbd-4ce1-9441-9514bfbde5c8',
  pete: 'db388dbe-ce6a-4bc3-876d-793e4ce37904',
}

const { data: cats } = await c.from('blog_categories').select('id').limit(1)
const catId = cats?.[0]?.id || null

const { data: toolRows } = await c.from('tools').select('name, slug').eq('status', 'published').order('upvote_count', { ascending: false }).limit(100)
const toolList = (toolRows ?? []).map(t => `${t.name} -> /tools/${t.slug}`).join('\n')

const postSpecs = [
  { date: '2025-10-08', editor: 'pete', topic: 'The Rise of AI Coding Agents: Why 2025 Changed Everything', keyword: 'AI coding agents 2025', style: 'cyberpunk-anime' },
  { date: '2025-10-22', editor: 'cassie', topic: 'Open Source AI Models vs Closed APIs: A Data-Driven Comparison', keyword: 'open source vs closed AI models', style: 'data-viz' },
  { date: '2025-11-05', editor: 'marcus', topic: 'I Replaced My Entire Dev Toolchain With AI Tools', keyword: 'AI developer tools review', style: 'retro-pixel' },
  { date: '2025-11-19', editor: 'lena', topic: 'AI Image Generators Ranked: Midjourney vs Stable Diffusion vs Flux', keyword: 'best AI image generator 2025', style: 'editorial-illustration' },
  { date: '2025-12-03', editor: 'zain', topic: 'The 10 AI Tools That Saved Me 20 Hours a Week', keyword: 'AI productivity tools 2025', style: 'youtube-thumbnail' },
  { date: '2025-12-17', editor: 'aisha', topic: 'AI Marketing Tools That Actually Drive Revenue', keyword: 'AI marketing tools ROI', style: 'pop-art' },
  { date: '2026-01-07', editor: 'dev', topic: 'Self-Hosting AI: A Guide to Running Models Locally', keyword: 'self host AI models locally', style: 'isometric' },
  { date: '2026-01-21', editor: 'ethan', topic: 'How Students Are Using AI to Study Smarter in 2026', keyword: 'AI study tools for students', style: 'minimalist-3d' },
  { date: '2026-02-04', editor: 'sofia', topic: 'AI Video Tools Compared: Runway vs Pika vs Kling', keyword: 'best AI video generator 2026', style: 'photorealistic' },
  { date: '2026-02-18', editor: 'andrew', topic: 'The State of AI in 2026: What Matters and What is Noise', keyword: 'state of AI 2026', style: 'editorial-illustration' },
]

async function generatePost(spec) {
  const prompt = `You are writing an SEO-optimized blog post for AIPowerStacks (an AI tools directory).

TARGET KEYWORD: ${spec.keyword}
TOPIC: ${spec.topic}

Write a blog post following these rules:

SEO RULES:
- Title must be under 60 characters, include the target keyword and year
- Excerpt/meta description: 150-160 chars with target keyword
- 800-1200 words
- H2 headers with secondary keywords
- Include at least one comparison table or numbered list
- End with FAQ section: 2-3 H3 questions ending in ? with direct answer paragraphs
- Internal links: use <a href="/tools/SLUG">Tool Name</a> for 4-6 tools

TOOLS ON OUR SITE:
${toolList.substring(0, 3000)}

WRITING STYLE - CRITICAL FOR AVOIDING AI DETECTION:
- Write like you're explaining to a friend, not a journalist
- First person, opinionated, conversational
- Use contractions: "don't", "can't", "it's", "I'm"
- Add hedging words naturally: "I think", "might be", "in my experience"
- Mix sentence lengths - add short punchy sentences for emphasis
- Include a specific personal story or experience (invent one if needed)
- Add a "hot take" or opinion that some might disagree with
- Use casual language: "honestly", "actually", "basically", "stuff", "things"
- NO em dashes or semicolons
- NO perfect structure - slightly imperfect is better
- Strong hook opening - grab attention in first sentence
- Be honest about limitations and what didn't work

FORMATTING:
- HTML only (h2, h3, p, ul/li, table, blockquote, strong, em, a)
- No h1 tag. Wrap in <article> tags.

Return ONLY valid JSON:
{
  "title": "<max 60 chars>",
  "excerpt": "<150-160 chars>",
  "content": "<full HTML>",
  "tags": ["tag1", "tag2", "tag3"],
  "reading_time_min": <number>
}`

  const res = await fetch(`${XAI}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'grok-3-mini-fast', max_tokens: 5000, temperature: 0.85, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) throw new Error(`Grok failed: ${res.status}`)
  const data = await res.json()
  const text = (data.choices?.[0]?.message?.content ?? '').trim()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found')
  return JSON.parse(match[0])
}

async function generateCover(title, style) {
  const metaRes = await fetch(`${XAI}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: 'grok-3-mini', max_tokens: 200, temperature: 0.9,
      messages: [{ role: 'user', content: `YouTube thumbnail headline for: "${title}"\n\nReturn ONLY:\nHEADLINE: [1-3 ALL CAPS words MAX]\nKEYWORD: [one word]\nCOLOR: [yellow/red/lime/cyan/orange/magenta]` }]
    })
  })
  const meta = await metaRes.json()
  const resp = (meta.choices?.[0]?.message?.content ?? '').trim()
  let headline = (resp.match(/HEADLINE:\s*(.+)/i)?.[1] ?? 'AI TOOLS').trim().split(/\s+/).slice(0, 3).join(' ')
  const keyword = (resp.match(/KEYWORD:\s*(.+)/i)?.[1] ?? 'AI').trim()
  const color = (resp.match(/COLOR:\s*(.+)/i)?.[1] ?? 'yellow').trim()

  const scenes = {
    'data-viz': 'Dark navy with glowing charts and data streams. Electric blue, teal. NO people.',
    'editorial-illustration': 'Bold conceptual illustration, flat colors, geometric shapes. Abstract. NO people.',
    'minimalist-3d': 'Clean 3D object on gradient background. Soft lighting. NO people.',
    'isometric': 'Isometric tech workspace with devices. Pastel-to-bold flat design. NO people.',
    'pop-art': 'Comic-book pop art, Ben-Day dots, thick outlines, primary colors.',
    'cyberpunk-anime': 'Cyberpunk anime, neon streets, holographic displays. Neon pink, electric blue.',
    'retro-pixel': 'Pixel art 8-bit style. Neon on dark. CRT scanlines.',
    'youtube-thumbnail': 'A person resembling Pedro Pascal with modified features, excited expression. Vivid tech scene. 8K cinematic.',
    'photorealistic': 'A woman resembling Saoirse Ronan with modified features, pointing at camera. Colorful tech background. 8K.',
  }
  const scene = scenes[style] || scenes['editorial-illustration']
  const prompt = `${scene} The image MUST contain bold 3D text "${headline}" at bottom. "${keyword}" larger in bright ${color}. Others white with black outline. 16:9. aipowerstacks.com watermark top right. NO other text.`

  const imgRes = await fetch(`${XAI}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'grok-imagine-image', prompt, n: 1 })
  })
  if (!imgRes.ok) return null
  const imgData = await imgRes.json()
  const url = imgData?.data?.[0]?.url
  if (!url) return null

  const dlRes = await fetch(url)
  const buf = Buffer.from(await dlRes.arrayBuffer())
  const final = await sharp(buf).jpeg({ quality: 92 }).toBuffer()
  const fname = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) + '-' + Date.now()
  const { data: up } = await c.storage.from('blog-images').upload(`covers/${fname}.jpeg`, final, { contentType: 'image/jpeg', upsert: true })
  if (!up) return null
  return c.storage.from('blog-images').getPublicUrl(up.path).data.publicUrl
}

for (let i = 0; i < postSpecs.length; i++) {
  const spec = postSpecs[i]
  console.log(`${i + 1}/10: ${spec.topic.substring(0, 50)} [${spec.date}]`)

  try {
    const post = await generatePost(spec)
    console.log(`  Title: ${post.title}`)

    const coverUrl = await generateCover(post.title, spec.style)
    console.log(`  Cover: ${coverUrl ? 'OK' : 'FAILED'}`)

    const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80) + '-' + Date.now().toString(36)

    const { error } = await c.from('blog_posts').insert({
      title: post.title,
      slug,
      excerpt: post.excerpt,
      content: post.content,
      author_id: editors[spec.editor],
      tags: post.tags || [],
      reading_time_min: post.reading_time_min || 5,
      status: 'published',
      published_at: new Date(spec.date + 'T10:00:00Z').toISOString(),
      created_at: new Date(spec.date + 'T10:00:00Z').toISOString(),
      category_id: catId,
      cover_image_url: coverUrl,
    })

    if (error) console.error(`  DB Error: ${error.message}`)
    else console.log('  Published!')
  } catch (err) {
    console.error(`  Error: ${err.message?.substring(0, 80)}`)
  }

  await new Promise(r => setTimeout(r, 5000))
}

console.log('\nDone!')
