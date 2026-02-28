import type { Metadata } from 'next'
import type { ToolWithTags } from '@/lib/types'
import { SITE_URL } from '@/lib/constants/site'

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AIPowerStacks',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      'https://twitter.com/aipowerstacks',
      'https://www.linkedin.com/company/aipowerstacks',
    ],
  }
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
}

export function generateToolMetadata(tool: ToolWithTags): Metadata {
  const shortDescription = tool.description.slice(0, 155)
  const title = `${tool.name} Review, Pricing & Alternatives`
  const description = `${tool.tagline} ${tool.review_count > 0 ? `Rated ${tool.avg_rating.toFixed(1)}/5 by ${tool.review_count} users.` : ''}`.slice(0, 160)
  const canonicalPath = `/tools/${tool.slug}`
  const canonicalUrl = `${SITE_URL}${canonicalPath}`

  return {
    title,
    description: description || shortDescription,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description: description || shortDescription,
      url: canonicalUrl,
      images: (tool.screenshot_urls as string[])?.[0] ? [(tool.screenshot_urls as string[])[0]] : tool.logo_url ? [tool.logo_url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || shortDescription,
      images: (tool.screenshot_urls as string[])?.[0] ? [(tool.screenshot_urls as string[])[0]] : tool.logo_url ? [tool.logo_url] : [],
    },
  }
}

export function generateJsonLd(tool: ToolWithTags) {
  const canonicalUrl = `${SITE_URL}/tools/${tool.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: canonicalUrl,
    image: tool.logo_url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: tool.pricing_model === 'free' ? '0' : undefined,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: tool.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: tool.avg_rating,
      reviewCount: tool.review_count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }
}

export function generateFaqJsonLd(tool: ToolWithTags) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is ${tool.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: tool.description.slice(0, 300),
        },
      },
      {
        '@type': 'Question',
        name: `How much does ${tool.name} cost?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: tool.pricing_details || `Pricing model: ${tool.pricing_model}. Visit the official website for current pricing.`,
        },
      },
      {
        '@type': 'Question',
        name: `Is ${tool.name} good?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: tool.review_count > 0
            ? `${tool.name} has a ${tool.avg_rating.toFixed(1)}/5 rating based on ${tool.review_count} user reviews.`
            : `There are no public ratings for ${tool.name} yet. Be the first to review it.`,
        },
      },
    ],
  }
}
