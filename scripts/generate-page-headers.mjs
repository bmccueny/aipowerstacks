/**
 * Generate page header illustrations using Grok Imagine.
 * Run: set -a && source .env.local && set +a && node scripts/generate-page-headers.mjs
 */

import { createClient } from '@supabase/supabase-js'

const XAI_BASE = 'https://api.x.ai/v1'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\\n/g, '').trim()
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\\n/g, '').trim()
const xaiKey = process.env.XAI_API_KEY

if (!xaiKey) { console.error('XAI_API_KEY required'); process.exit(1) }
if (!supabaseUrl) { console.error('NEXT_PUBLIC_SUPABASE_URL required'); process.exit(1) }

const supabase = createClient(supabaseUrl, supabaseKey)

const PAGES = [
  {
    slug: 'homepage',
    prompt: 'A clean, modern 3D illustration of colorful AI tool icons arranged as building blocks on a warm off-white surface. A glowing magnifying glass with a dollar sign hovers over the stack, inspecting costs. Soft studio lighting, minimal shadows, warm color palette (crimson, amber, teal accents). No text, no labels, no UI elements. Illustration style, not photorealistic. Clean negative space around the composition. 16:9 aspect ratio.',
  },
  {
    slug: 'tools',
    prompt: 'An isometric 3D illustration of a neatly organized grid of abstract AI tool icons floating in rows above a clean surface. Each icon is a different color representing different categories (coding blue, design purple, writing green, video orange). A search bar hovers above them. Soft pastel colors on warm off-white background. No text. Clean, minimal, professional illustration style. 16:9 aspect ratio.',
  },
  {
    slug: 'blog',
    prompt: 'An editorial illustration of a modern desk scene with a glowing tablet displaying AI news headlines (abstract squiggly lines, not readable text), a coffee cup, scattered colorful sticky notes, and a small robot mascot reading. Flat design with limited 4-color palette (crimson, navy, warm cream, soft teal). Clean lines, no gradients, editorial magazine style. No readable text. 16:9 aspect ratio.',
  },
  {
    slug: 'categories',
    prompt: 'An isometric 3D illustration of a colorful filing cabinet system with labeled folders popping out, each a different vibrant color representing AI categories. Small abstract icons float above each folder (code brackets, paint brush, microphone, chart). Warm off-white background, soft shadows, clean composition. No text or labels. 16:9 aspect ratio.',
  },
  {
    slug: 'tracker',
    prompt: 'A data visualization style illustration of a glowing dashboard floating in dark space. Shows abstract charts trending downward (savings), stacked subscription cards fanning out, and a prominent downward arrow representing cost reduction. Neon crimson and teal accents on deep navy background. Clean, futuristic, professional. No text. 16:9 aspect ratio.',
  },
  {
    slug: 'compare',
    prompt: 'A clean, modern 3D illustration of two abstract AI tool icons sitting on opposite sides of a golden balance scale. Each side shows different feature indicators as small floating badges. Soft studio lighting, warm off-white background, subtle shadows. The scale is slightly tilted. Minimal, professional, no text. 16:9 aspect ratio.',
  },
]

async function generateImage(prompt) {
  console.log('  Calling Grok Imagine...')
  const res = await fetch(`${XAI_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${xaiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-imagine-image',
      prompt,
      n: 1,
      response_format: 'url',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Grok Imagine error ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const url = data.data?.[0]?.url
  if (!url) throw new Error('No image URL in response')
  return url
}

async function downloadImage(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function uploadToSupabase(buffer, slug) {
  // Ensure bucket exists
  await supabase.storage.createBucket('blog-images', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 10485760,
  }).catch(() => {})

  const path = `headers/${slug}-${Date.now()}.jpeg`
  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })

  if (error) throw new Error(`Upload error: ${error.message}`)

  const { data: publicUrl } = supabase.storage
    .from('blog-images')
    .getPublicUrl(data.path)

  return publicUrl.publicUrl
}

async function main() {
  console.log('\n🎨 Generating page header illustrations...\n')

  const results = []

  for (const page of PAGES) {
    console.log(`📄 ${page.slug}:`)
    try {
      const tempUrl = await generateImage(page.prompt)
      console.log('  Downloading...')
      const buffer = await downloadImage(tempUrl)
      console.log('  Uploading to Supabase...')
      const publicUrl = await uploadToSupabase(buffer, page.slug)
      console.log(`  ✅ ${publicUrl}\n`)
      results.push({ slug: page.slug, url: publicUrl })
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}\n`)
      results.push({ slug: page.slug, url: null, error: err.message })
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 5000))
  }

  console.log('\n📋 Results:\n')
  console.log('Add these URLs to your page components:\n')
  for (const r of results) {
    if (r.url) {
      console.log(`  ${r.slug}: "${r.url}"`)
    } else {
      console.log(`  ${r.slug}: FAILED (${r.error})`)
    }
  }
  console.log()
}

main().catch(console.error)
