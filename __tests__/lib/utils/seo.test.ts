import { describe, it, expect } from 'vitest'
import {
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd,
  generateToolMetadata,
  generateJsonLd,
  generateFaqJsonLd,
} from '@/lib/utils/seo'
import type { ToolWithTags } from '@/lib/types'

const SITE_URL = 'https://aipowerstacks.com'

function makeTool(overrides: Partial<ToolWithTags> = {}): ToolWithTags {
  return {
    id: 'tool-1',
    name: 'TestTool',
    slug: 'test-tool',
    tagline: 'The best test tool',
    description: 'A comprehensive description of this tool for testing purposes, long enough to pass validations.',
    pricing_model: 'free',
    pricing_details: 'Always free, no credit card needed.',
    logo_url: 'https://example.com/logo.png',
    website_url: 'https://example.com',
    avg_rating: 4.5,
    review_count: 10,
    upvote_count: 100,
    status: 'published',
    is_verified: true,
    is_featured: false,
    screenshot_urls: ['https://example.com/screenshot.png'],
    categories: { id: 'cat-1', name: 'AI Tools', slug: 'ai-tools', icon: '🤖', color: '#ff0000' },
    tool_tags: [],
    ...overrides,
  } as unknown as ToolWithTags
}

describe('generateOrganizationJsonLd', () => {
  it('returns a Schema.org Organization object', () => {
    const ld = generateOrganizationJsonLd()
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toBe('Organization')
  })

  it('includes the site URL', () => {
    const ld = generateOrganizationJsonLd()
    expect(ld.url).toBe(SITE_URL)
  })

  it('includes sameAs links', () => {
    const ld = generateOrganizationJsonLd()
    expect(Array.isArray(ld.sameAs)).toBe(true)
    expect(ld.sameAs.length).toBeGreaterThan(0)
  })
})

describe('generateBreadcrumbJsonLd', () => {
  it('returns a BreadcrumbList', () => {
    const ld = generateBreadcrumbJsonLd([{ name: 'Home', url: '/' }])
    expect(ld['@type']).toBe('BreadcrumbList')
  })

  it('sets correct positions (1-indexed)', () => {
    const ld = generateBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' },
    ])
    expect(ld.itemListElement[0].position).toBe(1)
    expect(ld.itemListElement[1].position).toBe(2)
  })

  it('prepends SITE_URL to relative paths', () => {
    const ld = generateBreadcrumbJsonLd([{ name: 'Tools', url: '/tools' }])
    expect(ld.itemListElement[0].item).toBe(`${SITE_URL}/tools`)
  })

  it('leaves absolute URLs unchanged', () => {
    const ld = generateBreadcrumbJsonLd([{ name: 'External', url: 'https://other.com/page' }])
    expect(ld.itemListElement[0].item).toBe('https://other.com/page')
  })
})

describe('generateToolMetadata', () => {
  it('includes the tool name in the title', () => {
    const tool = makeTool()
    const meta = generateToolMetadata(tool)
    expect(meta.title).toContain('TestTool')
  })

  it('sets a canonical path', () => {
    const tool = makeTool()
    const meta = generateToolMetadata(tool)
    expect((meta.alternates as any).canonical).toBe('/tools/test-tool')
  })

  it('includes rating in description when reviews exist', () => {
    const tool = makeTool({ review_count: 5, avg_rating: 4.2 })
    const meta = generateToolMetadata(tool)
    expect(meta.description).toContain('4.2')
  })

  it('omits rating from description when no reviews', () => {
    const tool = makeTool({ review_count: 0 })
    const meta = generateToolMetadata(tool)
    expect(meta.description).not.toContain('/5')
  })

  it('uses screenshot as OpenGraph image when available', () => {
    const tool = makeTool({ screenshot_urls: ['https://example.com/shot.png'] })
    const meta = generateToolMetadata(tool)
    expect((meta.openGraph as any).images).toContain('https://example.com/shot.png')
  })

  it('falls back to logo when no screenshot', () => {
    const tool = makeTool({ screenshot_urls: null, logo_url: 'https://example.com/logo.png' })
    const meta = generateToolMetadata(tool)
    expect((meta.openGraph as any).images).toContain('https://example.com/logo.png')
  })
})

describe('generateJsonLd', () => {
  it('returns a SoftwareApplication schema', () => {
    const ld = generateJsonLd(makeTool())
    expect(ld['@type']).toBe('SoftwareApplication')
  })

  it('includes tool name and description', () => {
    const tool = makeTool()
    const ld = generateJsonLd(tool)
    expect(ld.name).toBe('TestTool')
    expect(ld.description).toBe(tool.description)
  })

  it('includes aggregateRating when reviews exist', () => {
    const ld = generateJsonLd(makeTool({ review_count: 5, avg_rating: 4.0 }))
    expect(ld.aggregateRating).toBeDefined()
    expect(ld.aggregateRating?.ratingValue).toBe(4.0)
    expect(ld.aggregateRating?.reviewCount).toBe(5)
  })

  it('omits aggregateRating when no reviews', () => {
    const ld = generateJsonLd(makeTool({ review_count: 0 }))
    expect(ld.aggregateRating).toBeUndefined()
  })

  it('sets price to 0 for free tools', () => {
    const ld = generateJsonLd(makeTool({ pricing_model: 'free' }))
    expect(ld.offers.price).toBe('0')
  })
})

describe('generateFaqJsonLd', () => {
  it('returns a FAQPage schema', () => {
    const ld = generateFaqJsonLd(makeTool())
    expect(ld['@type']).toBe('FAQPage')
  })

  it('includes three FAQ questions', () => {
    const ld = generateFaqJsonLd(makeTool())
    expect(ld.mainEntity).toHaveLength(3)
  })

  it('uses pricing_details in the cost answer when available', () => {
    const tool = makeTool({ pricing_details: 'Free forever plan available.' })
    const ld = generateFaqJsonLd(tool)
    const costQ = ld.mainEntity[1]
    expect(costQ.acceptedAnswer.text).toContain('Free forever plan available.')
  })

  it('falls back to pricing_model in cost answer', () => {
    const tool = makeTool({ pricing_details: null, pricing_model: 'freemium' })
    const ld = generateFaqJsonLd(tool)
    const costQ = ld.mainEntity[1]
    expect(costQ.acceptedAnswer.text).toContain('freemium')
  })

  it('includes rating in "is it good" answer when reviews exist', () => {
    const tool = makeTool({ review_count: 20, avg_rating: 4.8 })
    const ld = generateFaqJsonLd(tool)
    const ratingQ = ld.mainEntity[2]
    expect(ratingQ.acceptedAnswer.text).toContain('4.8')
    expect(ratingQ.acceptedAnswer.text).toContain('20')
  })

  it('prompts first review when no reviews exist', () => {
    const tool = makeTool({ review_count: 0 })
    const ld = generateFaqJsonLd(tool)
    const ratingQ = ld.mainEntity[2]
    expect(ratingQ.acceptedAnswer.text).toContain('first to review')
  })
})
