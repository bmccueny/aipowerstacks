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
    <footer className="border-t border-foreground/[0.06] bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <BrandMark className="h-5 w-5" />
              <span className="font-display text-[1.05rem] tracking-[-0.03em]">
                <span className="text-primary font-extrabold">AI</span><span className="font-normal">PowerStacks</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Discover and compare AI tools by use case, pricing, and integrations. Verified listings and real user reviews, updated every day.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <a href={shareLinks.x} target="_blank" rel="noopener noreferrer" aria-label="Share on X" className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <XIcon className="h-4 w-4" />
              </a>
              <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <LinkedInIcon className="h-4 w-4" />
              </a>
              <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <FacebookIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-medium mb-4 text-muted-foreground">{category}</h3>
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
