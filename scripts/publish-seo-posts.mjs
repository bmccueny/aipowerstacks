import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const XAI = 'https://api.x.ai/v1'
const KEY = process.env.XAI_API_KEY

const editors = {
  cassie: '54cd616d-c866-4f41-8ec9-f6cd57190b4a',
  zain: '21b72dfb-882c-44ec-afc0-3a7f5391af70',
  aisha: 'be2d6e6d-5ac7-4eed-a37e-1125dd05f964',
}

const posts = [
  {
    title: 'ChatGPT vs Claude vs Gemini in 2026: Which AI Is Actually Worth Your Money?',
    slug: 'chatgpt-vs-claude-vs-gemini-2026-' + Date.now().toString(36),
    excerpt: 'We tested all three AI assistants head-to-head on coding, writing, research, and creative tasks. Here\'s which one wins each category — and which subscription is actually worth $20/month.',
    author_id: editors.cassie,
    tags: ['comparison', 'chatgpt', 'claude', 'gemini', 'review'],
    reading_time_min: 12,
    content: `<article>
<p>Everyone asks the same question: ChatGPT, Claude, or Gemini? After spending three months using all three daily across coding, writing, research, and creative work, here's my honest breakdown.</p>

<h2>The Quick Verdict</h2>
<p>If you can only pick one: <strong><a href="/tools/chatgpt" class="text-primary hover:underline font-medium">ChatGPT</a></strong> is the best all-rounder. <strong><a href="/tools/claude-code" class="text-primary hover:underline font-medium">Claude</a></strong> wins for coding and long-form writing. <strong>Gemini</strong> wins for research and Google ecosystem integration. But the details matter more than the summary.</p>

<h2>Coding: Claude Wins, and It's Not Close</h2>
<p>I gave all three the same task: refactor a 400-line React component into smaller pieces while maintaining all existing tests.</p>
<ul>
<li><strong>Claude</strong> understood the component architecture, preserved test coverage, and even caught a race condition I'd missed. The 200K context window meant I could paste the entire file plus tests.</li>
<li><strong>ChatGPT</strong> did a competent job but missed two edge cases and didn't preserve one integration test.</li>
<li><strong>Gemini</strong> struggled with the large context and produced code that wouldn't compile on the first try.</li>
</ul>
<p>For coding, <a href="/tools/claude-code" class="text-primary hover:underline font-medium">Claude Code</a> is the clear winner. If you're a developer, this alone justifies the subscription. Pair it with <a href="/tools/cursor-editor" class="text-primary hover:underline font-medium">Cursor</a> and you're unstoppable.</p>

<h2>Writing: Claude Leads, ChatGPT Close Behind</h2>
<p>I tested blog posts, emails, and marketing copy. Claude produces the most natural, nuanced prose — it follows style guides precisely and maintains voice consistency across long documents. ChatGPT is faster and better at casual content. Gemini's writing feels corporate and stiff.</p>

<h2>Research: Gemini and ChatGPT Tie</h2>
<p>Gemini's integration with Google Search gives it real-time web access that feels native. ChatGPT's Deep Research mode is slower but more thorough. Claude has no web access at all.</p>
<p>But honestly? For research, skip all three and use <a href="/tools/perplexity-ai" class="text-primary hover:underline font-medium">Perplexity AI</a>. It's purpose-built for this and beats them all.</p>

<h2>Creative Tasks: ChatGPT Wins</h2>
<p>Image generation, voice mode, custom GPTs, multimodal input — ChatGPT's ecosystem is unmatched. Need a logo concept? GPT Image. Need to brainstorm while walking? Voice mode. Claude and Gemini can't compete here.</p>

<h2>My Recommendation</h2>
<p><strong>For most people:</strong> Start with ChatGPT Plus. <strong>For developers:</strong> Claude Pro. <strong>For Google users:</strong> Gemini Advanced. <strong>For research:</strong> <a href="/tools/perplexity-ai" class="text-primary hover:underline font-medium">Perplexity Pro</a>.</p>
<p>All three have free tiers. Try each for a week with your actual workflow before committing.</p>
<p><em>Compare these tools side-by-side with our <a href="/compare?tools=chatgpt,claude-code,perplexity-ai" class="text-primary hover:underline font-medium">comparison tool</a>.</em></p>
</article>`,
  },

  {
    title: 'The 15 Best Free AI Tools in 2026 (No Credit Card, No Catch)',
    slug: 'best-free-ai-tools-2026-' + Date.now().toString(36),
    excerpt: 'Subscription fatigue is real. These 15 AI tools are genuinely free — not trial-limited, not feature-crippled. We tested each one and ranked them by how much value you get without paying.',
    author_id: editors.zain,
    tags: ['free tools', 'ai tools', 'productivity', 'guide', '2026'],
    reading_time_min: 10,
    content: `<article>
<p>I'm tired of "free AI tools" lists that are really just 30-day trials. Here are 15 tools where the free tier is genuinely useful — no credit card required, no bait-and-switch.</p>

<h2>The Best Free AI Tools Right Now</h2>

<h3>1. <a href="/tools/chatgpt" class="text-primary hover:underline font-medium">ChatGPT</a> — Best Free AI Assistant</h3>
<p>Free tier gives you GPT-4o mini with limited GPT-5.3 access. Web browsing, image understanding, and Deep Research included. More than enough for 90% of daily AI use.</p>

<h3>2. <a href="/tools/perplexity-ai" class="text-primary hover:underline font-medium">Perplexity AI</a> — Best Free Research Tool</h3>
<p>Five free Pro searches per day plus unlimited quick searches. Every answer comes with cited sources. More useful than most paid research tools.</p>

<h3>3. <a href="/tools/notebooklm" class="text-primary hover:underline font-medium">NotebookLM</a> — Best Free Study Tool</h3>
<p>100% free. Upload papers and get AI-generated study guides and Audio Overviews. Google's sleeper hit with no paid tier at all.</p>

<h3>4. <a href="/tools/canva" class="text-primary hover:underline font-medium">Canva</a> — Best Free Design Tool</h3>
<p>Magic Design, background remover, thousands of templates. For social media and presentations, you never need to upgrade.</p>

<h3>5. <a href="/tools/github-copilot" class="text-primary hover:underline font-medium">GitHub Copilot</a> — Best Free Coding Assistant</h3>
<p>Free for students and open-source maintainers. Everyone else gets a generous free tier with Copilot Chat in VS Code.</p>

<h3>6. <a href="/tools/grammarly" class="text-primary hover:underline font-medium">Grammarly</a> — Best Free Writing Checker</h3>
<p>Grammar, spelling, and punctuation across every platform. The Chrome extension works everywhere you type.</p>

<h3>7. <a href="/tools/suno" class="text-primary hover:underline font-medium">Suno</a> — Best Free Music Generator</h3>
<p>50 free credits per day generating full songs with vocals. Professional quality, genuinely usable output.</p>

<h3>8. <a href="/tools/ideogram" class="text-primary hover:underline font-medium">Ideogram</a> — Best Free Image Generator</h3>
<p>25 free generations per day with the best text-in-image rendering of any AI. Logos, posters, social graphics.</p>

<h3>9. <a href="/tools/descript-ai" class="text-primary hover:underline font-medium">Descript</a> — Best Free Video Editor</h3>
<p>One hour of free transcription per month with text-based video editing. Edit the transcript, the video follows.</p>

<h3>10. <a href="/tools/elevenlabs-dubbing" class="text-primary hover:underline font-medium">ElevenLabs</a> — Best Free Voice Generator</h3>
<p>10,000 free characters per month. Natural-sounding voices that blow away other free TTS options.</p>

<h3>11. <a href="/tools/pika" class="text-primary hover:underline font-medium">Pika</a> — Best Free Video Generator</h3>
<p>250 free credits monthly. Generate videos from text, add motion to photos, modify clips.</p>

<h3>12. <a href="/tools/zapier" class="text-primary hover:underline font-medium">Zapier</a> — Best Free Automation Tool</h3>
<p>100 free tasks per month. Connect apps and automate workflows with AI actions that understand plain English.</p>

<h3>13. <a href="/tools/bolt-new" class="text-primary hover:underline font-medium">Bolt.new</a> — Best Free App Builder</h3>
<p>Build full-stack web apps in your browser by describing what you want. Perfect for prototypes and hackathons.</p>

<h3>14. <a href="/tools/liner" class="text-primary hover:underline font-medium">Liner</a> — Best Free Research Highlighter</h3>
<p>Highlight and organize information across the web with AI summaries. Chrome extension turns browsing into knowledge.</p>

<h3>15. <a href="/tools/stability-ai" class="text-primary hover:underline font-medium">Stable Diffusion</a> — Best Free Image Generator (Self-Hosted)</h3>
<p>Completely free, open source, unlimited. Run on your own GPU for zero restrictions. Community models for any style.</p>

<p><em>Browse all free AI tools in our <a href="/tools?pricing=free" class="text-primary hover:underline font-medium">free tools directory</a>.</em></p>
</article>`,
  },

  {
    title: 'AI Tools for Small Business: A No-BS Guide to What Actually Works in 2026',
    slug: 'ai-tools-small-business-guide-2026-' + Date.now().toString(36),
    excerpt: 'Most AI guides are written for developers or enterprise. This one is for the small business owner who wants to save time without learning to code. 10 tools that deliver real ROI.',
    author_id: editors.aisha,
    tags: ['small business', 'productivity', 'ai tools', 'guide', 'roi'],
    reading_time_min: 11,
    content: `<article>
<p>I consult for small businesses adopting AI. Most waste weeks evaluating tools built for engineering teams. This guide is for the 5-50 person business that wants results, not experiments.</p>

<h2>The 5-Tool Stack That Works for 90% of Small Businesses</h2>

<h3>1. <a href="/tools/chatgpt" class="text-primary hover:underline font-medium">ChatGPT</a> Plus ($20/mo) — Your AI Swiss Army Knife</h3>
<p>Not for chatbots. For you and your team. Draft emails, analyze competitors, brainstorm marketing. Build custom GPTs for your specific business. A landscaping client built one that generates estimates from photos. $20/month that saves 5+ hours per week.</p>

<h3>2. <a href="/tools/canva" class="text-primary hover:underline font-medium">Canva</a> Pro ($13/mo) — Design Without a Designer</h3>
<p>Social posts, email headers, flyers, presentations, business cards. Magic Design generates on-brand templates instantly. Your designer handles the big stuff; Canva handles the other 80%.</p>

<h3>3. <a href="/tools/zapier" class="text-primary hover:underline font-medium">Zapier</a> (Free-$20/mo) — The Unsexy Time-Saver</h3>
<p>New lead? Auto-send welcome email + notify sales on Slack. New review? Auto-post a thank you. Start free. When you hit the limit, you'll know it's worth paying for.</p>

<h3>4. <a href="/tools/fireflies-ai" class="text-primary hover:underline font-medium">Fireflies.ai</a> (Free-$17/mo) — Stop Taking Meeting Notes</h3>
<p>Joins your Zoom/Teams calls, transcribes, summarizes, extracts action items. Clients save 3-5 hours per week on meeting follow-ups alone.</p>

<h3>5. <a href="/tools/grammarly" class="text-primary hover:underline font-medium">Grammarly</a> Business ($15/user) — Brand Voice Guardrail</h3>
<p>Every customer email and proposal runs through Grammarly. Set brand voice guidelines and every team member writes consistently.</p>

<h2>Worth Knowing About</h2>
<p><a href="/tools/superhuman" class="text-primary hover:underline font-medium">Superhuman</a> if email is your job. <a href="/tools/heygen" class="text-primary hover:underline font-medium">HeyGen</a> if you sell internationally (one video, 40 languages). <a href="/tools/perplexity-ai" class="text-primary hover:underline font-medium">Perplexity</a> for competitor research.</p>

<h2>What NOT to Buy</h2>
<ul>
<li><strong>AI chatbots for your website</strong> — Unless you have 1000+ monthly tickets, a FAQ page works better.</li>
<li><strong>Dedicated AI writers (Jasper, Copy.ai)</strong> — ChatGPT does the same thing for $20 vs $50+.</li>
<li><strong>Anything requiring a "demo call"</strong> — Not built for you. Walk away.</li>
<li><strong>Tools needing 30+ min setup</strong> — Your team won't use them.</li>
</ul>

<h2>How to Get Your Team Using AI</h2>
<ol>
<li><strong>Month 1:</strong> ChatGPT Plus for everyone. That's it.</li>
<li><strong>Month 2:</strong> One Zapier automation for the most hated repetitive task.</li>
<li><strong>Month 3:</strong> Add Canva + Grammarly. Track hours saved.</li>
</ol>
<p>Numbers overcome resistance. "Weekly reports went from 3 hours to 20 minutes" sells AI adoption better than any pitch.</p>

<p><em>Find tools for your business in our <a href="/tools?pricing=freemium" class="text-primary hover:underline font-medium">directory</a> or get personalized picks from the <a href="/matchmaker" class="text-primary hover:underline font-medium">AI Matchmaker</a>.</em></p>
</article>`,
  },
]

// Get blog category
const { data: cats } = await c.from('blog_categories').select('id').limit(1)
const catId = cats?.[0]?.id || null

for (const post of posts) {
  const { error } = await c.from('blog_posts').insert({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    author_id: post.author_id,
    tags: post.tags,
    reading_time_min: post.reading_time_min,
    status: 'published',
    published_at: new Date().toISOString(),
    category_id: catId,
  })
  if (error) console.error('Error:', post.title.substring(0, 40), error.message)
  else console.log('Published:', post.title.substring(0, 60))
}

// Generate covers
console.log('\nGenerating covers...')
const { data: newPosts } = await c.from('blog_posts').select('id, title, excerpt')
  .in('slug', posts.map(p => p.slug))

const coverStyles = ['youtube-thumbnail', 'editorial-illustration', 'photorealistic']
const sceneMap = {
  'youtube-thumbnail': 'A person resembling Oscar Isaac with modified features, pointing excitedly at camera. Vivid tech scene with floating AI logos. 8K cinematic lighting.',
  'editorial-illustration': 'Bold conceptual illustration: gift boxes and free price tags floating with geometric shapes. Flat colors, coral/navy/cream palette. Abstract modern editorial. NO people.',
  'photorealistic': 'A woman resembling Florence Pugh with modified features, confidently gesturing toward a holographic business dashboard. Warm lighting, professional setting. 8K cinematic.',
}

for (let i = 0; i < (newPosts?.length || 0); i++) {
  const post = newPosts[i]
  const style = coverStyles[i]
  console.log('Cover for:', post.title.substring(0, 45), '[' + style + ']')

  const metaRes = await fetch(XAI + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY },
    body: JSON.stringify({
      model: 'grok-3-mini', max_tokens: 300, temperature: 0.9,
      messages: [{ role: 'user', content: `YouTube thumbnail headline for: "${post.title}"\n\nReturn ONLY:\nHEADLINE: [1-3 ALL CAPS short words, MAX 3]\nKEYWORD: [one word]\nCOLOR: [yellow/red/lime/cyan/orange/magenta]` }]
    })
  })
  const meta = await metaRes.json()
  const resp = (meta.choices?.[0]?.message?.content ?? '').trim()
  let headline = resp.match(/HEADLINE:\s*(.+)/i)?.[1]?.trim() ?? 'AI TOOLS'
  headline = headline.split(/\s+/).slice(0, 3).join(' ')
  const keyword = resp.match(/KEYWORD:\s*(.+)/i)?.[1]?.trim() ?? 'AI'
  const color = resp.match(/COLOR:\s*(.+)/i)?.[1]?.trim() ?? 'yellow'
  console.log('  Text:', headline, '| KW:', keyword)

  const scene = sceneMap[style]
  const prompt = scene + ` The image MUST contain bold 3D text "${headline}" at the bottom. "${keyword}" is larger and in bright ${color}. Other words white with black outline. YouTube thumbnail style. "aipowerstacks.com" watermark top right. 16:9. NO other text.`

  const imgRes = await fetch(XAI + '/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + KEY },
    body: JSON.stringify({ model: 'grok-imagine-image', prompt, n: 1 })
  })
  if (!imgRes.ok) { console.log('  Image failed'); continue }
  const imgData = await imgRes.json()
  const url = imgData?.data?.[0]?.url
  if (!url) continue

  const dlRes = await fetch(url)
  const buf = Buffer.from(await dlRes.arrayBuffer())
  const final = await sharp(buf).jpeg({ quality: 92 }).toBuffer()
  const fname = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50) + '-' + Date.now()
  const { data: up } = await c.storage.from('blog-images').upload('covers/' + fname + '.jpeg', final, { contentType: 'image/jpeg', upsert: true })
  if (up) {
    const pubUrl = c.storage.from('blog-images').getPublicUrl(up.path).data.publicUrl
    await c.from('blog_posts').update({ cover_image_url: pubUrl }).eq('id', post.id)
    console.log('  Cover saved')
  }
  await new Promise(r => setTimeout(r, 3000))
}

console.log('\nDone!')
