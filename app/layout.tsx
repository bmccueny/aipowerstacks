import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Space_Grotesk, Reddit_Sans } from 'next/font/google'
import { SITE_URL } from '@/lib/constants/site'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-display',
})

const redditSans = Reddit_Sans({
  subsets: ['latin'],
  variable: '--font-reddit',
})

import { CompareProvider } from '@/lib/context/CompareContext'
import { JsonLd } from '@/components/common/JsonLd'
import { generateOrganizationJsonLd } from '@/lib/utils/seo'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AIPowerStacks | Compare 5,000+ AI Tools by Use Case',
    template: '%s | AIPowerStacks',
  },
  description: 'Compare 5,000+ AI tools side-by-side. Filter by use case, pricing, and integrations. Verified listings, real user reviews, and daily updates.',
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
    icon: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AIPowerStacks',
    title: 'AIPowerStacks | Compare 5,000+ AI Tools by Use Case',
    description: 'Find, compare, and shortlist AI tools in seconds. 5,000+ verified listings with real user reviews, updated daily.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIPowerStacks | Compare 5,000+ AI Tools by Use Case',
    description: 'Find, compare, and shortlist AI tools in seconds. 5,000+ verified listings with real user reviews, updated daily.',
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
    <html lang="en" className={`${GeistSans.variable} ${spaceGrotesk.variable} ${redditSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <JsonLd data={generateOrganizationJsonLd()} />
      </head>
      <body className="antialiased">
        <CompareProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </CompareProvider>
      </body>
    </html>
  )
}
