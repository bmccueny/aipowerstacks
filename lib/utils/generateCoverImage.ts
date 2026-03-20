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

  // Scale font to fit: Impact is ~0.6x character width ratio at a given font size
  const charWidthRatio = 0.6
  const maxFontSize = Math.round(w * 0.08)
  const fittedFontSize = Math.min(maxFontSize, Math.round(maxTextWidth / (words.length * charWidthRatio)))
  const fontSize = Math.max(fittedFontSize, Math.round(w * 0.04)) // floor at 4% so it's always readable

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
          content: `You are a YouTube thumbnail designer creating a click-worthy blog cover image.

ARTICLE TITLE: "${title}"
TOPIC: ${topic}
SUMMARY: ${excerpt}

You must return TWO things in this exact format:

HEADLINE: [3-5 high-impact words that create urgency/curiosity, e.g., "GAME OVER", "NO WAY", "HUGE MISTAKE", "$0 COST", "NEVER GOING BACK"]
PROMPT: [3-4 sentence image generation prompt]

For the HEADLINE (bold sans-serif font rules):
- 3 to 5 short, punchy words — NOT full sentences. If someone has to stop to read, they'll keep scrolling.
- Use power words: FREE, SECRET, BROKEN, IMPOSSIBLE, INSANE, SHOCKING, NEVER AGAIN
- Must relate to the article's core hook — create a "curiosity gap"
- ALL CAPS
- Must pass the "squint test" — if you can't read it while squinting, it's too long

For the PROMPT, follow ALL of these rules:

1. HIGH-CONTRAST & VIBRANT COLORS
- Bright, highly saturated colors (red, yellow, orange) to trigger urgency and excitement
- Pair complementary colors that "pop": blue/orange, yellow/black, red/teal, yellow/purple
- Heavy saturation and sharpness throughout

2. EXPRESSIVE HUMAN FACES
- Close-up or medium shot of a person with an EXAGGERATED emotion (shock, joy, confusion, awe)
- The face must trigger a curiosity loop — the viewer wants to know what caused that reaction
- Eye contact with the camera to create psychological connection
- This is the single most important element — humans notice faces faster than anything else

3. THE "CURIOSITY GAP"
- Tease information without giving away the ending
- Use visual hooks: arrows pointing at something, circles highlighting a mystery, blurred objects
- Juxtaposition of two conflicting things creates immediate tension (e.g., before/after, cheap/expensive)

4. SIMPLE, FOCUSED COMPOSITION
- ONE dominant focal point — do not crowd the image
- Place the subject off-center (rule of thirds) for a dynamic composition
- Do NOT add any gradient, vignette, or darkened area for text — the text overlay has its own outline and shadow
- Keep the bottom-right corner clear (YouTube places the timestamp there)
- White outlines or glow effects around the main subject to separate from background
- Blur or darken the background aggressively

5. DRAMATIC LIGHTING
- Studio-style key light on face, moody rim lighting or colored gels
- Cinematic color grading with shallow depth of field and bokeh

${photorealistic ? `STYLE: Photorealistic editorial photography. Real-world setting (office, lab, studio, workshop).` : `Pick ONE style: cinematic illustration, neon cyberpunk, bold graphic poster, or hyper-saturated editorial photo.`}

CRITICAL IMAGE RULES:
- NO text, words, letters, or UI elements in the image (text is composited separately)
- NO glowing orbs, abstract neural networks, or generic "AI brain" imagery
- NO crowded compositions — one focal point only
- The person's expression is the HERO of the image
- Format: widescreen 16:9 blog header

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
