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
    x: `https://x.com/intent/tweet?url=${encodedSiteUrl}&text=${encodeURIComponent('Compare 5,000+ AI tools side-by-side on AIPowerStacks')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedSiteUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedSiteUrl}`,
  }

  return (
    <footer className="border-t-[1.5px] border-white/20 bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 rounded-full border-[1.5px] border-white bg-white px-3 py-1.5 text-black shadow-[2px_2px_0_0_#fff]">
              <BrandMark className="h-5 w-5" variant="dark" />
              <span className="font-display font-black text-[1.05rem] tracking-[-0.03em] text-black">
                <span style={{ color: 'oklch(0.79 0.17 355)' }}>AI</span>PowerStacks
              </span>
            </Link>
            <p className="text-sm text-white/85 max-w-xs leading-relaxed">
              Compare 5,000+ AI tools by use case, pricing, and integrations. Verified listings and real user reviews, updated every day.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/65">Share</span>
              <a
                href={shareLinks.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X"
                className="social-icon-btn social-icon-btn--dark"
              >
                <XIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on LinkedIn"
                className="social-icon-btn social-icon-btn--dark"
              >
                <LinkedInIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Facebook"
                className="social-icon-btn social-icon-btn--dark"
              >
                <FacebookIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-base font-bold mb-4 text-white uppercase tracking-wide">{category}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/85 hover:text-white transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-[4px]"
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
        <div className="pt-6 border-t-[1.5px] border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/75">
            © {new Date().getFullYear()} AIPowerStacks. All rights reserved.
          </p>
          <p className="text-sm text-white/75">
            5,000+ AI tools compared. New listings added daily.
          </p>
        </div>
      </div>
    </footer>
  )
}
