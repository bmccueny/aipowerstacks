import { config } from 'dotenv'
config({ path: '.env.local' })

import { createAdminClient } from '../lib/supabase/admin'
import { generateCoverImage } from '../lib/utils/generateCoverImage'

async function main() {
  const supabase = createAdminClient()

  // Find March 21st posts
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, tags, cover_image_url, published_at')
    .eq('status', 'published')
    .gte('published_at', '2026-03-21T00:00:00')
    .lte('published_at', '2026-03-22T00:00:00')
    .order('published_at', { ascending: false })

  if (!posts || posts.length === 0) {
    console.log('No posts found for March 21st')
    return
  }

  console.log(`Found ${posts.length} post(s) to regenerate:`)
  for (const post of posts) {
    console.log(`  - "${post.title}" (${post.slug})`)
  }

  for (const post of posts) {
    console.log(`\nRegenerating cover for: "${post.title}"`)
    const topic = post.tags?.[0] ?? 'AI Tools & Product Launches'
    const newCoverUrl = await generateCoverImage(post.title, topic, post.excerpt ?? '')

    if (newCoverUrl) {
      const { error } = await supabase
        .from('blog_posts')
        .update({ cover_image_url: newCoverUrl })
        .eq('id', post.id)

      if (error) {
        console.error(`  DB update failed: ${error.message}`)
      } else {
        console.log(`  Updated: ${newCoverUrl}`)
      }
    } else {
      console.error('  Cover generation failed')
    }
  }

  console.log('\nDone!')
}

main().catch(console.error)
