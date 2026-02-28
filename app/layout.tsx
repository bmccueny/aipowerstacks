import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { SITE_URL } from '@/lib/constants/site'
import { JsonLd } from '@/components/common/JsonLd'
import { generateOrganizationJsonLd } from '@/lib/utils/seo'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'AIPowerStacks — Discover the Best AI Tools',
    template: '%s | AIPowerStacks',
  },
  description: 'Discover 5,000+ AI tools organized by category. Find the best AI tools for writing, coding, image generation, video, productivity, and more.',
  alternates: {
    canonical: '/',
  },
  keywords: ['AI tools', 'artificial intelligence', 'AI directory', 'machine learning tools'],
  authors: [{ name: 'AIPowerStacks' }],
  creator: 'AIPowerStacks',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AIPowerStacks',
    title: 'AIPowerStacks — Discover the Best AI Tools',
    description: 'Discover 5,000+ AI tools organized by category.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIPowerStacks — Discover the Best AI Tools',
    description: 'Discover 5,000+ AI tools organized by category.',
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
    <html lang="en" className={GeistSans.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <JsonLd data={generateOrganizationJsonLd()} />
      </head>
      <body className="antialiased">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
