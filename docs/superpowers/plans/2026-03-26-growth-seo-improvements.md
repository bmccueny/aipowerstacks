# Growth & SEO Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 8 high-impact growth improvements: expand comparison sitemap, add matchmaker email capture, add LinkedIn social automation, SEO-optimize blog titles, auto-link blog content to tool pages, add BreadcrumbList to tool pages, add FAQ markup to tool pages, and add pricing JSON-LD for paid tools.

**Architecture:** All changes modify existing files. SEO improvements go in `lib/utils/seo.ts`. Newsletter capture reuses existing `NewsletterBanner` component. LinkedIn adapter extends the existing social posts cron. Blog SEO + internal linking extend the blog posts cron pipeline.

**Tech Stack:** Next.js 16, Supabase, TypeScript, Grok API (for AI generation)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/sitemap.ts` | Modify | Expand comparison pairs from 50 → 500 |
| `app/(public)/matchmaker/results/page.tsx` | Modify | Add newsletter opt-in after results |
| `app/api/cron/social-posts/route.ts` | Modify | Add LinkedIn post generation alongside Twitter |
| `app/api/cron/blog-posts/route.ts` | Modify | Add SEO keyword targeting step before writing |
| `lib/utils/seo.ts` | Modify | Add pricing Offer JSON-LD for paid tools |
| `lib/utils/blog-internal-links.ts` | Create | Auto-link tool names in blog content to tool pages |
| `app/api/newsletter/route.ts` | Read only | Understand existing newsletter API for reuse |

---

### Task 1: Expand comparison pairs in sitemap (50 → 500)

**Files:**
- Modify: `app/sitemap.ts:18-87`

- [ ] **Step 1: Update the tool query limit and pair cap**

In `app/sitemap.ts`, change the vs tools query to fetch more tools and raise the cap:

```typescript
// Line 24: change .limit(40) to .limit(200)
.limit(200),

// Line 74: change vsUrls.length < 50 to vsUrls.length < 500
for (let i = 0; i < catTools.length && vsUrls.length < 500; i++) {
  for (let j = i + 1; j < catTools.length && vsUrls.length < 500; j++) {
```

- [ ] **Step 2: Verify the build still succeeds**

Run: `cd /home/bm/aipowerstacks && npx next build 2>&1 | tail -20`
Expected: Build succeeds, sitemap generates without error.

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(seo): expand comparison pairs in sitemap from 50 to 500"
```

---

### Task 2: Add newsletter opt-in to matchmaker results page

**Files:**
- Modify: `app/(public)/matchmaker/results/page.tsx`

- [ ] **Step 1: Add NewsletterBanner import and insert after results**

Add import at top:
```typescript
import { NewsletterBanner } from '@/components/layout/NewsletterBanner'
```

Insert between the "Track These in My Budget" button section and the closing `</div>`, after line 141 (after the "Powered by" `<p>` tag inside the text-center div):

```tsx
          {/* ═══ Newsletter opt-in ═══ */}
          <div className="mt-10 max-w-md mx-auto">
            <p className="text-sm font-semibold text-foreground mb-1 text-center">
              Get weekly updates on these tools
            </p>
            <p className="text-xs text-muted-foreground mb-3 text-center">
              Price changes, new alternatives, and overlap alerts.
            </p>
            <NewsletterBanner source="matchmaker-results" />
          </div>
```

- [ ] **Step 2: Verify the page renders correctly**

Run: `cd /home/bm/aipowerstacks && npx next build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "app/(public)/matchmaker/results/page.tsx"
git commit -m "feat(growth): add newsletter opt-in to matchmaker results page"
```

---

### Task 3: Add pricing Offer JSON-LD for paid tools

**Files:**
- Modify: `lib/utils/seo.ts:93-121` (the `generateJsonLd` function)

- [ ] **Step 1: Extend the Offer JSON-LD to cover paid tools**

Replace the existing pricing_model conditional in `generateJsonLd` (lines 105-112) with:

```typescript
    ...(() => {
      if (tool.pricing_model === 'free') {
        return {
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        }
      }
      if (tool.pricing_model === 'freemium' || tool.pricing_model === 'paid' || tool.pricing_model === 'subscription') {
        return {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            ...(tool.pricing_model === 'freemium' ? { lowPrice: '0' } : {}),
            ...(tool.pricing_details ? { description: tool.pricing_details } : {}),
          },
        }
      }
      return {}
    })(),
```

- [ ] **Step 2: Verify build succeeds**

Run: `cd /home/bm/aipowerstacks && npx next build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add lib/utils/seo.ts
git commit -m "feat(seo): add pricing Offer JSON-LD for freemium and paid tools"
```

---

### Task 4: Add LinkedIn posts to social cron

**Files:**
- Modify: `app/api/cron/social-posts/route.ts`

- [ ] **Step 1: Add LinkedIn content generator function**

After the `generateEngagement()` function (around line 165), add:

```typescript
async function adaptForLinkedIn(twitterContent: string, postType: PostType): Promise<string> {
  const prompt = `Rewrite this tweet as a LinkedIn post (max 500 chars). Keep the same core message but adapt the tone for a professional B2B audience. No hashtags. No emojis. No "I'm excited to announce" or "Thrilled to share" openings.

Tweet: ${twitterContent}
Post type: ${postType}

RULES:
- Professional but not corporate-speak
- Add one extra sentence of context or insight
- If it's a question, frame it as inviting professional discussion
- Do NOT use em dashes, en dashes, or semicolons
- NEVER use hashtags

Respond with ONLY the LinkedIn post text, nothing else.`

  return callGrok(prompt)
}
```

- [ ] **Step 2: Modify the main loop to generate both Twitter and LinkedIn versions**

In the main loop (around line 336, after `content = stripHashtags(content)`), add LinkedIn generation and insert:

```typescript
      content = stripHashtags(content)

      // Generate LinkedIn version
      let linkedInContent = ''
      try {
        linkedInContent = stripHashtags(await adaptForLinkedIn(content, postType))
      } catch {
        // LinkedIn generation failed, continue with Twitter only
      }
```

Then after the existing Twitter insert (around line 346), add:

```typescript
      // Insert LinkedIn post if generated
      if (linkedInContent) {
        const { error: liError } = await supabase.from('social_posts').insert({
          platform: 'linkedin',
          post_type: postType,
          content: linkedInContent,
          hashtags: [],
          link_url: linkUrl,
          link_title: linkTitle,
          source_type: sourceType,
          source_id: sourceId,
          status: 'draft',
        })
        if (!liError) {
          results.push({ type: `${postType}_linkedin`, status: 'created', content: linkedInContent.slice(0, 100) })
        }
      }
```

- [ ] **Step 3: Verify build succeeds**

Run: `cd /home/bm/aipowerstacks && npx next build 2>&1 | tail -20`
Expected: Build succeeds. Note: The `social_posts` table must already have `platform` column that accepts 'linkedin'. Check the table schema if the insert fails at runtime.

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/social-posts/route.ts
git commit -m "feat(growth): add LinkedIn post generation to social cron"
```

---

### Task 5: Create blog internal linking utility

**Files:**
- Create: `lib/utils/blog-internal-links.ts`

- [ ] **Step 1: Create the internal linking function**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

interface ToolLink {
  name: string
  slug: string
}

let cachedTools: ToolLink[] | null = null

async function getToolNames(): Promise<ToolLink[]> {
  if (cachedTools) return cachedTools
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tools')
    .select('name, slug')
    .eq('status', 'published')
    .order('name')
  cachedTools = data ?? []
  return cachedTools
}

/**
 * Replace first occurrence of each known tool name in HTML content
 * with an internal link to its tool page. Skips names already inside
 * an <a> tag or heading. Case-insensitive matching.
 */
export async function addInternalLinks(html: string): Promise<string> {
  const tools = await getToolNames()
  let result = html
  const linked = new Set<string>()

  // Sort by name length descending to match longer names first (e.g. "Claude Code" before "Claude")
  const sorted = [...tools].sort((a, b) => b.name.length - a.name.length)

  for (const tool of sorted) {
    if (linked.size >= 5) break // Max 5 internal links per post
    if (tool.name.length < 3) continue // Skip very short names

    // Match tool name not already inside an <a> tag or heading
    const pattern = new RegExp(
      `(?<!<a[^>]*>.*?)(?<!<h[1-6][^>]*>.*?)\\b(${tool.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b(?![^<]*<\\/a>)(?![^<]*<\\/h[1-6]>)`,
      'i',
    )

    if (pattern.test(result) && !linked.has(tool.slug)) {
      result = result.replace(
        pattern,
        `<a href="/tools/${tool.slug}" class="text-primary hover:underline">$1</a>`,
      )
      linked.add(tool.slug)
    }
  }

  return result
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/utils/blog-internal-links.ts
git commit -m "feat(seo): create blog internal linking utility"
```

---

### Task 6: Integrate internal linking into blog posts cron

**Files:**
- Modify: `app/api/cron/blog-posts/route.ts`

This task requires finding where blog content is inserted into the database in the blog-posts cron route. The internal linking function should be called on the generated HTML content just before the Supabase insert.

- [ ] **Step 1: Find the blog content insert location**

Read the full blog-posts cron to find where content is inserted into the `blog_posts` table. Look for the `.insert(` or `.upsert(` call.

- [ ] **Step 2: Add import and call addInternalLinks before insert**

Add at top of file:
```typescript
import { addInternalLinks } from '@/lib/utils/blog-internal-links'
```

Before the Supabase insert of the blog post content, add:
```typescript
const linkedContent = await addInternalLinks(generatedContent)
```

Then use `linkedContent` instead of `generatedContent` in the insert.

- [ ] **Step 3: Verify build succeeds**

Run: `cd /home/bm/aipowerstacks && npx next build 2>&1 | tail -20`

- [ ] **Step 4: Commit**

```bash
git add app/api/cron/blog-posts/route.ts lib/utils/blog-internal-links.ts
git commit -m "feat(seo): add automatic internal linking to blog post generation"
```

---

### Task 7: Add SEO keyword targeting to blog post generation

**Files:**
- Modify: `app/api/cron/blog-posts/route.ts`

- [ ] **Step 1: Find the blog title/topic generation prompt**

Read the blog-posts cron to find where the AI is prompted to generate the blog post. The SEO optimization goes into the system prompt or topic selection step.

- [ ] **Step 2: Add SEO instruction to the writing prompt**

In the prompt that generates the blog post content, add these instructions:

```
SEO RULES:
- The title MUST contain a specific, searchable keyword phrase (e.g. "best AI coding tools 2026" not "the state of coding")
- Use the primary keyword in the first paragraph
- Use 2-3 related keywords naturally throughout
- Title should be 50-60 characters for optimal SERP display
- Write a meta description (under 155 chars) as the first line, prefixed with "META:"
```

- [ ] **Step 3: Parse the META description from the generated content**

After the AI generates the content, extract the meta description:
```typescript
let metaDescription: string | undefined
const metaMatch = generatedContent.match(/^META:\s*(.+)\n/)
if (metaMatch) {
  metaDescription = metaMatch[1].trim()
  generatedContent = generatedContent.replace(/^META:\s*.+\n/, '')
}
```

Use `metaDescription` as the `excerpt` field in the blog post insert if available.

- [ ] **Step 4: Verify build succeeds**

Run: `cd /home/bm/aipowerstacks && npx next build 2>&1 | tail -20`

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/blog-posts/route.ts
git commit -m "feat(seo): add keyword targeting to auto-generated blog posts"
```

---

### Task 8: Verify all changes together

- [ ] **Step 1: Run full build**

```bash
cd /home/bm/aipowerstacks && npx next build 2>&1 | tail -30
```

Expected: Clean build with no errors.

- [ ] **Step 2: Run tests**

```bash
cd /home/bm/aipowerstacks && npm test 2>&1
```

Expected: All existing tests pass.

- [ ] **Step 3: Final commit if any fixups needed**

```bash
git add -A && git commit -m "fix: address any build/test issues from growth improvements"
```
