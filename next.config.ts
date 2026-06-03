import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://rankinpublic.xyz" },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/pro',
        destination: '/register',
        permanent: true,
      },
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
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'logo.clearbit.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
    ],
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
}

export default nextConfig
