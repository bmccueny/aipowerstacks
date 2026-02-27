import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { NewsletterBanner } from './NewsletterBanner'

const footerLinks = {
  Directory: [
    { href: '/tools', label: 'All AI Tools' },
    { href: '/tools?pricing=free', label: 'Free Tools' },
    { href: '/tools?pricing=freemium', label: 'Freemium Tools' },
    { href: '/categories', label: 'Categories' },
    { href: '/submit', label: 'Submit a Tool' },
  ],
  Content: [
    { href: '/blog', label: 'AI News' },
    { href: '/blog?featured=true', label: 'Featured Articles' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-bold">AIxplore</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Discover the best AI tools for every task. Updated daily with the latest in artificial intelligence.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-3">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 mb-8 max-w-sm">
          <NewsletterBanner source="footer" />
        </div>
        <div className="mt-4 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AIxplore. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            5,000+ AI tools and counting
          </p>
        </div>
      </div>
    </footer>
  )
}
