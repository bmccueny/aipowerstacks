import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const XAI = 'https://api.x.ai/v1'
const KEY = process.env.XAI_API_KEY

const { data: cats } = await c.from('blog_categories').select('id').limit(1)
const catId = cats?.[0]?.id || null

const title = 'Claude Dispatch: Send AI Tasks From Your Phone'
const excerpt = 'Anthropic just shipped Dispatch for Claude Cowork. Message Claude from your phone, it works on your desktop while you are away. Here is how it works and why it matters.'

const content = `<article>
<p>Anthropic dropped something genuinely new last week. Not another model update or benchmark flex. A feature that changes how you actually use AI day to day.</p>

<p><strong>Claude Dispatch</strong> lets you message <a href="/tools/claude-code" class="text-primary hover:underline font-medium">Claude</a> from your phone and it executes tasks on your desktop computer while youre away. One persistent conversation across both devices. You text it a task on your commute, come back to finished work on your desk.</p>

<h2>What Dispatch Actually Does</h2>

<p>Think of it like texting an assistant who has access to your computer. You message Claude from the mobile app saying "research competitors in the AI tools space and put a summary in my Google Doc." Claude opens your browser, searches, reads pages, writes the doc. You get a push notification when its done.</p>

<p>The key difference from just using Claude on your phone: Dispatch runs on your actual desktop with access to your files, your browser, your dev tools. Its not a cloud VM. Its your machine.</p>

<h2>How to Set It Up</h2>

<table>
<thead><tr><th>Step</th><th>What to Do</th></tr></thead>
<tbody>
<tr><td>1</td><td>Download or update Claude Desktop app (macOS or Windows)</td></tr>
<tr><td>2</td><td>Update Claude mobile app (iOS or Android)</td></tr>
<tr><td>3</td><td>Open Cowork on either device</td></tr>
<tr><td>4</td><td>Click "Dispatch" in the side panel</td></tr>
<tr><td>5</td><td>Toggle on file access and keep-awake</td></tr>
<tr><td>6</td><td>Start messaging tasks from your phone</td></tr>
</tbody>
</table>

<p>Requirements: Pro or Max plan ($20 or $100/month), both apps updated to latest version, computer must be awake with app open.</p>

<h2>What You Can Actually Do With It</h2>

<p>The obvious use cases are the ones that actually work well right now:</p>

<ul>
<li><strong>Research while commuting:</strong> "Find the top 10 AI video tools launched this month and put them in a spreadsheet"</li>
<li><strong>Code tasks:</strong> "Fix that failing test in the auth module and push a PR." Claude spins up a Claude Code session and does it.</li>
<li><strong>Content prep:</strong> "Draft a blog post about AI coding agents based on this weeks trending reddit discussions"</li>
<li><strong>Data work:</strong> "Pull our analytics from last week and create a comparison chart"</li>
</ul>

<p>Claude figures out whether the task needs Claude Code (development) or Cowork (knowledge work) and spins up the right session automatically. You dont have to specify.</p>

<h2>Computer Use: The Secret Sauce</h2>

<p>When Claude doesnt have a direct integration for something, it falls back to <strong>computer use</strong>, meaning it literally controls your mouse and keyboard. It can open apps, click buttons, navigate websites, fill forms.</p>

<p>This sounds scary but Anthropic built in safeguards. Claude asks permission before accessing new apps. It cant see passwords or sensitive fields. And you can watch what its doing in real time from the desktop app.</p>

<p>The computer use is still early. Its slower than direct integrations and sometimes misclicks. But for tasks like "open my email and summarize the unread ones" or "check the Vercel dashboard for any failed deploys," it works well enough to be useful.</p>

<h2>What About Linux?</h2>

<p>Dispatch requires the Claude Desktop app which is macOS and Windows only right now. No Linux support yet.</p>

<p>If youre on Linux (like me), the workaround is using <a href="/tools/claude-code" class="text-primary hover:underline font-medium">Claude Code</a> in the terminal with a task inbox. Create a folder in your repo, drop task files from GitHub mobile, and have Claude Code check for new tasks periodically. Not as slick as Dispatch but it works.</p>

<h2>Is It Worth the Pro Subscription?</h2>

<p>If youre already paying for Claude Pro ($20/month), Dispatch is included. No extra cost. Thats a genuinely good deal for what it does.</p>

<p>If youre on the free tier debating whether to upgrade, Dispatch alone probably isnt worth $20. But combined with the higher rate limits, Opus model access, and now this, the Pro plan is getting hard to argue against for anyone using AI daily.</p>

<p>Compare it to hiring a virtual assistant at $15-25/hour who can only work when youre available to give instructions. Claude Dispatch works while youre on the train, at lunch, or sleeping. For $20/month.</p>

<h2>Frequently Asked Questions</h2>

<h3>Does Claude Dispatch work on Linux?</h3>
<p>Not yet. Dispatch requires the Claude Desktop app which currently supports macOS and Windows x64 only. Linux users can use Claude Code in the terminal as an alternative, though it lacks the phone-to-desktop task handoff feature.</p>

<h3>Can Claude Dispatch access my files and apps?</h3>
<p>Yes, but only with your permission. When you set up Dispatch, you choose whether to give Claude file access. It asks permission before opening new apps. Your computer must be awake with the Claude Desktop app open for Dispatch to work.</p>

<h3>How much does Claude Dispatch cost?</h3>
<p>Dispatch is included free with Claude Pro ($20/month) and Claude Max ($100/month) subscriptions. There is no additional charge. It is currently available as a research preview, so some features may change.</p>
</article>`

// Publish the post
const slug = 'claude-dispatch-send-ai-tasks-from-phone-' + Date.now().toString(36)
const authorId = '54cd616d-c866-4f41-8ec9-f6cd57190b4a' // Tomás Herrera

const { error } = await c.from('blog_posts').insert({
  title,
  slug,
  excerpt,
  content,
  author_id: authorId,
  tags: ['claude', 'dispatch', 'productivity', 'anthropic', 'mobile'],
  reading_time_min: 6,
  status: 'published',
  published_at: new Date().toISOString(),
  category_id: catId,
})

if (error) { console.error('DB Error:', error.message); process.exit(1) }
console.log('Published:', title)

// Generate cover
console.log('Generating cover...')
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
let headline = (resp.match(/HEADLINE:\s*(.+)/i)?.[1] ?? 'AI DISPATCH').trim().split(/\s+/).slice(0, 3).join(' ')
const keyword = (resp.match(/KEYWORD:\s*(.+)/i)?.[1] ?? 'DISPATCH').trim()
const color = (resp.match(/COLOR:\s*(.+)/i)?.[1] ?? 'cyan').trim()
console.log('Text:', headline, '| KW:', keyword)

const prompt = `A person resembling Anya Taylor-Joy with modified features, looking at their phone while a holographic desktop screen floats behind them showing code being written autonomously. Cinematic 8K lighting, vivid cyan and purple tones, futuristic office background. The image MUST contain bold 3D text "${headline}" at bottom. "${keyword}" larger in bright ${color}. Others white with black outline. 16:9. aipowerstacks.com watermark top right. NO other text.`

const imgRes = await fetch(`${XAI}/images/generations`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
  body: JSON.stringify({ model: 'grok-imagine-image', prompt, n: 1 })
})
if (!imgRes.ok) { console.log('Cover failed'); process.exit(0) }
const imgData = await imgRes.json()
const url = imgData?.data?.[0]?.url
if (!url) { console.log('No URL'); process.exit(0) }

const dlRes = await fetch(url)
const buf = Buffer.from(await dlRes.arrayBuffer())
const final = await sharp(buf).jpeg({ quality: 92 }).toBuffer()
const fname = 'claude-dispatch-cover-' + Date.now()
const { data: up } = await c.storage.from('blog-images').upload(`covers/${fname}.jpeg`, final, { contentType: 'image/jpeg', upsert: true })
if (up) {
  const pubUrl = c.storage.from('blog-images').getPublicUrl(up.path).data.publicUrl
  await c.from('blog_posts').update({ cover_image_url: pubUrl }).eq('slug', slug)
  console.log('Cover saved')
}

console.log('Done!')
