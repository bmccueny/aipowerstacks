import { createAdminClient } from '@/lib/supabase/admin'
import { generateCoverImage } from '@/lib/utils/generateCoverImage'

async function test() {
  console.log('Testing cover image generation with new prompts...')
  
  const result = await generateCoverImage(
    'Claude vs GPT: Which AI Actually Saves You Time?',
    'AI Tools & Product Launches',
    'We tested both side-by-side for a week. Here is what happened.',
    'youtube-thumbnail'
  )
  
  console.log('Result:', result ? 'SUCCESS - ' + result : 'FAILED')
}

test().catch(console.error)