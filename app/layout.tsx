import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Inter } from 'next/font/google'
import { SITE_URL } from '@/lib/constants/site'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
})


import { JsonLd } from '@/components/common/JsonLd'
import { generateOrganizationJsonLd } from '@/lib/utils/seo'
import { Toaster } from 'sonner'
import TwinklingStars from '@/components/common/TwinklingStars'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AIPowerStacks | Discover & Compare AI Tools',
    template: '%s | AIPowerStacks',
  },
  description: 'Discover and compare AI tools side-by-side. Filter by use case, pricing, and integrations. Verified listings, real user reviews, and daily updates.',
  alternates: {
    canonical: '/',
  },
  keywords: [
    'AI tools directory',
    'best AI tools 2026',
    'compare AI tools',
    'AI tools for business',
    'AI writing tools',
    'AI coding tools',
    'AI image generator',
    'AI video tools',
    'AI productivity tools',
    'AI tools for marketing',
    'AI tool finder',
    'free AI tools',
    'AI software comparison',
    'artificial intelligence tools',
    'machine learning tools',
  ],
  authors: [{ name: 'AIPowerStacks' }],
  creator: 'AIPowerStacks',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AIPowerStacks',
    title: 'AIPowerStacks | Track Your AI Spend & Stop Overpaying',
    description: 'How much is AI costing you? Track subscriptions, detect overlap, and find where you\'re overspending.',
    images: [{ url: '/og-home-v3.png', width: 1200, height: 630, alt: 'AIPowerStacks - How much is AI costing you?' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@aipowerstacks',
    title: 'AIPowerStacks | Track Your AI Spend & Stop Overpaying',
    description: 'How much is AI costing you? Track subscriptions, detect overlap, and find where you\'re overspending.',
    images: ['/og-home-v3.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#09090b" />
        <link rel="alternate" type="application/rss+xml" title="AIPowerStacks Blog RSS" href="/api/rss" />
        <JsonLd data={generateOrganizationJsonLd()} />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'AIPowerStacks',
          url: SITE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_URL}/tools?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        }} />
      </head>
      <body className="antialiased">
        <div className="stars" aria-hidden="true" />
        <div className="nebula" aria-hidden="true" />
        <TwinklingStars />
        <div className="relative z-[1]">
          {children}
        </div>
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            className: '!rounded-2xl !border-foreground/10 !backdrop-blur-xl !bg-background/80 !shadow-xl',
          }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
