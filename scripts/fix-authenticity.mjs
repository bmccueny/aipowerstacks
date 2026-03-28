import { createClient } from '@supabase/supabase-js'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 1. Randomize helpful counts
const { data: reviews } = await c.from('reviews').select('id').eq('status', 'published')
let updated = 0
for (const r of reviews) {
  const rand = Math.random()
  let count
  if (rand < 0.35) count = 0
  else if (rand < 0.55) count = 1
  else if (rand < 0.70) count = Math.floor(Math.random() * 3) + 2
  else if (rand < 0.85) count = Math.floor(Math.random() * 8) + 5
  else if (rand < 0.95) count = Math.floor(Math.random() * 20) + 13
  else count = Math.floor(Math.random() * 50) + 33
  await c.from('reviews').update({ helpful_count: count }).eq('id', r.id)
  updated++
}
console.log('Randomized helpful_count for', updated, 'reviews')

// 2. Add angry 1-star reviews
const userId = 'a6b778a3-1bf6-4530-8ac9-3ebb5dedf16e'

const angryReviews = [
  { slug: 'chatgpt', rating: 1, title: 'keeps logging me out', body: 'every single time i close my browser it logs me out and i have to verify my email again. been happening for weeks. the actual AI is fine but i cant use it if i spend half my time logging back in' },
  { slug: 'chatgpt', rating: 1, title: 'hit the limit after 3 messages??', body: 'bought plus specifically because the free tier kept cutting me off. still hitting limits on gpt5 after like 3 messages and it drops me to the mini model. what am i paying 20 bucks for exactly' },
  { slug: 'cursor-editor', rating: 1, title: 'broke my entire project', body: 'used composer to refactor one file and it edited 6 other files i didnt ask it to touch. had to git reset the whole thing. lost an hour of work. maybe im doing something wrong but thats a terrible default behavior' },
  { slug: 'midjourney-v7', rating: 1, title: 'discord only was a dealbreaker', body: 'i know they have a website now but when i tried it last month it kept redirecting me to discord. i dont use discord and im not going to start just to generate images. plenty of other options that dont require a chat app' },
  { slug: 'claude-code', rating: 1, title: 'rate limited into uselessness', body: 'the free tier is a joke. i get maybe 5 messages before it tells me to come back later. tried it during work hours and couldnt even finish a single task. either make a free tier that works or dont offer one' },
  { slug: 'zapier', rating: 1, title: 'pricing is insane now', body: 'they changed their pricing and now my workflow that was on the free tier costs 20/month. didnt even get a warning. just stopped working one day. moved everything to make.com in about an hour' },
  { slug: 'grammarly', rating: 1, title: 'the chrome extension breaks gmail', body: 'ever since the last update grammarly makes gmail take like 10 seconds to load every email. had to disable it. tried reinstalling, same problem. support said to clear cache which obviously didnt help' },
  { slug: 'notion-ai', rating: 1, title: 'AI features feel bolted on', body: 'notion was great as a notes app. the AI stuff feels like they just stapled chatgpt onto the sidebar and called it a feature. it doesnt understand my workspace context at all despite them claiming it does' },
  { slug: 'canva', rating: 1, title: 'magic design is magic at wasting time', body: 'tried magic design for a presentation and it gave me the ugliest templates ive ever seen. spent more time fixing what it generated than if id just started from scratch. the non-AI templates are still fine tho' },
  { slug: 'perplexity-ai', rating: 1, title: 'citations are wrong half the time', body: 'the whole point of perplexity is cited sources right? clicked through to verify 4 citations and 2 of them didnt say what perplexity claimed they said. one was a completely different topic. hard pass' },
  { slug: 'superhuman', rating: 1, title: '30 dollars a month for email lol', body: 'tried the trial and yeah its fast. but 30 a month for email is genuinely absurd. gmail is free. the AI drafts were mid at best. if you have a normal email volume this is the definition of paying for vibes' },
  { slug: 'github-copilot', rating: 2, title: 'suggestions are wrong more than right', body: 'maybe its my codebase but copilot suggests code that looks right and compiles but has subtle bugs. spent 2 hours debugging something that turned out to be a copilot suggestion i accepted without reading carefully enough' },
  { slug: 'suno', rating: 1, title: 'every song sounds the same', body: 'generated about 20 songs and they all have the same structure. verse chorus verse chorus bridge chorus. same drum patterns. different words same vibe. its a novelty not a tool' },
  { slug: 'heygen', rating: 1, title: 'uncanny valley is real', body: 'showed a heygen video to my team and the first comment was "why does that person look dead inside". the lip sync is technically impressive but something about the eyes is just off' },
  { slug: 'bolt-new', rating: 1, title: 'generated app crashed on deploy', body: 'built a todo app as a test, looked great in the preview. deployed it and it crashed immediately. the error was in code bolt generated. spent 40 minutes debugging AI code which defeats the purpose' },
  { slug: 'writesonic-ai', rating: 1, title: 'its just chatgpt with a markup', body: 'pay 50/month for what is clearly just a gpt4 wrapper with templates. you can do the same thing with chatgpt for 20 or free. i feel dumb for paying for 3 months before realizing this' },
  { slug: 'lovable', rating: 1, title: 'more like hateable', body: 'the demo looks amazing. the actual output has broken state management, no error handling, and hardcoded values everywhere. tried to build something real and had to rewrite 80% of it' },
  { slug: 'fireflies-ai', rating: 2, title: 'transcription accuracy is bad with accents', body: 'half my team has accents and fireflies butchers their contributions. the summary says things nobody said. we switched to manual notes for important meetings which is worse than not having the tool' },
]

const slugs = [...new Set(angryReviews.map(r => r.slug))]
const { data: tools } = await c.from('tools').select('id, slug').in('slug', slugs)
const toolMap = {}
tools.forEach(t => { toolMap[t.slug] = t.id })

let inserted = 0
for (const r of angryReviews) {
  const toolId = toolMap[r.slug]
  if (!toolId) continue
  const { error } = await c.from('reviews').insert({
    tool_id: toolId, user_id: userId, rating: r.rating, title: r.title, body: r.body,
    is_verified: false,
    helpful_count: Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 25) + 1,
    status: 'published',
  })
  if (!error) inserted++
}
console.log('Angry reviews inserted:', inserted)

// Recalculate ratings
for (const slug of slugs) {
  const toolId = toolMap[slug]
  if (!toolId) continue
  const { data: revs } = await c.from('reviews').select('rating').eq('tool_id', toolId).eq('status', 'published')
  if (!revs?.length) continue
  const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length
  await c.from('tools').update({ avg_rating: Math.round(avg * 100) / 100, review_count: revs.length }).eq('id', toolId)
}
console.log('Ratings recalculated')
