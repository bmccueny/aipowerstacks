import { config } from 'dotenv'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateCoverImage } from '@/lib/utils/generateCoverImage'

// Load environment variables
config({ path: '.env.local' })

// Check if required env vars are loaded
if (!process.env.XAI_API_KEY) {
  console.error('XAI_API_KEY not found in environment variables')
  process.exit(1)
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Supabase environment variables not found')
  process.exit(1)
}

async function fixBrokenBlogImages() {
  const supabase = createAdminClient()

  // Get all blog posts with xAI image URLs that are likely broken
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags')
    .eq('status', 'published')
    .not('cover_image_url', 'is', null)
    .like('cover_image_url', '%imgen.x.ai%')

  if (error) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`Found ${posts?.length || 0} posts with xAI images to fix`)

  for (const post of posts || []) {
    try {
      console.log(`Processing: ${post.title}`)

      // Extract topic from tags or use a default
      const topic = post.tags?.[0] || 'AI'

      // Regenerate the image with photorealism
      const newImageUrl = await generateCoverImage(post.title, topic, post.excerpt || '', true)

      if (newImageUrl) {
        // Update the database with the new image URL
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ cover_image_url: newImageUrl })
          .eq('id', post.id)

        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError)
        } else {
          console.log(`✅ Updated ${post.slug} with new image: ${newImageUrl}`)
        }
      } else {
        console.error(`❌ Failed to generate new image for ${post.slug}`)
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      console.error(`Error processing ${post.slug}:`, err)
    }
  }

  console.log('Finished fixing broken blog images')
}

fixBrokenBlogImages().catch(console.error)