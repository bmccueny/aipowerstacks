import { config } from 'dotenv'
import { createAdminClient } from '@/lib/supabase/admin'

// Load environment variables
config({ path: '.env.local' })

async function checkRemainingBrokenImages() {
  const supabase = createAdminClient()

  // Get all blog posts with xAI image URLs
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_image_url')
    .eq('status', 'published')
    .not('cover_image_url', 'is', null)
    .like('cover_image_url', '%imgen.x.ai%')

  if (error) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`Found ${posts?.length || 0} posts with xAI images`)

  if (posts) {
    for (const post of posts) {
      console.log(`${post.slug}: ${post.cover_image_url}`)
    }
  }
}

checkRemainingBrokenImages().catch(console.error)