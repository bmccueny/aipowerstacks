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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'www.aixploria.com' },
      { protocol: 'https', hostname: 's2.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.arstechnica.net' },
      { protocol: 'https', hostname: 'o.aolcdn.com' },
      { protocol: 'https', hostname: 'images.ctfassets.net' },
      { protocol: 'https', hostname: 'the-decoder.com' },
      { protocol: 'https', hostname: 'venturebeat.com' },
      { protocol: 'https', hostname: 'image.thum.io' },
    ],
  },
}

export default nextConfig
