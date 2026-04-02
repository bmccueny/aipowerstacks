import { config } from 'dotenv'
config({ path: '.env.local' })

import { createAdminClient } from '../lib/supabase/admin'
import { generateCoverImage } from '../lib/utils/generateCoverImage'

async function main() {
  const supabase = createAdminClient()
  const slug = process.argv[2]

  // If slug provided, regenerate just that post; otherwise find all posts with null covers
  let posts: { id: string; title: string; slug: string; excerpt: string | null; tags: string[] | null }[]

  if (slug) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, tags')
      .eq('slug', slug)
      .single()
    if (error || !data) { console.error('Post not found:', slug); process.exit(1) }
    posts = [data]
  } else {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, tags')
      .eq('status', 'published')
      .is('cover_image_url', null)
      .order('published_at', { ascending: false })
    posts = data ?? []
  }

  if (posts.length === 0) {
    console.log('No posts need cover regeneration')
    return
  }

  console.log(`Regenerating covers for ${posts.length} post(s):`)
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
