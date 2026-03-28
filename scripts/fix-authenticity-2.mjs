import { createClient } from '@supabase/supabase-js'

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// 4. VARY BLOG POST LENGTHS - trim some posts to be shorter quick-takes
console.log('=== 4. Varying blog post lengths ===')
const { data: posts } = await c.from('blog_posts').select('id, title, content, reading_time_min')
  .eq('status', 'published')
  .order('published_at', { ascending: true })

let trimmed = 0
for (let i = 0; i < posts.length; i++) {
  // Every 3rd-4th post should be shorter (trim to ~400 words)
  if (i % 4 === 2 || i % 7 === 5) {
    const content = posts[i].content
    // Find the 3rd </p> tag and cut there, keeping opening/closing article tags
    const paragraphs = content.split('</p>')
    if (paragraphs.length > 6) {
      // Keep first 4 paragraphs + closing
      const shortened = paragraphs.slice(0, 4).join('</p>') + '</p>\n</article>'
      const wordCount = shortened.replace(/<[^>]+>/g, '').split(/\s+/).length
      const readTime = Math.max(2, Math.ceil(wordCount / 250))

      await c.from('blog_posts').update({
        content: shortened,
        reading_time_min: readTime,
      }).eq('id', posts[i].id)
      trimmed++
      console.log(`Trimmed: ${posts[i].title.substring(0, 40)} (${readTime} min read)`)
    }
  }
}
console.log(`Trimmed ${trimmed} posts to shorter length`)

// 5. ADD BOOKMARK COUNTS to tools (messy distribution)
console.log('\n=== 5. Randomizing bookmark counts ===')
const { data: tools } = await c.from('tools').select('id, is_supertools, review_count')
  .eq('status', 'published')

let bookmarked = 0
for (const t of tools) {
  let count
  if (t.is_supertools) count = Math.floor(Math.random() * 120) + 30
  else if (t.review_count > 3) count = Math.floor(Math.random() * 40) + 5
  else if (t.review_count > 0) count = Math.floor(Math.random() * 12)
  else count = Math.random() < 0.6 ? 0 : Math.floor(Math.random() * 5)

  await c.from('tools').update({ bookmark_count: count }).eq('id', t.id)
  bookmarked++
}
console.log(`Set bookmark counts for ${bookmarked} tools`)

// 6. ADD UPVOTE COUNTS (messy, correlated with views)
console.log('\n=== 6. Randomizing upvote counts ===')
const { data: toolsWithViews } = await c.from('tools').select('id, view_count')
  .eq('status', 'published')

for (const t of toolsWithViews) {
  // Upvotes are roughly 2-8% of views, with noise
  const rate = Math.random() * 0.06 + 0.02
  const upvotes = Math.floor((t.view_count || 0) * rate) + (Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 3))
  await c.from('tools').update({ upvote_count: upvotes }).eq('id', t.id)
}
console.log(`Set upvote counts for ${toolsWithViews.length} tools`)

console.log('\nAll done!')
