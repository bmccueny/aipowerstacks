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

const ACCENT_COLORS: Record<string, string> = {
  yellow: '#FFD700', red: '#FF2D2D', lime: '#39FF14', cyan: '#00E5FF',
  orange: '#FF6B00', magenta: '#FF00AA', white: '#FFFFFF',
}

/** YouTube-style text overlay: accent-colored keyword, thick stroke, slight tilt, scale variation */
async function overlayTextOnImage(
  imageBuffer: ArrayBuffer,
  headlineWords: string,
  keyword = '',
  accentColor = 'yellow',
): Promise<Buffer> {
  const words = headlineWords.trim().toUpperCase()
  if (!words) return Buffer.from(imageBuffer)

  const img = sharp(Buffer.from(imageBuffer))
  const metadata = await img.metadata()
  const w = metadata.width || 1280
  const h = metadata.height || 720

  const accent = ACCENT_COLORS[accentColor.toLowerCase()] || ACCENT_COLORS.yellow
  const kw = keyword.trim().toUpperCase()
  const padding = Math.round(w * 0.04)
  const maxTextWidth = w - padding * 2

  // Base font sizing with safety margin
  const maxFontSize = Math.round(w * 0.08)
  const fitted = Math.min(maxFontSize, Math.round(maxTextWidth / (words.length * 0.55 + words.length * 0.03)))
  const baseFontSize = Math.max(Math.round(fitted * 0.9), Math.round(w * 0.04))
  const bigFontSize = Math.round(baseFontSize * 1.45) // keyword is 1.45x bigger
  const strokeWidth = Math.round(baseFontSize * 0.1) // thick YouTube-style stroke
  const bigStroke = Math.round(bigFontSize * 0.1)

  const y = h - Math.round(h * 0.10)
  const tiltDeg = -3 // slight rotation for energy

  // Split words around the keyword to render in segments
  let svgText: string
  if (kw && words.includes(kw)) {
    const parts = words.split(kw)
    const before = parts[0]?.trim() || ''
    const after = parts.slice(1).join(kw)?.trim() || ''

    // Estimate x positions: each char ~0.55 * fontSize wide
    const beforeWidth = before.length * baseFontSize * 0.58
    const kwWidth = kw.length * bigFontSize * 0.58
    const kwX = padding + (before ? beforeWidth + baseFontSize * 0.3 : 0)
    const afterX = kwX + kwWidth + bigFontSize * 0.3

    svgText = ''
    if (before) {
      svgText += `<text x="${padding}" y="${y}" font-family="Impact, Arial Black, sans-serif" font-size="${baseFontSize}" font-weight="900" fill="white" stroke="black" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#shadow)" letter-spacing="2">${escapeXml(before)}</text>`
    }
    // Keyword: bigger, accent colored
    svgText += `<text x="${kwX}" y="${y}" font-family="Impact, Arial Black, sans-serif" font-size="${bigFontSize}" font-weight="900" fill="${accent}" stroke="black" stroke-width="${bigStroke}" paint-order="stroke fill" filter="url(#shadow)" letter-spacing="3">${escapeXml(kw)}</text>`
    if (after) {
      svgText += `<text x="${afterX}" y="${y}" font-family="Impact, Arial Black, sans-serif" font-size="${baseFontSize}" font-weight="900" fill="white" stroke="black" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#shadow)" letter-spacing="2">${escapeXml(after)}</text>`
    }
  } else {
    // No keyword match — render all in accent color
    svgText = `<text x="${padding}" y="${y}" font-family="Impact, Arial Black, sans-serif" font-size="${baseFontSize}" font-weight="900" fill="${accent}" stroke="black" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#shadow)" letter-spacing="3">${escapeXml(words)}</text>`
  }

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#000" flood-opacity="1"/>
      </filter>
    </defs>
    <g transform="rotate(${tiltDeg} ${padding} ${y})">
      ${svgText}
    </g>
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

Return THREE things in this exact format:

HEADLINE: [3-5 ALL CAPS power words, e.g., "GAME OVER", "NEVER GOING BACK", "$0 COST"] | KEYWORD: [the ONE most important word to emphasize] | COLOR: [one bright accent color: yellow, red, lime, cyan, orange, magenta]
PROMPT: [A single vivid paragraph, 2-4 sentences max]

HEADLINE RULES:
- 3-5 short punchy words, ALL CAPS
- Power words: FREE, SECRET, BROKEN, IMPOSSIBLE, INSANE, SHOCKING
- Must create a curiosity gap related to the article
- KEYWORD is the single most impactful word — it will be rendered BIGGER and in the accent COLOR
- COLOR should match the thumbnail's energy (yellow for money/success, red for danger/urgency, lime for growth, cyan for tech)

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

    const headlineLine = response.match(/HEADLINE:\s*(.+)/i)?.[1]?.trim() ?? ''
    const promptMatch = response.match(/PROMPT:\s*([\s\S]+)/i)

    // Parse: "SOME WORDS | KEYWORD: word | COLOR: yellow"
    const headlineParts = headlineLine.split('|').map((s: string) => s.trim())
    const headlineWords = headlineParts[0]?.replace(/HEADLINE:\s*/i, '').trim() ?? ''
    const keyword = headlineParts.find((p: string) => /KEYWORD:/i.test(p))?.replace(/KEYWORD:\s*/i, '').trim() ?? ''
    const accentColor = headlineParts.find((p: string) => /COLOR:/i.test(p))?.replace(/COLOR:\s*/i, '').trim() ?? 'yellow'
    const imagePrompt = promptMatch?.[1]?.trim() ?? ''

    if (!imagePrompt || imagePrompt.length < 20) {
      console.error('Empty image prompt from Grok')
      return null
    }

    console.log(`Headline: "${headlineWords}" | Keyword: "${keyword}" | Color: ${accentColor}`)
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
    const finalBuffer = await overlayTextOnImage(rawBuffer, headlineWords, keyword, accentColor)

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
