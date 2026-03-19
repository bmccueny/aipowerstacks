import { config } from 'dotenv'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCoverImage } from '@/lib/utils/generateCoverImage'

// Load environment variables
config({ path: '.env.local' })

if (!process.env.XAI_API_KEY) {
  console.error('XAI_API_KEY not found in environment variables')
  process.exit(1)
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase environment variables not found')
  process.exit(1)
}

// Parse CLI flags
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitIndex = args.indexOf('--limit')
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined

if (limitIndex !== -1 && (!limit || isNaN(limit))) {
  console.error('--limit requires a valid number')
  process.exit(1)
}

async function regenerateBlogCovers() {
  const supabase = createAdminClient()

  let query = supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data: posts, error } = await query

  if (error) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`Found ${posts?.length || 0} published posts to regenerate`)
  if (dryRun) {
    console.log('[DRY RUN] No images will be generated or updated\n')
  }

  let success = 0
  let failed = 0

  for (const post of posts || []) {
    const topic = post.tags?.[0] || 'AI'
    console.log(`\n--- ${post.title}`)
    console.log(`    slug: ${post.slug}`)
    console.log(`    topic: ${topic}`)
    console.log(`    current: ${post.cover_image_url || '(none)'}`)

    if (dryRun) {
      console.log(`    [DRY RUN] Would regenerate cover image`)
      success++
      continue
    }

    try {
      const newImageUrl = await generateCoverImage(post.title, topic, post.excerpt || '', true)

      if (newImageUrl) {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ cover_image_url: newImageUrl })
          .eq('id', post.id)

        if (updateError) {
          console.error(`    Error updating DB: ${updateError.message}`)
          failed++
        } else {
          console.log(`    New: ${newImageUrl}`)
          success++
        }
      } else {
        console.error(`    Failed to generate image`)
        failed++
      }

      // Delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
    } catch (err) {
      console.error(`    Error:`, err)
      failed++
    }
  }

  console.log(`\n--- Done: ${success} succeeded, ${failed} failed`)
}

regenerateBlogCovers().catch(console.error)
