import { describe, it, expect } from 'vitest'
import {
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd,
  generateItemListJsonLd,
} from '@/lib/utils/seo'

describe('generateOrganizationJsonLd', () => {
  it('returns valid Organization schema', () => {
    const result = generateOrganizationJsonLd()
    expect(result['@context']).toBe('https://schema.org')
    expect(result['@type']).toBe('Organization')
    expect(result.name).toBe('AIPowerStacks')
    expect(result.url).toBeDefined()
    expect(result.logo).toContain('/logo.png')
  })
})

describe('generateBreadcrumbJsonLd', () => {
  it('creates a breadcrumb list with correct positions', () => {
    const items = [
      { name: 'Home', url: '/' },
      { name: 'Tools', url: '/tools' },
      { name: 'ChatGPT', url: '/tools/chatgpt' },
    ]
    const result = generateBreadcrumbJsonLd(items)
    expect(result['@type']).toBe('BreadcrumbList')
    expect(result.itemListElement).toHaveLength(3)
    expect(result.itemListElement[0].position).toBe(1)
    expect(result.itemListElement[2].position).toBe(3)
    expect(result.itemListElement[2].name).toBe('ChatGPT')
  })

  it('prefixes relative URLs with site URL', () => {
    const items = [{ name: 'Home', url: '/' }]
    const result = generateBreadcrumbJsonLd(items)
    expect(result.itemListElement[0].item).toMatch(/^https?:\/\//)
  })

  it('preserves absolute URLs', () => {
    const items = [{ name: 'External', url: 'https://example.com' }]
    const result = generateBreadcrumbJsonLd(items)
    expect(result.itemListElement[0].item).toBe('https://example.com')
  })
})

describe('generateItemListJsonLd', () => {
  it('creates an item list from tool data', () => {
    const tools = [
      { name: 'ChatGPT', slug: 'chatgpt' },
      { name: 'Claude', slug: 'claude' },
    ]
    const result = generateItemListJsonLd(
      tools.map((t) => ({ name: t.name, url: `/tools/${t.slug}` })),
      'AI Tools',
      '/tools'
    )
    expect(result.mainEntity['@type']).toBe('ItemList')
    expect(result.mainEntity.itemListElement).toHaveLength(2)
    expect(result.mainEntity.itemListElement[0].position).toBe(1)
  })
})
