import Link from 'next/link'
import { BrandMark } from '@/components/common/BrandMark'
import { FacebookIcon, LinkedInIcon, XIcon } from '@/components/common/SocialIcons'
import { SITE_URL } from '@/lib/constants/site'
import { NewsletterBanner } from './NewsletterBanner'

const footerLinks = {
  Directory: [
    { href: '/tools', label: 'All AI Tools' },
    { href: '/compare', label: 'Compare Tools' },
    { href: '/tools?pricing=free', label: 'Free Tools' },
    { href: '/tools?pricing=freemium', label: 'Freemium Tools' },
    { href: '/categories', label: 'Categories' },
    { href: '/submit', label: 'Submit a Tool' },
  ],
  Content: [
    { href: '/blog', label: 'AI News' },
    { href: '/blog?featured=true', label: 'Featured Articles' },
    { href: '/changelog', label: 'Changelog' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/advertise', label: 'Advertise' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
}

export function Footer() {
  const siteUrl = SITE_URL
  const encodedSiteUrl = encodeURIComponent(siteUrl)
  const shareLinks = {
    x: `https://x.com/intent/tweet?url=${encodedSiteUrl}&text=${encodeURIComponent('Discover and compare AI tools side-by-side on AIPowerStacks')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedSiteUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedSiteUrl}`,
  }

  return (
    <footer className="border-t border-white/20 dark:border-white/10 glass-card relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <svg viewBox="0 0 1200 200" className="w-full h-full">
          <defs>
            <pattern id="footer-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="currentColor" opacity="0.3" />
              <circle cx="50" cy="50" r="1.5" fill="currentColor" opacity="0.2" />
              <rect x="25" y="25" width="10" height="10" rx="2" fill="currentColor" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-pattern)" />
        </svg>
      </div>

      {/* Animated gradient accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-prism opacity-40"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 glass-card rounded-2xl border border-border/50 px-3 py-2 hover:scale-105 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <BrandMark className="h-5 w-5 relative z-10" />
              <span className="font-display font-black text-[1.05rem] tracking-[-0.03em] relative z-10">
                <span className="text-primary">AI</span>PowerStacks
              </span>
              {/* Decorative sparkles */}
              <div className="absolute -top-1 -right-1 w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-60 animate-ping" style={{ animationDuration: '1.5s' }}></div>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Discover and compare AI tools by use case, pricing, and integrations. Verified listings and real user reviews, updated every day.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">Share</span>
              <div className="flex items-center gap-2">
                <a
                  href={shareLinks.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on X"
                  className="group relative p-3 glass-card rounded-lg border border-border/30 hover:border-cyan-400/50 transition-all duration-300 hover:scale-110"
                >
                  <XIcon className="h-4 w-4 text-muted-foreground group-hover:text-cyan-400 transition-colors duration-300" />
                  <div className="absolute inset-0 bg-cyan-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn"
                  className="group relative p-3 glass-card rounded-lg border border-border/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-110"
                >
                  <LinkedInIcon className="h-4 w-4 text-muted-foreground group-hover:text-purple-400 transition-colors duration-300" />
                  <div className="absolute inset-0 bg-purple-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Facebook"
                  className="group relative p-3 glass-card rounded-lg border border-border/30 hover:border-pink-400/50 transition-all duration-300 hover:scale-110"
                >
                  <FacebookIcon className="h-4 w-4 text-muted-foreground group-hover:text-pink-400 transition-colors duration-300" />
                  <div className="absolute inset-0 bg-pink-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
              </div>
            </div>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-base font-bold mb-4 text-foreground uppercase tracking-wide">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-[4px]"
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
          <NewsletterBanner source="footer" tone="dark" />
        </div>
        <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AIPowerStacks. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            New AI tool listings added daily.
          </p>
        </div>
      </div>
    </footer>
  )
}
