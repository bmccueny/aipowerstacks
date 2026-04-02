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
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
