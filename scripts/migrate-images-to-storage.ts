import { config } from 'dotenv'
import { createAdminClient } from '@/lib/supabase/admin'

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

async function downloadAndStoreImage(imageUrl: string, filename: string): Promise<string | null> {
  try {
    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error(`Failed to download image: ${response.status}`)
      return null
    }

    const imageBuffer = await response.arrayBuffer()
    const supabase = createAdminClient()

    // Create bucket if it doesn't exist
    await supabase.storage.createBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
    }).catch(() => {}) // Ignore errors if bucket already exists

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(`covers/${filename}.jpeg`, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (error) {
      console.error('Error uploading to Supabase:', error)
      return null
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('blog-images')
      .getPublicUrl(data.path)

    return publicUrl.publicUrl
  } catch (err) {
    console.error('Error downloading/storing image:', err)
    return null
  }
}

async function migrateToPermanentStorage() {
  const supabase = createAdminClient()

  // Get all published blog posts with xAI URLs
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_image_url')
    .eq('status', 'published')
    .like('cover_image_url', '%imgen.x.ai%')

  if (error) {
    console.error('Error fetching posts:', error)
    return
  }

  console.log(`Found ${posts?.length || 0} posts with xAI images to migrate`)

  for (const post of posts || []) {
    try {
      console.log(`Processing: ${post.title}`)

      if (!post.cover_image_url) continue

      // Download and store the image permanently
      const permanentUrl = await downloadAndStoreImage(
        post.cover_image_url,
        post.slug
      )

      if (permanentUrl) {
        // Update the database with the permanent URL
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update({ cover_image_url: permanentUrl })
          .eq('id', post.id)

        if (updateError) {
          console.error(`Error updating post ${post.id}:`, updateError)
        } else {
          console.log(`✅ Migrated ${post.slug} to permanent storage: ${permanentUrl}`)
        }
      } else {
        console.error(`❌ Failed to migrate image for ${post.slug}`)
      }

      // Small delay to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error(`Error processing ${post.slug}:`, err)
    }
  }

  console.log('Finished migrating images to permanent storage')
}

migrateToPermanentStorage().catch(console.error)