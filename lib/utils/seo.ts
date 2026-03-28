import type { Metadata } from 'next'
import type { ToolWithTags } from '@/lib/types'
import { SITE_URL } from '@/lib/constants/site'

/** Truncate text at the nearest word boundary without cutting mid-word */
function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const truncated = text.slice(0, maxLen)
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated
}

/** Map tool category slugs to Schema.org applicationCategory values */
const CATEGORY_MAP: Record<string, string> = {
  'ai-coding': 'DeveloperApplication',
  'ai-writing': 'BusinessApplication',
  'ai-image-generation': 'MultimediaApplication',
  'ai-video': 'MultimediaApplication',
  'ai-audio': 'MultimediaApplication',
  'ai-music': 'MultimediaApplication',
  'ai-design': 'DesignApplication',
  'ai-productivity': 'BusinessApplication',
  'ai-marketing': 'BusinessApplication',
  'ai-sales': 'BusinessApplication',
  'ai-customer-support': 'BusinessApplication',
  'ai-education': 'EducationalApplication',
  'ai-research': 'ReferenceApplication',
  'ai-data-analysis': 'BusinessApplication',
  'ai-finance': 'FinanceApplication',
  'ai-healthcare': 'HealthApplication',
  'ai-security': 'SecurityApplication',
  'ai-chatbots': 'SocialNetworkingApplication',
  'ai-search': 'ReferenceApplication',
  'ai-automation': 'UtilitiesApplication',
}

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
  const shortDescription = truncateAtWord(tool.description, 155)
  const title = `${tool.name} Review, Pricing & Alternatives`
  const description = truncateAtWord(`${tool.tagline} ${tool.review_count > 0 ? `Rated ${tool.avg_rating.toFixed(1)}/5 by ${tool.review_count} users.` : ''}`, 160)
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
    applicationCategory: tool.categories?.slug ? (CATEGORY_MAP[tool.categories.slug] ?? 'BusinessApplication') : 'BusinessApplication',
    operatingSystem: 'Any',
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
      if (tool.pricing_model === 'freemium' || tool.pricing_model === 'paid' || tool.pricing_model === 'trial') {
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
    aggregateRating: tool.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: tool.avg_rating,
      reviewCount: tool.review_count,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }
}

/** Generate CollectionPage + ItemList JSON-LD for directory listing pages */
export function generateItemListJsonLd(
  items: { name: string; url: string; position?: number }[],
  listName: string,
  listUrl: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: listName,
    url: listUrl.startsWith('http') ? listUrl : `${SITE_URL}${listUrl}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: item.position ?? index + 1,
        name: item.name,
        url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
      })),
    },
  }
}

/** Generate Blog JSON-LD for the blog index page */
export function generateBlogJsonLd(
  posts: { title: string; slug: string; excerpt?: string | null; published_at?: string | null }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'AIPowerStacks AI News & Briefings',
    url: `${SITE_URL}/blog`,
    description: 'Daily AI news and briefings for builders: what changed, why it matters, and what to do next.',
    publisher: {
      '@type': 'Organization',
      name: 'AIPowerStacks',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    blogPost: posts.slice(0, 10).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      ...(post.excerpt ? { description: post.excerpt } : {}),
      ...(post.published_at ? { datePublished: post.published_at } : {}),
    })),
  }
}

/** Generate Review JSON-LD for individual published reviews on a tool page */
export function generateReviewsJsonLd(
  tool: ToolWithTags,
  reviews: { rating: number; title: string | null; body: string | null; created_at: string; profiles: { display_name: string | null } }[],
) {
  if (reviews.length === 0) return null
  return reviews.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: tool.name,
      url: `${SITE_URL}/tools/${tool.slug}`,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person',
      name: review.profiles.display_name || 'Anonymous',
    },
    datePublished: review.created_at,
    ...(review.title ? { name: review.title } : {}),
    ...(review.body ? { reviewBody: review.body.slice(0, 500) } : {}),
  }))
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
