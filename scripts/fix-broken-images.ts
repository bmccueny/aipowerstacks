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

  // Get all published blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, tags')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`Checking ${posts?.length || 0} published posts for broken images...`)

  let brokenPosts = []

  // First pass: identify broken images
  for (const post of posts || []) {
    if (post.cover_image_url) {
      try {
        const response = await fetch(post.cover_image_url, { method: 'HEAD' })
        if (!response.ok) {
          console.log(`Found broken image: ${post.title}`)
          brokenPosts.push(post)
        }
      } catch (err) {
        console.log(`Found broken image (error): ${post.title}`)
        brokenPosts.push(post)
      }
    } else {
      console.log(`Found missing image: ${post.title}`)
      brokenPosts.push(post)
    }
  }

  console.log(`\nFound ${brokenPosts.length} posts with broken/missing images`)

  if (brokenPosts.length === 0) {
    console.log('No broken images found!')
    return
  }

  // Second pass: regenerate images
  for (const post of brokenPosts) {
    try {
      console.log(`\nProcessing: ${post.title}`)

      // Extract topic from tags or use a default
      const topic = post.tags?.[0] || 'AI'

      // Regenerate the image with photorealism
      const newImageUrl = await generateCoverImage(post.title, topic, post.excerpt || '')

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

  console.log(`\nFinished fixing ${brokenPosts.length} broken blog images`)
}

fixBrokenBlogImages().catch(console.error)