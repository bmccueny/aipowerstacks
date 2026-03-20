import { createAdminClient } from '@/lib/supabase/admin'
import sharp from 'sharp'

const XAI_BASE_URL = 'https://api.x.ai/v1'

async function uploadToSupabaseStorage(imageBuffer: Buffer, filename: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()

    await supabase.storage.createBucket('blog-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10485760,
    }).catch(() => {})

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

    const { data: publicUrl } = supabase.storage
      .from('blog-images')
      .getPublicUrl(data.path)

    return publicUrl.publicUrl
  } catch (err) {
    console.error('Error uploading to storage:', err)
    return null
  }
}

/** Overlay 3-5 bold words onto the cover image (bottom-left, avoiding bottom-right timestamp zone) */
async function overlayTextOnImage(imageBuffer: ArrayBuffer, headlineWords: string): Promise<Buffer> {
  const words = headlineWords.trim().toUpperCase()
  if (!words) return Buffer.from(imageBuffer)

  const img = sharp(Buffer.from(imageBuffer))
  const metadata = await img.metadata()
  const w = metadata.width || 1280
  const h = metadata.height || 720

  const padding = Math.round(w * 0.04)
  const maxTextWidth = w - padding * 2

  // Scale font to fit: Impact averages ~0.55x width + 3px letter-spacing per char
  const maxFontSize = Math.round(w * 0.08)
  const letterSpacing = 3
  const fittedFontSize = Math.min(maxFontSize, Math.round(maxTextWidth / (words.length * 0.55 + words.length * (letterSpacing / maxFontSize))))
  // Apply 10% safety margin, floor at 4% of width
  const fontSize = Math.max(Math.round(fittedFontSize * 0.9), Math.round(w * 0.04))

  const strokeWidth = Math.round(fontSize * 0.08)
  const y = h - Math.round(h * 0.12)

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#000" flood-opacity="0.9"/>
      </filter>
    </defs>
    <text x="${padding}" y="${y}" font-family="Impact, Arial Black, Bebas Neue, sans-serif" font-size="${fontSize}" font-weight="900" fill="white" stroke="black" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#shadow)" letter-spacing="3">${escapeXml(words)}</text>
  </svg>`

  return img.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 90 }).toBuffer()
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function generateCoverImage(
  title: string,
  topic: string,
  excerpt: string,
  photorealistic = false
): Promise<string | null> {
  try {
    // Step 1: Have Grok generate both an image prompt AND 1-3 headline words
    const metaRes = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        max_tokens: 500,
        temperature: 0.9,
        messages: [{
          role: 'user',
          content: `You write image generation prompts for blog cover thumbnails.

ARTICLE TITLE: "${title}"
TOPIC: ${topic}
SUMMARY: ${excerpt}

Return TWO things in this exact format:

HEADLINE: [3-5 ALL CAPS power words for text overlay, e.g., "GAME OVER", "NEVER GOING BACK", "$0 COST"]
PROMPT: [A single vivid paragraph, 2-4 sentences max]

HEADLINE RULES:
- 3-5 short punchy words, ALL CAPS
- Power words: FREE, SECRET, BROKEN, IMPOSSIBLE, INSANE, SHOCKING
- Must create a curiosity gap related to the article

PROMPT RULES — write it like this example:
"A high-contrast, wide-angle 16:9 cinematic shot of a young man with a shocked facial expression, mouth agape, standing in front of a giant, glowing mountain of gold coins. Hyper-realistic details, vibrant saturated colors with neon yellow highlights. The background is a slightly blurred, high-tech vault. Soft white outline around the subject to make him pop. 8k resolution, professional lighting, intense energy."

Your prompt MUST include ALL of these elements:
1. A person with a dramatic facial expression (shocked, excited, jaw-dropped, mind-blown) — reference a real celebrity then modify 2-3 features so it's unique (e.g., "resembles a younger Pedro Pascal but with a buzzcut and glasses")
2. A vivid, article-relevant scene or prop that creates visual storytelling (NOT abstract AI imagery)
3. Hyper-realistic details, 8k resolution, professional cinematic lighting
4. Vibrant saturated colors with a complementary color pair (orange/teal, red/blue, yellow/purple)
5. Soft white outline or glow around the subject to separate from background
6. Slightly blurred background, shallow depth of field
7. 16:9 widescreen format
8. NO text, NO UI elements, NO gradients/vignettes in the image

Reply with ONLY the two lines. Nothing else.`,
        }],
      }),
    })

    if (!metaRes.ok) {
      console.error(`Image prompt generation failed: ${metaRes.status}`)
      return null
    }

    const metaData = await metaRes.json()
    const response = (metaData.choices?.[0]?.message?.content ?? '').trim()

    const headlineMatch = response.match(/HEADLINE:\s*(.+)/i)
    const promptMatch = response.match(/PROMPT:\s*([\s\S]+)/i)

    const headlineWords = headlineMatch?.[1]?.trim() ?? ''
    const imagePrompt = promptMatch?.[1]?.trim() ?? ''

    if (!imagePrompt || imagePrompt.length < 20) {
      console.error('Empty image prompt from Grok')
      return null
    }

    console.log(`Headline words: "${headlineWords}"`)
    console.log(`Image prompt: ${imagePrompt.substring(0, 100)}...`)

    // Step 2: Generate the image
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

    // Step 3: Download and overlay headline text
    const imageResponse = await fetch(tempImageUrl)
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`)
      return null
    }

    const rawBuffer = await imageResponse.arrayBuffer()
    const finalBuffer = await overlayTextOnImage(rawBuffer, headlineWords)

    // Step 4: Upload to permanent storage
    const filename = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '-' + Date.now()

    const permanentUrl = await uploadToSupabaseStorage(finalBuffer, filename)

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
