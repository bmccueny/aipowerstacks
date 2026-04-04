import { createAdminClient } from '@/lib/supabase/admin'
import { generateCoverImage } from '@/lib/utils/generateCoverImage'

const supabase = createAdminClient()

async function generateForPost() {
  // Find the post
  const { data: post } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, topic_category')
    .eq('slug', 'run-local-llms-docker-2026-free-creative-guide')
    .single()

  if (!post) {
    console.log('Post not found, trying by title...')
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, topic_category')
      .ilike('title', '%docker%')
      .limit(1)
    
    if (posts && posts[0]) {
      console.log('Found post:', posts[0].title)
      const result = await generateCoverImage(
        posts[0].title,
        posts[0].topic_category || 'Local AI & Open Source Models',
        posts[0].excerpt || 'Learn how to run powerful AI models on your own machine using Docker.',
        'cyberpunk-anime'
      )
      console.log('Cover URL:', result)
      
      if (result) {
        await supabase.from('blog_posts').update({ cover_image_url: result }).eq('id', posts[0].id)
        console.log('Updated post with new cover!')
      }
    }
    return
  }

  console.log('Found post:', post.title)
  
  const result = await generateCoverImage(
    post.title,
    post.topic_category || 'Local AI & Open Source Models',
    post.excerpt || 'Learn how to run powerful AI models on your own machine using Docker.',
    'cyberpunk-anime'
  )
  
  console.log('Cover URL:', result)
  
  if (result) {
    await supabase.from('blog_posts').update({ cover_image_url: result }).eq('id', post.id)
    console.log('Updated post with new cover!')
  }
}

generateForPost().catch(console.error)