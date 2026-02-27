import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'AIxplore — Discover the Best AI Tools',
    template: '%s | AIxplore',
  },
  description: 'Discover 5,000+ AI tools organized by category. Find the best AI tools for writing, coding, image generation, video, productivity, and more.',
  keywords: ['AI tools', 'artificial intelligence', 'AI directory', 'machine learning tools'],
  authors: [{ name: 'AIxplore' }],
  creator: 'AIxplore',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AIxplore',
    title: 'AIxplore — Discover the Best AI Tools',
    description: 'Discover 5,000+ AI tools organized by category.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIxplore — Discover the Best AI Tools',
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
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
