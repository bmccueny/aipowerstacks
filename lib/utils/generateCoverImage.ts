import { createAdminClient } from '@/lib/supabase/admin'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const XAI_BASE = 'https://api.x.ai/v1'

// Embed font as base64 so it works on Vercel (no system fonts available)
let antonFontBase64: string | null = null
function getAntonFontBase64(): string {
  if (antonFontBase64) return antonFontBase64
  const fontPath = join(process.cwd(), 'assets', 'fonts', 'Anton-Regular.ttf')
  antonFontBase64 = readFileSync(fontPath).toString('base64')
  return antonFontBase64
}

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

  // Force 16:9 @ 1280x720 — crop from center if source is square/different ratio
  const TARGET_W = 1280
  const TARGET_H = 720
  const img = sharp(Buffer.from(imageBuffer)).resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'centre' })
  const w = TARGET_W
  const h = TARGET_H

  const accent = ACCENT_COLORS[accentColor.toLowerCase()] || ACCENT_COLORS.yellow
  const kw = keyword.trim().toUpperCase()
  const padding = Math.round(w * 0.05)
  const maxTextWidth = w - padding * 2
  const charWidth = 0.67 // Anton is a wide display font
  const kwScale = 1.5 // keyword rendered 50% bigger per thumbnail rules

  // Calculate total "effective characters" accounting for keyword being bigger
  const kwUpper = kw
  const otherChars = words.replace(kwUpper, '').trim().length
  const kwChars = kwUpper.length
  const effectiveChars = otherChars + kwChars * kwScale
  // Add spacing gaps between segments
  const gapCount = (otherChars > 0 && kwChars > 0) ? (words.split(kwUpper).filter(Boolean).length) : 0
  const gapWidthInChars = gapCount * 0.5

  // Size font to fill width — YouTube thumbnail style demands BIG text
  const maxFontSize = Math.round(w * 0.14)
  let baseFontSize = Math.min(maxFontSize, Math.round(maxTextWidth / ((effectiveChars + gapWidthInChars) * charWidth)))
  baseFontSize = Math.max(baseFontSize, Math.round(w * 0.06))
  let bigFontSize = Math.round(baseFontSize * kwScale)

  // Safety clamp: verify total pixel width fits, shrink if not
  for (let attempt = 0; attempt < 5; attempt++) {
    const totalPx = (otherChars * baseFontSize + kwChars * bigFontSize) * charWidth + gapCount * baseFontSize * 0.25
    if (totalPx <= maxTextWidth) break
    baseFontSize = Math.round(baseFontSize * 0.88)
    bigFontSize = Math.round(baseFontSize * kwScale)
  }

  const strokeWidth = Math.round(baseFontSize * 0.1)
  const bigStroke = Math.round(bigFontSize * 0.1)

  const y = h - Math.round(h * 0.10)
  const tiltDeg = 0

  // Split words around the keyword to render in segments
  let svgText: string
  if (kw && words.includes(kw)) {
    const parts = words.split(kw)
    const before = parts[0]?.trim() || ''
    const after = parts.slice(1).join(kw)?.trim() || ''

    const gap = Math.round(baseFontSize * 0.25)
    const beforeWidth = Math.round(before.length * baseFontSize * charWidth)
    const kwWidth = Math.round(kw.length * bigFontSize * charWidth)
    const afterWidth = Math.round(after.length * baseFontSize * charWidth)
    const totalWidth = beforeWidth + (before ? gap : 0) + kwWidth + (after ? gap : 0) + afterWidth
    // Center the whole line
    const startX = Math.round((w - totalWidth) / 2)

    const kwX = startX + (before ? beforeWidth + gap : 0)
    const afterX = kwX + kwWidth + (after ? gap : 0)

    svgText = ''
    if (before) {
      svgText += `<text x="${startX}" y="${y}" font-family="Anton, Impact, sans-serif" font-size="${baseFontSize}" font-weight="900" fill="white" stroke="black" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#shadow)" letter-spacing="1">${escapeXml(before)}</text>`
    }
    svgText += `<text x="${kwX}" y="${y}" font-family="Anton, Impact, sans-serif" font-size="${bigFontSize}" font-weight="900" fill="${accent}" stroke="black" stroke-width="${bigStroke}" paint-order="stroke fill" filter="url(#shadow)" letter-spacing="1">${escapeXml(kw)}</text>`
    if (after) {
      svgText += `<text x="${afterX}" y="${y}" font-family="Anton, Impact, sans-serif" font-size="${baseFontSize}" font-weight="900" fill="white" stroke="black" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#shadow)" letter-spacing="1">${escapeXml(after)}</text>`
    }
  } else {
    svgText = `<text x="${Math.round(w / 2)}" y="${y}" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="${baseFontSize}" font-weight="900" fill="${accent}" stroke="black" stroke-width="${strokeWidth}" paint-order="stroke fill" filter="url(#shadow)" letter-spacing="1">${escapeXml(words)}</text>`
  }

  // Watermark: small, semi-transparent, top-right — opposite corner from headline
  const wmFontSize = Math.round(w * 0.018)
  const wmY = padding + wmFontSize
  const watermark = `<text x="${w - padding}" y="${wmY}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${wmFontSize}" font-weight="600" fill="rgba(255,255,255,0.6)" filter="url(#wm-shadow)" letter-spacing="1">aipowerstacks.com</text>`

  const fontBase64 = getAntonFontBase64()
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <style>
        @font-face {
          font-family: 'Anton';
          src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
      </style>
      <linearGradient id="text-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="black" stop-opacity="0"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.7"/>
      </linearGradient>
      <filter id="wm-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
      </filter>
      <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#000" flood-opacity="1"/>
      </filter>
    </defs>
    <rect x="0" y="${Math.round(h * 0.55)}" width="${w}" height="${Math.round(h * 0.45)}" fill="url(#text-bg)"/>
    ${watermark}
    <g transform="rotate(${tiltDeg} ${padding} ${y})">
      ${svgText}
    </g>
  </svg>`

  return img.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 90 }).toBuffer()
}

/** Watermark-only overlay — headline text is now rendered by Grok Imagine */
async function overlayWatermark(imageBuffer: ArrayBuffer): Promise<Buffer> {
  const img = sharp(Buffer.from(imageBuffer))
  const metadata = await img.metadata()
  const w = metadata.width || 1280
  const h = metadata.height || 720

  const padding = Math.round(w * 0.05)
  const wmFontSize = Math.round(w * 0.018)
  const wmY = padding + wmFontSize

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="wm-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
      </filter>
    </defs>
    <text x="${w - padding}" y="${wmY}" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="${wmFontSize}" font-weight="600" fill="rgba(255,255,255,0.6)" filter="url(#wm-shadow)" letter-spacing="1">aipowerstacks.com</text>
  </svg>`

  return img.composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 90 }).toBuffer()
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const VISUAL_STYLE_PROMPTS: Record<string, { scene: string; typography: string }> = {
  // Use REAL photo keywords + text overlay to avoid AI detection
  'photorealistic': {
    scene: `Generate a HIGH-QUALITY REAL PHOTOGRAPH (not illustration, not AI art). Use one of these authentic stock-photo style concepts: a professional in a modern workspace, person using technology, startup team collaborating, real office environment with natural lighting. The photo should feel like a genuine stock image, not AI-generated. Authentic lighting, realistic colors, natural depth of field. NO artificial-looking elements. 16:9 widescreen, high resolution photography.`,
    typography: `Add bold white 3D block letters with thick black outline at the bottom center. The keyword word should be significantly larger and filled with the accent color (gold). Letters should have a slight perspective tilt and heavy drop shadow. YouTube thumbnail typography style. This creates the authentic "overlay" look that readers recognize from real thumbnails.`,
  },

  'data-viz': {
    scene: `Generate a REAL PHOTOGRAPH of a data center, server room, technology infrastructure, or real-world tech environment. Authentic server racks, real cables, actual LED indicator lights. The photo should look like a genuine tech stock photo, not AI art. Natural lighting from overhead fixtures, realistic depth. NO fake or overly perfect-looking elements. 16:9 widescreen, high resolution.`,
    typography: `Clean, modern sans-serif text rendered as glowing holographic floating text in the lower third. The keyword word is larger and rendered in bright accent color (cyan) with a data-grid underline. Other words in crisp white with subtle blue glow. The text should look like it belongs on a high-tech dashboard HUD.`,
  },

  'editorial-illustration': {
    scene: `Generate a REAL PHOTOGRAPH with MINIMALIST composition — clean architectural details, modern building interiors, geometric real-world patterns. Find authentic textures and lighting in real spaces. The photo should look like editorial stock photography, not AI. Natural shadows, realistic color palette. NO cartoon or illustration elements. 16:9 widescreen.`,
    typography: `Bold condensed sans-serif headline positioned in the lower third. The keyword word is rendered much larger in the accent color (orange). Other words in white or cream with strong contrast. Typography should feel like a magazine cover headline — clean, authoritative, designed.`,
  },

  'youtube-thumbnail': {
    scene: `Generate a HIGH-QUALITY REAL PHOTOGRAPH of a tech professional, creative worker, or startup founder. Person in an authentic workspace, using real technology, with natural expressions. The photo should feel like a genuine YouTube thumbnail stock image — real people, real environments, not AI art. Natural lighting, realistic depth of field. 16:9 widescreen.`,
    typography: `Massive bold 3D block letters with thick black stroke outline, positioned at the bottom center. The keyword word should be 50% larger than the other words and filled with the bright accent color (red). Other words in pure white with heavy black outline. Letters should have strong drop shadows and feel like they're popping off the image. Classic YouTube thumbnail text style — impossible to miss.`,
  },

  'retro-pixel': {
    scene: `Generate a REAL PHOTOGRAPH with NEON LIGHT effects — actual neon signs in real urban environments, nighttime city streets with real LED signs, authentic retro signage. The photo should look like a genuine night photography shot, not AI art. Real light bleeding, authentic color temperature from actual neon tubes. NO fake-looking glow effects. 16:9 widescreen.`,
    typography: `Bold text at the bottom. The keyword word is larger and rendered in bright neon accent color (magenta) with a glow effect. Other words in white. The text should look like real neon signage.`,
  },

  'minimalist-3d': {
    scene: `Generate a REAL PHOTOGRAPH of clean, minimal spaces — empty modern desk, white background product shot, clean architectural detail, minimal interior. The photo should look like authentic minimalist stock photography, not AI. Natural soft lighting, realistic shadows. NO too-perfect or artificial elements. 16:9 widescreen.`,
    typography: `Ultra-clean, thin modern sans-serif text positioned in the lower third. The keyword word is rendered larger and in the accent color (lime). Other words in dark charcoal. Minimal, elegant typography with no outlines or shadows — clean Apple-style type.`,
  },

  'pop-art': {
    scene: `Generate a REAL PHOTOGRAPH with BOLD COLORS — vibrant street art, colorful shopfronts, bold architectural details in real urban environments. The photo should look like authentic vibrant urban stock photography, not AI. Real saturated colors from actual painted surfaces. NO illustration-style elements. 16:9 widescreen.`,
    typography: `Comic book style bold block letters with thick black outlines at the bottom. The keyword word is much larger and filled with the accent color (yellow). Other words in white with bold black outline.`,
  },

  'cyberpunk-anime': {
    scene: `Generate a REAL PHOTOGRAPH at NIGHT in an urban environment with ACTUAL NEON — real neon signs, actual LED displays, authentic city lights at night. The photo should look like genuine night urban stock photography, not AI art. Real light bloom, authentic color from actual neon tubes. NO anime-style rendering. 16:9 widescreen.`,
    typography: `Bold condensed text at the bottom, rendered as glowing neon-style text. The keyword word is larger and rendered in bright accent color (magenta/cyan) with a glow effect. Other words in white. The text should feel like real neon signage.`,
  },

  'isometric': {
    scene: `Generate a REAL PHOTOGRAPH of clean, modern 3D-like spaces — architectural model, clean product arrangement, organized workspace. The photo should look like authentic clean stock photography, not AI art. Natural perspective, realistic depth. NO cartoon or illustration elements. 16:9 widescreen.`,
    typography: `Clean, rounded sans-serif text positioned in the lower portion. The keyword word is taller/larger and in the accent color (cyan). Other words in white with subtle shadow. The letters should look integrated into the photo naturally.`,
  },
}

export async function generateCoverImage(
  title: string,
  topic: string,
  excerpt: string,
  visualStyle = 'youtube-thumbnail'
): Promise<string | null> {
  try {
    const style = VISUAL_STYLE_PROMPTS[visualStyle] ?? VISUAL_STYLE_PROMPTS['youtube-thumbnail']

    // Step 1: Have Gemini generate an image prompt with headline text baked in
    const googleApiKey = process.env.GOOGLE_API_KEY
    if (!googleApiKey) {
      console.error('GOOGLE_API_KEY not set')
      return null
    }

    const metaRes = await fetch(
      `${GEMINI_BASE_URL}/models/gemini-2.5-flash:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You write image generation prompts for blog cover thumbnails.

ARTICLE TITLE: "${title}"
TOPIC: ${topic}
SUMMARY: ${excerpt}

Return TWO things in this exact format:

HEADLINE: [1-3 ALL CAPS power words] | KEYWORD: [the ONE most important word to emphasize] | COLOR: [one bright accent color: yellow, red, lime, cyan, orange, magenta]
PROMPT: [A single vivid paragraph, 3-5 sentences max]

HEADLINE RULES — CRITICAL, FOLLOW EXACTLY:
- MAXIMUM 3 words. Can be 1 word, 2 words, or 3 words. NEVER 4 or more.
- Each word must be SHORT (max 7 letters). Prefer: FREE, DEAD, OVER, GONE, NEW, WILD, $0, INSANE, WHY, NO, WOW, RIP, BROKE, FIRED, QUIT, LEAKED, FAKE, SCAM
- ALL CAPS only
- NEVER use the word "AI" in the headline. Every article is about AI so it adds nothing. Use a more specific, surprising word instead.
- NEVER use the word "TOOLS" or "BOOST" — too generic.
- Must create a curiosity gap related to the article's SPECIFIC angle, not just "AI is cool"
- KEYWORD is the single most impactful word from the headline — it will be rendered BIGGER and in the accent COLOR
- COLOR should match the energy (yellow for money/success, red for danger/urgency, lime for growth, cyan for tech)
- Examples of GOOD headlines: "GAME OVER", "ITS FREE", "WHY", "NO WAY", "RIP", "$0 COST", "WILD", "THEY QUIT", "BROKE IT"
- Examples of BAD headlines: "AI TOOLS", "BEST AI", "AI BOOST", "AI REVOLUTION" — all too generic

SCENE RULES — your prompt must describe:
${style.scene}

ANTI-AI-DETECTION INSTRUCTIONS (CRITICAL for Google rankings):
- The generated image must look like a REAL STOCK PHOTOGRAPH, not AI art
- Use authentic photography language: "professional photograph", "real photo", "actual", "genuine"
- Avoid words that trigger AI generation: "illustration", "artwork", "render", "digital art"
- Describe REAL natural lighting: "soft window light", "overhead fluorescent", "natural daylight"
- Describe authentic textures and imperfections that real photos have
- Mention realistic depth of field, not perfect sharpness
- The image should pass as a photo from a real camera

TEXT IN IMAGE — your prompt MUST include typography instructions:
The image must contain the headline words as bold text at the bottom center of the image.
${style.typography}
LEGIBILITY IS CRITICAL: text must be clearly readable at mobile thumbnail sizes. Ensure HIGH CONTRAST between text and background. Place text over a darker or simpler region. The keyword word must be at least 50% larger than the other words and filled with the accent color. Heavy black stroke/outline around ALL letters. Strong drop shadow. Letters must be properly spelled with no artifacts or garbled characters.
No other text, labels, UI elements, watermarks, or captions — ONLY the headline words.

Reply with ONLY the two lines. Nothing else.` }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(30_000),
      },
    )

    if (!metaRes.ok) {
      console.error(`Image prompt generation failed: ${metaRes.status}`)
      return null
    }

    const metaData = await metaRes.json()
    const response = (metaData.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()

    const headlineLine = response.match(/HEADLINE:\s*(.+)/i)?.[1]?.trim() ?? ''
    const promptMatch = response.match(/PROMPT:\s*([\s\S]+)/i)

    const headlineParts = headlineLine.split('|').map((s: string) => s.trim())
    const rawHeadline = headlineParts[0]?.replace(/HEADLINE:\s*/i, '').trim() ?? ''
    // HARD LIMIT: max 3 words, strip banned generic words
    const headlineWords = rawHeadline.split(/\s+/).filter((w: string) => !['AI', 'TOOLS', 'BOOST'].includes(w.toUpperCase())).slice(0, 3).join(' ') || 'GAME OVER'
    const keyword = headlineParts.find((p: string) => /KEYWORD:/i.test(p))?.replace(/KEYWORD:\s*/i, '').trim() ?? ''
    const accentColor = headlineParts.find((p: string) => /COLOR:/i.test(p))?.replace(/COLOR:\s*/i, '').trim() ?? 'yellow'
    const imagePrompt = promptMatch?.[1]?.trim() ?? ''

    if (!imagePrompt || imagePrompt.length < 20) {
      console.error('Empty image prompt from Gemini')
      return null
    }

    // Build final prompt with text as the PRIMARY instruction (Gemini prioritizes early instructions)
    const accent = ACCENT_COLORS[accentColor.toLowerCase()] || ACCENT_COLORS.yellow
    const finalImagePrompt = `Generate a WIDE 16:9 landscape image (wider than tall, like a YouTube thumbnail). The image must contain the bold text "${headlineWords}" as a large headline in the LOWER THIRD of the image (not at the very bottom edge — leave margin). The word "${keyword}" must be much bigger (50% larger) and colored ${accentColor}. Other words in white. All text must have thick black outlines and drop shadows for maximum readability. The text must be perfectly spelled with zero garbled characters. The text should occupy roughly 25-35% of the image height.

Background scene behind the text: ${imagePrompt}`

    console.log(`Headline: "${headlineWords}" | Keyword: "${keyword}" | Color: ${accentColor}`)
    console.log(`Image prompt: ${finalImagePrompt.substring(0, 150)}...`)

    // Step 2: Generate image via Grok Image (xAI)
    let sceneBuffer: Buffer | null = null
    const MAX_IMAGE_RETRIES = 3

    for (let attempt = 1; attempt <= MAX_IMAGE_RETRIES; attempt++) {
      try {
        console.log(`Generating scene image with Gemini 3.1 Flash (attempt ${attempt}/${MAX_IMAGE_RETRIES})...`)
        
        const geminiRes = await fetch(
          `${GEMINI_BASE_URL}/models/gemini-3.1-flash-image-preview:generateContent?key=${googleApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: finalImagePrompt }] }],
              generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
            }),
            signal: AbortSignal.timeout(90_000),
          }
        )

        if (sceneBuffer) break

        if (attempt < MAX_IMAGE_RETRIES) {
          const delayMs = attempt * 5_000
          console.log(`No image data, retrying in ${delayMs / 1000}s...`)
          await new Promise(r => setTimeout(r, delayMs))
        }
      } catch (grokErr) {
        console.error(`Grok image generation error (attempt ${attempt}):`, grokErr)
        if (attempt < MAX_IMAGE_RETRIES) {
          const delayMs = attempt * 5_000
          await new Promise(r => setTimeout(r, delayMs))
        }
      }
    }

    if (!sceneBuffer) {
      console.warn('Scene generation failed after all retries, generating fallback...')
      try {
        const fallbackBg = await sharp({
          create: { width: 1280, height: 720, channels: 4, background: { r: 26, g: 26, b: 46, alpha: 1 } }
        }).jpeg().toBuffer()
        const finalBuffer = await overlayTextOnImage(fallbackBg.buffer as ArrayBuffer, headlineWords, keyword, accentColor)
        console.log('Fallback cover generated with Sharp text overlay')
        const filename = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50) + '-' + Date.now()
        return uploadToSupabaseStorage(finalBuffer, filename)
      } catch (fallbackErr) {
        console.error('Fallback cover generation failed:', fallbackErr)
        return null
      }
    }

    // Step 3: Resize to 16:9 and add watermark (text already in Gemini image)
    const resizedBuffer = await sharp(sceneBuffer)
      .resize(1280, 720, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 92 })
      .toBuffer()

    const finalBuffer = await overlayWatermark(resizedBuffer.buffer as ArrayBuffer)
    console.log('Resized to 16:9 + watermark applied')

    // Step 3: Upload to permanent storage
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
