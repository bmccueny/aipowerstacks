import { createAdminClient } from '@/lib/supabase/admin'

const XAI_BASE_URL = 'https://api.x.ai/v1'

async function uploadToSupabaseStorage(imageBuffer: ArrayBuffer, filename: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()

    // Create bucket if it doesn't exist (this will fail gracefully if it exists)
    await supabase.storage.createBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
    }).catch(() => {}) // Ignore errors if bucket already exists

    // Upload the image
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
    console.error('Error uploading to storage:', err)
    return null
  }
}

export async function generateCoverImage(
  title: string,
  topic: string,
  excerpt: string,
  photorealistic = false
): Promise<string | null> {
  try {
    // Step 1: Have Grok write a unique image prompt for this specific article
    const metaRes = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        max_tokens: 300,
        temperature: 1.0,
        messages: [{
          role: 'user',
          content: `You are an art director creating a cover image for a blog post.

ARTICLE TITLE: "${title}"
TOPIC: ${topic}
SUMMARY: ${excerpt}

Write a single image generation prompt (2-3 sentences) for this specific article. The image should:
- Directly illustrate the core concept of THIS article, not generic AI imagery
- Use a distinct visual style (pick ONE: ${photorealistic ? 'photorealistic photography, studio lighting, high detail, 8K resolution, professional photography' : 'editorial illustration, isometric 3D, retro pixel art, watercolor, paper cutout collage, neon cyberpunk, studio photograph with dramatic lighting, vintage poster, flat vector, or ink sketch'})
- Include specific scene details, objects, and composition that relate to the article content
- Feature people with clear, expressive emotions where relevant
- If a specific brand or company is mentioned in the title (e.g. Nvidia, OpenAI, Google, Meta), incorporate recognizable visual references to that brand: their signature colors, iconic product designs, or well-known logos rendered as physical objects in the scene. Make the brand identity unmistakable.
- Be visually distinct from other tech blog headers

RULES:
- No text, words, or letters in the image
- Format: widescreen 16:9 blog header
- Be specific and concrete, not abstract or vague
- Do NOT mention "cartoon" or "playful"

Reply with ONLY the image prompt, nothing else.`,
        }],
      }),
    })

    if (!metaRes.ok) {
      console.error(`Image prompt generation failed: ${metaRes.status}`)
      return null
    }

    const metaData = await metaRes.json()
    const imagePrompt = (metaData.choices?.[0]?.message?.content ?? '').trim()

    if (!imagePrompt || imagePrompt.length < 20) {
      console.error('Empty image prompt from Grok')
      return null
    }

    // Step 2: Generate the image with the custom prompt
    const res = await fetch(`${XAI_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-imagine-image',
        prompt: imagePrompt,
        aspect_ratio: '16:9',
      }),
    })

    if (!res.ok) {
      console.error(`Image generation failed: ${res.status}`)
      return null
    }

    const data = await res.json()
    const tempImageUrl = data?.data?.[0]?.url

    if (!tempImageUrl) {
      console.error('No image URL returned from xAI')
      return null
    }

    // Step 3: Download the image and upload to permanent storage
    console.log('Downloading and storing image permanently...')
    const imageResponse = await fetch(tempImageUrl)
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`)
      return null
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    // Create a unique filename based on title
    const filename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '-' + Date.now()

    const permanentUrl = await uploadToSupabaseStorage(imageBuffer, filename)

    if (!permanentUrl) {
      console.error('Failed to upload image to permanent storage')
      return null
    }

    console.log(`Image stored permanently: ${permanentUrl}`)
    return permanentUrl
  } catch (err) {
    console.error('Image generation/storage error:', err)
    return null
  }
}