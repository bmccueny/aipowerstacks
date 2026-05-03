'use client'

import { track } from '@vercel/analytics'
import { type ReactNode, useCallback } from 'react'

interface OutboundLinkProps {
  href: string
  toolName: string
  toolSlug?: string
  /** Where the link appears: hero, sidebar, mobile-bar, listing, etc. */
  placement?: string
  className?: string
  children: ReactNode
}

export function OutboundLink({
  href,
  toolName,
  toolSlug,
  placement,
  className,
  children,
}: OutboundLinkProps) {
  const isAffiliate = href.includes('?ref=') || href.includes('?fpr=') || href.includes('?via=') || href.includes('?pc=') || href.includes('?r=')

  const handleClick = useCallback(() => {
    track('outbound_click', {
      tool: toolName,
      slug: toolSlug ?? '',
      url: href,
      placement: placement ?? 'unknown',
      is_affiliate: isAffiliate ? 'true' : 'false',
    })
    if (isAffiliate && toolSlug) {
      fetch('/api/tracker/affiliate-click', {
        method: 'POST',
        body: JSON.stringify({ tool_slug: toolSlug, placement }),
      }).catch(() => {})
    }
  }, [href, toolName, toolSlug, placement, isAffiliate])

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}
