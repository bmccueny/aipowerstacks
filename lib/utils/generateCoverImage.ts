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
        model: 'grok-3-mini',
        max_tokens: 400,
        temperature: 0.9,
        messages: [{
          role: 'user',
          content: `You are a professional photographer planning a real photo shoot for a blog header image.

ARTICLE TITLE: "${title}"
TOPIC: ${topic}
SUMMARY: ${excerpt}

Write a single image generation prompt (3-4 sentences) describing a REAL PHOTOGRAPH for this article.

${photorealistic ? `MANDATORY STYLE: Photorealistic editorial photography. Describe it as if briefing a photographer:
- Specify camera angle (eye-level, overhead, close-up macro, wide establishing shot)
- Specify lighting (golden hour, studio softbox, neon ambient, overcast natural light, dramatic side-lit)
- Specify lens feel (shallow depth of field with bokeh, wide-angle, telephoto compression)
- Describe real physical materials, textures, and surfaces (brushed aluminum, glass reflections, concrete, wood grain)
- If people are in the shot, describe their posture, clothing, and environment realistically
- Reference real-world settings (modern office, server room, coffee shop, laboratory, workshop)` : `Pick ONE distinct visual style: editorial illustration, isometric 3D, retro pixel art, watercolor, paper cutout collage, neon cyberpunk, vintage poster, flat vector, or ink sketch.`}

CRITICAL RULES:
- NO text, words, letters, UI elements, or floating icons in the image
- NO glowing orbs, abstract neural networks, or generic "AI brain" imagery
- NO circuit boards unless the article is specifically about hardware
- Describe a SPECIFIC SCENE with concrete objects, not abstract concepts
- Think about what a real photographer would actually photograph to illustrate this topic
- Format: widescreen 16:9 blog header

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