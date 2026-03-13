import { config } from 'dotenv'
import { createAdminClient } from '@/lib/supabase/admin'

// Load environment variables
config({ path: '.env.local' })

async function checkPostsWithoutVisualImages() {
  const supabase = createAdminClient()

  // Get all published blog posts
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_image_url, tags, status')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`Checking ${posts?.length || 0} published posts for visual image issues...`)

  let issues = 0
  for (const post of posts || []) {
    try {
      // Check if the cover_image_url is accessible
      if (post.cover_image_url) {
        const response = await fetch(post.cover_image_url, { method: 'HEAD' })
        if (!response.ok) {
          console.log(`❌ Broken image: ${post.title} (${post.slug})`)
          console.log(`   URL: ${post.cover_image_url}`)
          console.log(`   Status: ${response.status}`)
          issues++
        } else {
          console.log(`✅ Working image: ${post.title}`)
        }
      } else {
        console.log(`❌ No image URL: ${post.title} (${post.slug})`)
        issues++
      }
    } catch (err) {
      console.log(`❌ Error checking: ${post.title} (${post.slug})`)
      console.log(`   Error: ${err}`)
      issues++
    }

    // Small delay to avoid overwhelming
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log(`\nSummary: ${issues} posts with image issues out of ${posts?.length || 0} total`)
}

checkPostsWithoutVisualImages().catch(console.error)