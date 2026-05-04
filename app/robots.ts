import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants/site'

const BASE_URL = SITE_URL

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow with crawl delay
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/settings/',
          '/api/',
          '/auth/',
          '/theme-preview/',
          '/stacks/*/embed',
        ],
      },
      // Block AI training crawlers
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'ChatGPT-User', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Claude-Web', disallow: '/' },
      { userAgent: 'Applebot-Extended', disallow: '/' },
      { userAgent: 'PerplexityBot', disallow: '/' },
      { userAgent: 'Cohere-ai', disallow: '/' },
      { userAgent: 'Diffbot', disallow: '/' },
      // Block aggressive SEO crawlers
      { userAgent: 'AhrefsBot', disallow: '/' },
      { userAgent: 'SemrushBot', disallow: '/' },
      { userAgent: 'DotBot', disallow: '/' },
      { userAgent: 'MJ12bot', disallow: '/' },
      { userAgent: 'BLEXBot', disallow: '/' },
      { userAgent: 'DataForSeoBot', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'PetalBot', disallow: '/' },
      { userAgent: 'YandexBot', disallow: '/' },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
