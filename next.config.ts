import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizeCss: true,
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/auth/sign-up',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/auth/sign-in',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/blog/ai-productivity',
        destination: '/blog/productivity',
        permanent: true,
      },
      {
        source: '/blog/productivity-tools',
        destination: '/blog/productivity',
        permanent: true,
      },
      {
        source: '/blog/ai-workflow',
        destination: '/blog/productivity',
        permanent: true,
      },
      // Deduplicate cannibalized blog posts
      {
        source: '/blog/chatgpt-vs-claude-vs-gemini-2026-mn510n2r',
        destination: '/blog/chatgpt-vs-claude-vs-gemini-2026',
        permanent: true,
      },
      {
        source: '/blog/best-ai-tools-for-developers-in-2026-mn75hxcl',
        destination: '/blog/best-ai-coding-tools-for-developers-in-2026-mn8jz90o',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
}

export default nextConfig
