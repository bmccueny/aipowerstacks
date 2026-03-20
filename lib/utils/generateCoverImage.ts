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

/** Overlay 1-3 bold words onto the cover image (bottom-left, white with black shadow) */
async function overlayTextOnImage(imageBuffer: ArrayBuffer, headlineWords: string): Promise<Buffer> {
  const words = headlineWords.trim().toUpperCase()
  if (!words) return Buffer.from(imageBuffer)

  const img = sharp(Buffer.from(imageBuffer))
  const metadata = await img.metadata()
  const w = metadata.width || 1280
  const h = metadata.height || 720

  const fontSize = Math.round(w * 0.065)
  const padding = Math.round(w * 0.04)
  const y = h - padding - fontSize

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.8"/>
      </filter>
    </defs>
    <text x="${padding}" y="${y}" font-family="Impact, Arial Black, sans-serif" font-size="${fontSize}" font-weight="900" fill="white" filter="url(#shadow)" letter-spacing="2">${escapeXml(words)}</text>
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
          content: `You are a YouTube thumbnail designer creating a click-worthy blog cover image.

ARTICLE TITLE: "${title}"
TOPIC: ${topic}
SUMMARY: ${excerpt}

You must return TWO things in this exact format:

HEADLINE: [1-3 high-impact words that create urgency/curiosity, e.g., "GAME OVER", "NO WAY", "HUGE MISTAKE", "$0 COST", "MIND-BLOWN"]
PROMPT: [3-4 sentence image generation prompt]

For the HEADLINE:
- Pick 1-3 punchy words that make people STOP scrolling
- Use power words: FREE, SECRET, BROKEN, IMPOSSIBLE, INSANE, SHOCKING, $X,XXX
- Must relate to the article's core hook
- ALL CAPS

For the PROMPT, follow these MANDATORY THUMBNAIL RULES:
1. EXPRESSIVE FACES: Feature a person with an exaggerated emotion — shock, excitement, curiosity, awe. Close-up or medium shot showing clear facial expression.
2. MOVIE POSTER COMPOSITION: Treat as a movie poster. Tease a "micro-story" or "before vs. after" transformation related to the article topic.
3. FOCAL POINTS: Blur or darken the background. Add a bright glow, white outline, or neon highlight around the main subject to guide the viewer's eye.
4. BOLD COLORS: Use high-saturation, high-contrast color pairs: Red/Blue, Yellow/Purple, Orange/Teal. Favor red, yellow, orange for urgency. Heavy saturation and sharpness.
5. DRAMATIC LIGHTING: Studio-style lighting with strong key light on face, moody rim lighting or colored gels for atmosphere.

${photorealistic ? `STYLE: Photorealistic editorial photography with cinematic color grading. Shallow depth of field with bokeh. Real-world setting (office, lab, studio).` : `Pick ONE distinct visual style: cinematic illustration, neon cyberpunk, bold graphic poster, or hyper-saturated editorial photo.`}

CRITICAL IMAGE RULES:
- NO text, words, letters, or UI elements in the image itself (text is added separately)
- NO glowing orbs, abstract neural networks, or generic "AI brain" imagery
- NO flat, boring compositions — every image needs dramatic energy
- The person's expression should make viewers CURIOUS about the article
- Format: widescreen 16:9 blog header
- Leave the bottom-left area slightly darker/less busy for the text overlay

Reply in this exact format:
HEADLINE: [words]
PROMPT: [prompt]`,
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
