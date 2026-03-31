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
  const handleClick = useCallback(() => {
    track('outbound_click', {
      tool: toolName,
      slug: toolSlug ?? '',
      url: href,
      placement: placement ?? 'unknown',
    })
  }, [href, toolName, toolSlug, placement])

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
