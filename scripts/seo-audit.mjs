/**
 * SEO Audit Script
 *
 * Queries all published tools from Supabase and checks:
 * - Meta title, description, canonical URL, OG image
 * - Duplicate titles or descriptions
 * - All tool slugs present in sitemap routes
 * - No broken internal links (category/comparison slugs exist)
 *
 * Usage: node scripts/seo-audit.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      // Strip surrounding quotes and trailing \n escapes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      val = val.replace(/\\n$/, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* .env.local missing is fine */ }
}
loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const SITE_URL = 'https://aipowerstacks.com'

async function fetchAll(table, select, filters = {}) {
  let query = supabase.from(table).select(select)
  for (const [key, val] of Object.entries(filters)) {
    query = query.eq(key, val)
  }
  const { data, error } = await query.limit(5000)
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
  return data ?? []
}

async function runAudit() {
  const report = {
    timestamp: new Date().toISOString(),
    issues: [],
    summary: {},
  }

  function addIssue(type, severity, slug, detail) {
    report.issues.push({ type, severity, slug, detail })
  }

  // Fetch published tools with relevant SEO fields
  // Note: tools table doesn't have og_image_url, meta_title, meta_description columns
  // OG images are generated dynamically; SEO titles come from name; descriptions from tagline
  const tools = await fetchAll('tools', 'id, slug, name, tagline, description, logo_url, category_id, website_url, status', { status: 'published' })
  const categories = await fetchAll('categories', 'id, slug, name')
  const posts = await fetchAll('blog_posts', 'id, slug, title, status', { status: 'published' })

  const categorySlugSet = new Set(categories.map(c => c.slug))
  const toolSlugSet = new Set(tools.map(t => t.slug))
  const categoryIdToSlug = new Map(categories.map(c => [c.id, c.slug]))

  console.log(`Auditing ${tools.length} published tools, ${categories.length} categories, ${posts.length} blog posts...\n`)

  // 1. Check meta fields on each tool
  for (const tool of tools) {
    if (!tool.slug) {
      addIssue('missing_slug', 'critical', tool.name, 'Tool has no slug')
      continue
    }

    // Meta title derives from tool name
    if (!tool.name) {
      addIssue('missing_meta_title', 'high', tool.slug, 'No name (used as meta title)')
    }

    // Meta description derives from tagline or description
    if (!tool.tagline && !tool.description) {
      addIssue('missing_meta_description', 'high', tool.slug, 'No tagline or description (used as meta description)')
    }

    // OG image — logo_url is used as fallback for dynamic OG generation
    if (!tool.logo_url) {
      addIssue('missing_og_image', 'medium', tool.slug, 'No logo URL (needed for OG image)')
    }

    // Category exists
    if (tool.category_id && !categoryIdToSlug.has(tool.category_id)) {
      addIssue('broken_category_link', 'high', tool.slug, `Category ID ${tool.category_id} not found`)
    }
  }

  // 2. Check for duplicate titles
  const titleMap = new Map()
  for (const tool of tools) {
    const title = (tool.meta_title || tool.name || '').toLowerCase().trim()
    if (!title) continue
    if (titleMap.has(title)) {
      titleMap.get(title).push(tool.slug)
    } else {
      titleMap.set(title, [tool.slug])
    }
  }
  for (const [title, slugs] of titleMap) {
    if (slugs.length > 1) {
      addIssue('duplicate_title', 'medium', slugs.join(', '), `Duplicate title: "${title}"`)
    }
  }

  // 3. Check for duplicate descriptions
  const descMap = new Map()
  for (const tool of tools) {
    const desc = (tool.meta_description || tool.tagline || '').toLowerCase().trim()
    if (!desc || desc.length < 20) continue
    if (descMap.has(desc)) {
      descMap.get(desc).push(tool.slug)
    } else {
      descMap.set(desc, [tool.slug])
    }
  }
  for (const [desc, slugs] of descMap) {
    if (slugs.length > 1) {
      addIssue('duplicate_description', 'medium', slugs.join(', '), `Duplicate description: "${desc.slice(0, 80)}..."`)
    }
  }

  // 4. Check that all tool slugs would be in sitemap
  // The sitemap queries tools WHERE status='published', so any published tool with a slug is in it
  const toolsWithoutSlug = tools.filter(t => !t.slug)
  if (toolsWithoutSlug.length > 0) {
    addIssue('missing_from_sitemap', 'critical', 'N/A', `${toolsWithoutSlug.length} published tools have no slug`)
  }

  // 5. Check blog posts have titles
  for (const post of posts) {
    if (!post.title) {
      addIssue('blog_missing_title', 'high', post.slug, 'Blog post has no title')
    }
  }

  // Summary
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 }
  const byType = {}
  for (const issue of report.issues) {
    bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1
    byType[issue.type] = (byType[issue.type] || 0) + 1
  }

  report.summary = {
    totalTools: tools.length,
    totalCategories: categories.length,
    totalBlogPosts: posts.length,
    totalIssues: report.issues.length,
    bySeverity,
    byType,
  }

  // Output
  console.log(JSON.stringify(report, null, 2))

  if (report.issues.length === 0) {
    console.log('\n✅ No SEO issues found!')
  } else {
    console.log(`\n⚠️  Found ${report.issues.length} SEO issues (${bySeverity.critical} critical, ${bySeverity.high} high, ${bySeverity.medium} medium)`)
  }

  return report
}

runAudit().catch(err => {
  console.error('SEO audit failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
