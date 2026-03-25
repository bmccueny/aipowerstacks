import { createAdminClient } from '@/lib/supabase/admin'
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join } from 'path'

const XAI_BASE_URL = 'https://api.x.ai/v1'

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

  const img = sharp(Buffer.from(imageBuffer))
  const metadata = await img.metadata()
  const w = metadata.width || 1280
  const h = metadata.height || 720

  const accent = ACCENT_COLORS[accentColor.toLowerCase()] || ACCENT_COLORS.yellow
  const kw = keyword.trim().toUpperCase()
  const padding = Math.round(w * 0.06)
  const maxTextWidth = w - padding * 2
  const charWidth = 0.67 // Anton is a wide display font
  const kwScale = 1.35 // keyword rendered this much bigger

  // Calculate total "effective characters" accounting for keyword being bigger
  const kwUpper = kw
  const otherChars = words.replace(kwUpper, '').trim().length
  const kwChars = kwUpper.length
  const effectiveChars = otherChars + kwChars * kwScale
  // Add spacing gaps between segments
  const gapCount = (otherChars > 0 && kwChars > 0) ? (words.split(kwUpper).filter(Boolean).length) : 0
  const gapWidthInChars = gapCount * 0.5

  // Size font to fit within maxTextWidth, then shrink until it actually fits
  const maxFontSize = Math.round(w * 0.08)
  let baseFontSize = Math.min(maxFontSize, Math.round(maxTextWidth / ((effectiveChars + gapWidthInChars) * charWidth)))
  baseFontSize = Math.max(baseFontSize, Math.round(w * 0.03))
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
      <filter id="wm-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
      </filter>
      <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#000" flood-opacity="1"/>
      </filter>
    </defs>
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
  'photorealistic': {
    scene: `1. A person with a dramatic facial expression — IMPORTANT: each image must feature a DIFFERENT person. Randomly pick one: a woman resembling a young Lupita Nyong'o, a man resembling Oscar Isaac, a woman resembling Florence Pugh, a man resembling Dev Patel, a woman resembling Zendaya, a man resembling Pedro Pascal. Modify 2-3 facial features so they are unique. NEVER reuse the same face.
2. A vivid, article-relevant scene or prop that creates visual storytelling (NOT abstract AI imagery)
3. Hyper-realistic details, 8k resolution, professional cinematic lighting
4. Vibrant saturated colors with a complementary color pair (orange/teal, red/blue, yellow/purple)
5. Soft white outline or glow around the subject to separate from background
6. Slightly blurred background, shallow depth of field
7. 16:9 widescreen format`,
    typography: `Bold white 3D extruded block letters with thick black outline, positioned at the bottom center. The keyword word should be significantly larger and filled with the accent color. Letters should have a slight perspective tilt and heavy drop shadow. YouTube thumbnail typography style.`,
  },

  'data-viz': {
    scene: `1. A data visualization centerpiece — charts, dashboards, flowing data streams relevant to the article topic
2. Dark background (navy, charcoal, or near-black) with glowing data elements
3. Color palette: electric blue, teal, white accents with occasional warm highlights (amber, coral)
4. Clean, precise lines and geometric shapes. No messy or organic textures
5. Subtle glow and luminosity on data elements
6. 16:9 widescreen format, high resolution, crisp vector-like quality
7. NO people, NO faces`,
    typography: `Clean, modern sans-serif text rendered as glowing holographic floating text in the lower third. The keyword word is larger and rendered in bright accent color with a data-grid underline. Other words in crisp white with subtle blue glow. The text should look like it belongs on a high-tech dashboard HUD.`,
  },

  'editorial-illustration': {
    scene: `1. A conceptual, metaphorical scene that captures the article's theme (NOT literal depictions)
2. Bold flat colors with a limited palette of 3-4 strong colors (coral/navy/cream/gold or teal/orange/white/charcoal)
3. Geometric shapes, clean outlines, paper-cut or screen-print texture
4. Strong composition with clear focal point, diagonal or asymmetric layout
5. Modern editorial illustration style inspired by NYT, The Verge, or Monocle magazine
6. Abstract and conceptual, NOT photorealistic
7. 16:9 widescreen format`,
    typography: `Bold condensed sans-serif headline integrated into the illustration composition, positioned in the lower third. The keyword word is rendered much larger in the accent color. Other words in white or cream with strong contrast against the illustration. Typography should feel like a magazine cover headline — clean, authoritative, designed.`,
  },

  'youtube-thumbnail': {
    scene: `1. A person with a dramatic facial expression — IMPORTANT: each image must feature a DIFFERENT person. Randomly pick one: a woman resembling Margot Robbie, a man resembling Chris Hemsworth, a woman resembling Anya Taylor-Joy, a man resembling Keanu Reeves, a woman resembling Saoirse Ronan, a man resembling John Boyega. Modify 2-3 facial features so they are unique. NEVER reuse the same face.
2. A vivid, article-relevant scene or prop that creates visual storytelling (NOT abstract AI imagery)
3. Hyper-realistic details, 8k resolution, professional cinematic lighting
4. Vibrant saturated colors with a complementary color pair (orange/teal, red/blue, yellow/purple)
5. Soft white outline or glow around the subject to separate from background
6. Slightly blurred background, shallow depth of field
7. 16:9 widescreen format`,
    typography: `Massive bold 3D block letters with thick black stroke outline, positioned at the bottom center. The keyword word should be 50% larger than the other words and filled with the bright accent color. Other words in pure white with heavy black outline. Letters should have strong drop shadows and feel like they're popping off the image. Classic YouTube thumbnail text style — impossible to miss.`,
  },

  'retro-pixel': {
    scene: `1. A pixel art scene with chunky, visible pixels rendered in 8-bit or 16-bit game style
2. Article-relevant subject matter depicted through retro game aesthetics (computers, robots, tools as game items)
3. Neon color palette: magenta, electric green, hot pink, cyan, bright orange against dark backgrounds
4. CRT scanline effect or subtle screen-door texture overlay
5. Retro-futuristic feel inspired by 1980s arcade games, synthwave, or vaporwave
6. Clear composition with a strong central subject
7. 16:9 widescreen format`,
    typography: `Pixel art font rendered in the same 8-bit style as the scene, positioned at the bottom. The keyword word is larger and rendered in bright neon accent color with a pixel glow effect. Other words in white pixel font. The text should look like an arcade game title screen or high-score display. Chunky, blocky pixel letters.`,
  },

  'minimalist-3d': {
    scene: `1. A single object or small arrangement of objects relevant to the article topic, rendered in clean 3D
2. Smooth gradient background (light gray to white, or soft pastel transitions)
3. Professional studio lighting: soft key light, subtle rim light, gentle shadows
4. Minimalist composition with generous negative space
5. Matte or semi-glossy surfaces, clean premium materials
6. One accent color for visual interest (the object glows, reflects, or is tinted)
7. 16:9 widescreen format, photorealistic 3D render quality
8. NO people`,
    typography: `Ultra-clean, thin modern sans-serif text (like Helvetica Neue or Futura) positioned in the lower third with generous spacing. The keyword word is rendered larger and in the accent color. Other words in dark charcoal or slate gray. Minimal, elegant, Apple-style typography with plenty of breathing room. No outlines, no shadows, no effects — pure clean type.`,
  },

  'pop-art': {
    scene: `1. A bold comic-book style scene with article-relevant subject matter
2. Classic pop art techniques: Ben-Day halftone dots, bold black outlines, flat color fills
3. Vibrant primary colors (red, yellow, blue) with occasional secondary accents (green, orange, purple)
4. High contrast, graphic quality — every shape is clearly defined
5. Dynamic composition with dramatic angles or diagonal layouts
6. Roy Lichtenstein / Andy Warhol / classic comic book aesthetic
7. 16:9 widescreen format, crisp graphic quality`,
    typography: `Comic book style bold block letters with thick black outlines, positioned at the bottom. The keyword word is much larger and filled with the accent color. Other words in white with bold black outline. Letters should look like they belong in a comic book speech bubble or action panel — punchy, bold, slightly tilted for energy. Ben-Day dot texture on the letters.`,
  },

  'cyberpunk-anime': {
    scene: `1. A cyberpunk scene with anime/manga-style rendering relevant to the article topic
2. Neon-lit environment: rain-slicked streets, holographic displays, glowing circuitry, futuristic cityscape
3. Color palette: neon pink, electric blue, deep purple, with warm amber or green accents
4. Detailed linework in manga style: sharp, confident lines with cel-shaded coloring
5. Atmospheric effects: rain, fog, lens flare, volumetric light from neon signs
6. Inspired by Ghost in the Shell, Akira, Blade Runner anime adaptations
7. 16:9 widescreen format, high detail`,
    typography: `Japanese manga-inspired bold condensed text at the bottom, rendered as glowing neon signs or holographic floating text. The keyword word is larger and rendered in bright neon accent color (pink or cyan) with a strong glow/bloom effect. Other words in white with neon edge glow. The text should feel like neon signage in a cyberpunk city — glowing, slightly flickering, atmospheric.`,
  },

  'isometric': {
    scene: `1. An isometric (30-degree angle) scene depicting article-relevant workspace, technology, or process
2. Clean flat design with depth created through the isometric perspective and layering
3. Color palette transitioning from pastels to bold: lavender, mint, coral as base with electric blue or orange pops
4. Detailed miniature elements that tell a story (screens, devices, small characters, data objects)
5. Crisp vector-illustration quality, depth from color and shadow
6. Modern, friendly aesthetic inspired by Slack, Notion, or Linear marketing illustrations
7. 16:9 widescreen format, high resolution`,
    typography: `Clean, rounded sans-serif text rendered as 3D isometric block letters sitting on the ground plane of the scene, positioned in the lower portion. The keyword word is taller/larger and in the accent color. Other words in white with subtle shadow. The letters should look like they're physical 3D objects placed in the isometric scene — same angle, same lighting, integrated into the world.`,
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

    // Step 1: Have Grok generate an image prompt with headline text baked in
    const metaRes = await fetch(`${XAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        max_tokens: 600,
        temperature: 0.9,
        messages: [{
          role: 'user',
          content: `You write image generation prompts for blog cover thumbnails.

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

TEXT IN IMAGE — your prompt MUST include typography instructions:
The image must contain ONLY the headline words as text, rendered as part of the artwork.
${style.typography}
The headline text must be clearly readable, properly spelled, and visually integrated.
No other text, labels, UI elements, watermarks, or captions — ONLY the headline words.

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

    const headlineParts = headlineLine.split('|').map((s: string) => s.trim())
    const rawHeadline = headlineParts[0]?.replace(/HEADLINE:\s*/i, '').trim() ?? ''
    // HARD LIMIT: max 3 words, strip banned generic words
    const headlineWords = rawHeadline.split(/\s+/).filter((w: string) => !['AI', 'TOOLS', 'BOOST'].includes(w.toUpperCase())).slice(0, 3).join(' ') || 'GAME OVER'
    const keyword = headlineParts.find((p: string) => /KEYWORD:/i.test(p))?.replace(/KEYWORD:\s*/i, '').trim() ?? ''
    const accentColor = headlineParts.find((p: string) => /COLOR:/i.test(p))?.replace(/COLOR:\s*/i, '').trim() ?? 'yellow'
    const imagePrompt = promptMatch?.[1]?.trim() ?? ''

    if (!imagePrompt || imagePrompt.length < 20) {
      console.error('Empty image prompt from Grok')
      return null
    }

    console.log(`Headline: "${headlineWords}" | Keyword: "${keyword}" | Color: ${accentColor}`)
    console.log(`Image prompt: ${imagePrompt.substring(0, 120)}...`)

    // Step 2: Generate the image (headline text rendered by Grok Imagine)
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

    // Step 3: Download and add watermark only (headline is in the generated image)
    const imageResponse = await fetch(tempImageUrl)
    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`)
      return null
    }

    const rawBuffer = await imageResponse.arrayBuffer()
    const finalBuffer = await overlayWatermark(rawBuffer)

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
