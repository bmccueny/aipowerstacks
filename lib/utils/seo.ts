import type { Metadata } from 'next'
import type { ToolWithTags } from '@/lib/types'

export function generateToolMetadata(tool: ToolWithTags): Metadata {
  return {
    title: `${tool.name} — ${tool.tagline}`,
    description: tool.description.slice(0, 160),
    openGraph: {
      title: tool.name,
      description: tool.tagline,
      images: tool.logo_url ? [tool.logo_url] : [],
    },
    twitter: {
      card: 'summary',
      title: tool.name,
      description: tool.tagline,
    },
  }
}

export function generateJsonLd(tool: ToolWithTags) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: tool.website_url,
    applicationCategory: 'AIApplication',
    offers: tool.pricing_model === 'free' ? {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    } : undefined,
    aggregateRating: tool.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: tool.avg_rating,
      reviewCount: tool.review_count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }
}
